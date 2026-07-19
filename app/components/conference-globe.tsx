"use client";

import createGlobe, { type Marker } from "cobe";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react";
import { createPortal } from "react-dom";

import type { ConferenceEdition, Place, Publication } from "../data/portfolio";
import {
  coordinatesToAngles,
  getPublicationsForPlace,
} from "../lib/conference-model";
import {
  groupOverlappingLabels,
  isCobeMarkerVisible,
  type LabelGroup,
  type LabelRect,
} from "../lib/globe-label-collisions";

type ConferenceGlobeProps = {
  activePlace?: Place;
  activePlaceId?: string;
  conferenceEditions: ConferenceEdition[];
  onSelectPlace: (placeId: string) => void;
  places: Place[];
  publications: Publication[];
};

function easeAngle(current: number, target: number, amount: number) {
  let difference = target - current;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return current + difference * amount;
}

function getAnchorStyle(placeId: string) {
  return {
    "--marker-visibility": `var(--cobe-visible-${placeId}, 0)`,
    positionAnchor: `--cobe-${placeId}`,
  } as CSSProperties & {
    "--marker-visibility": string;
    positionAnchor: string;
  };
}

export function ConferenceGlobe({
  activePlace,
  activePlaceId,
  conferenceEditions,
  onSelectPlace,
  places,
  publications,
}: ConferenceGlobeProps) {
  const placesWithConferences = useMemo(
    () => places
      .map((place) => {
        const editions = conferenceEditions.filter(
          (edition) => edition.placeId === place.id,
        ).sort((a, b) => b.year - a.year);

        return {
          place,
          editions,
          editionLabels: [...new Set(editions.map(
            (edition) => `${edition.series}'${String(edition.year).slice(-2)}`,
          ))],
          publications: getPublicationsForPlace(
            place.id,
            conferenceEditions,
            publications,
          ),
        };
      })
      .filter(({ editions }) => editions.length > 0),
    [conferenceEditions, places, publications],
  );
  const placeDetailsById = useMemo(
    () => new Map(
      placesWithConferences.map((details) => [details.place.id, details]),
    ),
    [placesWithConferences],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [labelHost, setLabelHost] = useState<HTMLElement | null>(null);
  const [labelGroups, setLabelGroups] = useState<LabelGroup[]>(
    () => placesWithConferences.map(({ place }) => ({
      representativeId: place.id,
      placeIds: [place.id],
    })),
  );
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const labelGroupsRef = useRef(labelGroups);
  const interactionPausedRef = useRef(false);
  const activePlaceRef = useRef(activePlace);
  const targetRef = useRef(
    activePlace
      ? coordinatesToAngles(activePlace.latitude, activePlace.longitude)
      : { phi: 0.45, theta: 0.22 },
  );

  useEffect(() => {
    labelGroupsRef.current = labelGroups;
  }, [labelGroups]);

  useEffect(() => {
    activePlaceRef.current = activePlace;
    if (activePlace) {
      targetRef.current = coordinatesToAngles(
        activePlace.latitude,
        activePlace.longitude,
      );
    }
  }, [activePlace]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let size = Math.max(280, frame.clientWidth);
    let phi = targetRef.current.phi;
    let theta = targetRef.current.theta;
    let animationFrame = 0;
    let collisionFrame = 0;

    const buildMarkers = (): Marker[] =>
      placesWithConferences.map(({ place }) => ({
        id: place.id,
        location: [place.latitude, place.longitude] as [number, number],
        size: activePlaceRef.current?.id === place.id ? 0.085 : 0.045,
        color:
          activePlaceRef.current?.id === place.id
            ? ([1, 0.54, 0.45] as [number, number, number])
            : ([0.49, 0.78, 1] as [number, number, number]),
      }));

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: size * 2,
      height: size * 2,
      phi,
      theta,
      dark: 1,
      diffuse: 1.15,
      mapSamples: 12000,
      mapBrightness: 3.2,
      baseColor: [0.17, 0.21, 0.26],
      markerColor: [0.49, 0.78, 1],
      glowColor: [0.035, 0.05, 0.07],
      markerElevation: 0.025,
      opacity: 0.93,
      scale: 0.93,
      markers: buildMarkers(),
      arcs: [],
    });
    setLabelHost(canvas.parentElement);

    const updateLabelGroups = () => {
      const host = canvas.parentElement;
      if (!host) return;
      const hostStyle = getComputedStyle(host);
      const rectangles: LabelRect[] = placesWithConferences.map(({ place }) => {
        const anchor = Array.from(host.children).find((element) =>
          (element as HTMLElement).style.getPropertyValue("anchor-name") ===
            `--cobe-${place.id}`
        ) as HTMLElement | undefined;
        const anchorRect = anchor?.getBoundingClientRect();
        const width = Math.max(54, place.city.length * 5.8 + 18);
        const height = 24;
        const left = (anchorRect?.left ?? 0) - width / 2;
        const top = (anchorRect?.top ?? 0) - height - 6;

        return {
          id: place.id,
          left,
          top,
          right: left + width,
          bottom: top + height,
          visible: isCobeMarkerVisible(
            hostStyle.getPropertyValue(`--cobe-visible-${place.id}`),
          ),
        };
      });
      const nextGroups = groupOverlappingLabels(
        rectangles,
        activePlaceRef.current?.id,
      );
      if (JSON.stringify(nextGroups) !== JSON.stringify(labelGroupsRef.current)) {
        labelGroupsRef.current = nextGroups;
        setLabelGroups(nextGroups);
        setExpandedGroupId((current) =>
          nextGroups.some(
            (group) =>
              current ===
                `${activePlaceRef.current?.id ?? "ambient"}:${group.representativeId}`,
          ) ? current : null
        );
      }
    };

    const render = () => {
      const target = targetRef.current;
      if (activePlaceRef.current) {
        phi = easeAngle(phi, target.phi, reducedMotion ? 1 : 0.045);
        theta += (target.theta - theta) * (reducedMotion ? 1 : 0.045);
      } else if (!reducedMotion && !interactionPausedRef.current) {
        phi += 0.0022;
      }

      globe.update({
        width: size * 2,
        height: size * 2,
        phi,
        theta,
        markers: buildMarkers(),
        arcs: [],
      });
      if (collisionFrame % 8 === 0) updateLabelGroups();
      collisionFrame += 1;
      animationFrame = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(([entry]) => {
      size = Math.max(280, entry.contentRect.width);
    });
    resizeObserver.observe(frame);
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      globe.destroy();
    };
  }, [placesWithConferences]);

  function pauseGlobeInteraction() {
    interactionPausedRef.current = true;
  }

  function resumeGlobeInteraction() {
    interactionPausedRef.current = false;
  }

  function handleLabelBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      resumeGlobeInteraction();
      setExpandedGroupId(null);
    }
  }

  function renderPlaceLabel(
    details: (typeof placesWithConferences)[number],
  ) {
    const { place, editionLabels, publications: placePublications } = details;
    return (
      <div
        className="globe-label-stack"
        key={place.id}
        style={getAnchorStyle(place.id)}
        onPointerEnter={pauseGlobeInteraction}
        onPointerLeave={resumeGlobeInteraction}
        onFocus={pauseGlobeInteraction}
        onBlur={handleLabelBlur}
      >
        <button
          className={
            place.id === activePlaceId
              ? "globe-place-button is-active"
              : "globe-place-button"
          }
          type="button"
          aria-pressed={place.id === activePlaceId}
          onClick={() => onSelectPlace(place.id)}
        >
          <span className="globe-label-city">{place.city}</span>
          <span className="globe-place-details">
            <span className="globe-label-editions">
              {editionLabels.join(", ")}
            </span>
            <span className="globe-label-count">
              {placePublications.length} {placePublications.length === 1
                ? "publication"
                : "publications"}
            </span>
            <span className="globe-label-country">{place.country}</span>
          </span>
        </button>
      </div>
    );
  }

  const labelLayer = (
    <div className="globe-label-layer">
      {labelGroups.map((group) => {
        const representative = placeDetailsById.get(group.representativeId);
        if (!representative) return null;
        if (group.placeIds.length === 1) {
          return renderPlaceLabel(representative);
        }

        const groupKey = `${activePlaceId ?? "ambient"}:${group.representativeId}`;
        const expanded = expandedGroupId === groupKey;
        return (
          <div
            className="globe-label-stack globe-label-cluster"
            key={group.representativeId}
            style={getAnchorStyle(group.representativeId)}
            onPointerEnter={pauseGlobeInteraction}
            onPointerLeave={() => {
              resumeGlobeInteraction();
              setExpandedGroupId(null);
            }}
            onFocus={pauseGlobeInteraction}
            onBlur={handleLabelBlur}
          >
            <button
              className="globe-cluster-button"
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpandedGroupId(groupKey)}
              onPointerEnter={() => setExpandedGroupId(groupKey)}
              onFocus={() => setExpandedGroupId(groupKey)}
            >
              {group.placeIds.length}
              <span className="sr-only"> nearby conference places</span>
            </button>
            {expanded ? (
              <div className="globe-cluster-menu">
                {group.placeIds.map((placeId) => {
                  const details = placeDetailsById.get(placeId);
                  if (!details) return null;
                  const paperCount = details.publications.length;
                  return (
                    <button
                      type="button"
                      key={placeId}
                      onClick={() => {
                        setExpandedGroupId(null);
                        onSelectPlace(details.place.id);
                      }}
                    >
                      <span>{details.place.city}</span>
                      <small>
                        {details.editionLabels.join(", ")} · {paperCount}{" "}
                        {paperCount === 1 ? "publication" : "publications"}
                      </small>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="globe-unit">
      <div
        className="globe-frame"
        ref={frameRef}
        onPointerDown={(event) => {
          if (!(event.target as Element).closest(".globe-label-cluster")) {
            setExpandedGroupId(null);
          }
        }}
      >
        <canvas ref={canvasRef} className="globe-canvas" aria-hidden="true" />
        <div className="globe-orbit globe-orbit-one" aria-hidden="true" />
        <div className="globe-orbit globe-orbit-two" aria-hidden="true" />

        {labelHost ? createPortal(labelLayer, labelHost) : labelLayer}

        <div className="conference-index-fallback" aria-label="Conference places">
          {placesWithConferences.map(({ place, editionLabels, publications: placePublications }) => (
            <button
              className={place.id === activePlaceId ? "is-active" : undefined}
              type="button"
              key={place.id}
              aria-pressed={place.id === activePlaceId}
              onClick={() => onSelectPlace(place.id)}
            >
              <span className="globe-label-city">{place.city}</span>
              <span className="globe-place-details">
                <span className="globe-label-editions">
                  {editionLabels.join(", ")}
                </span>
                <span className="globe-label-count">
                  {placePublications.length} {placePublications.length === 1
                    ? "publication"
                    : "publications"}
                </span>
                <span className="globe-label-country">{place.country}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
