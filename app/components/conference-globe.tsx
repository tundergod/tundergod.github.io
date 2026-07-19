"use client";

import createGlobe, { type Arc, type Marker } from "cobe";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react";
import { createPortal } from "react-dom";

import type {
  ConferenceEdition,
  Location,
  Publication,
} from "../data/portfolio-schema";
import {
  coordinatesToAngles,
  getJourneyStops,
  getNextUpcomingStop,
  getPublicationsForPlace,
  interpolateCoordinates,
  type JourneyStop,
} from "../lib/conference-model";
import {
  groupOverlappingLabels,
  isCobeMarkerVisible,
  type LabelGroup,
  type LabelRect,
} from "../lib/globe-label-collisions";

type ConferenceGlobeProps = {
  activePlace?: Location;
  activePlaceId?: string;
  conferenceEditions: ConferenceEdition[];
  onSelectPlace: (placeId: string) => void;
  places: Location[];
  publications: Publication[];
};

function easeAngle(current: number, target: number, amount: number) {
  let difference = target - current;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return current + difference * amount;
}

const LEG_DURATION_MS = 950;
const SIGNAL_RGB: [number, number, number] = [0.49, 0.78, 1];
const JOURNEY_RGB: [number, number, number] = [1, 0.54, 0.45];

type PlaybackState = {
  legIndex: number;
  legStartedAt: number;
  from: { phi: number; theta: number };
  trailArcs: Arc[];
};

function dimColor(color: [number, number, number]): [number, number, number] {
  return [color[0] * 0.45, color[1] * 0.45, color[2] * 0.45];
}

function legColor(stop: JourneyStop) {
  return stop.status === "upcoming" ? JOURNEY_RGB : SIGNAL_RGB;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function interpolateAngle(from: number, to: number, t: number) {
  let difference = to - from;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return from + difference * t;
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
  const playbackRef = useRef<PlaybackState | null>(null);
  const arcsRef = useRef<Arc[]>([]);
  const journeyStopsRef = useRef<JourneyStop[]>([]);
  const cameraRef = useRef(
    activePlace
      ? coordinatesToAngles(activePlace.latitude, activePlace.longitude)
      : { phi: 0.45, theta: 0.22 },
  );
  const [isPlaying, setIsPlaying] = useState(false);
  // playbackLeg is consumed by the Task 3 timeline nodes rendered inside
  // .journey-strip; this component only needs to keep it up to date.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [playbackLeg, setPlaybackLeg] = useState(-1);

  const handleFinishRef = useRef(() => {});
  useEffect(() => {
    handleFinishRef.current = () => {
      const stops = journeyStopsRef.current;
      arcsRef.current = stops.slice(1).map((stop, index) => ({
        from: [stops[index].place.latitude, stops[index].place.longitude] as [number, number],
        to: [stop.place.latitude, stop.place.longitude] as [number, number],
        color: dimColor(legColor(stop)),
      }));
      playbackRef.current = null;
      setIsPlaying(false);
      setPlaybackLeg(-1);
      const landing = getNextUpcomingStop(stops) ?? stops[stops.length - 1];
      if (landing) onSelectPlace(landing.place.id);
    };
  });

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
    cameraRef.current = { phi, theta };

    const buildMarkers = (highlightedPlaceId?: string): Marker[] =>
      placesWithConferences.map(({ place }) => ({
        id: place.id,
        location: [place.latitude, place.longitude] as [number, number],
        size: highlightedPlaceId === place.id ? 0.085 : 0.045,
        color: highlightedPlaceId === place.id ? JOURNEY_RGB : SIGNAL_RGB,
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
      markers: buildMarkers(activePlaceRef.current?.id),
      arcs: arcsRef.current,
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
      const playback = playbackRef.current;
      let highlightedPlaceId = activePlaceRef.current?.id;
      if (playback) {
        const stops = journeyStopsRef.current;
        const stop = stops[playback.legIndex];
        const progress = Math.min(
          1,
          (performance.now() - playback.legStartedAt) / LEG_DURATION_MS,
        );
        const eased = easeInOutCubic(progress);
        const target = coordinatesToAngles(stop.place.latitude, stop.place.longitude);
        phi = interpolateAngle(playback.from.phi, target.phi, eased);
        theta = playback.from.theta + (target.theta - playback.from.theta) * eased;
        highlightedPlaceId = stop.place.id;
        const previous = stops[playback.legIndex - 1];
        if (previous) {
          arcsRef.current = [
            ...playback.trailArcs,
            {
              from: [previous.place.latitude, previous.place.longitude] as [number, number],
              to: interpolateCoordinates(
                [previous.place.latitude, previous.place.longitude],
                [stop.place.latitude, stop.place.longitude],
                eased,
              ),
              color: legColor(stop),
            },
          ];
        }
        if (progress >= 1) {
          if (previous) {
            playback.trailArcs = [
              ...playback.trailArcs,
              {
                from: [previous.place.latitude, previous.place.longitude] as [number, number],
                to: [stop.place.latitude, stop.place.longitude] as [number, number],
                color: legColor(stop),
              },
            ];
          }
          if (playback.legIndex >= stops.length - 1) {
            handleFinishRef.current();
          } else {
            playback.legIndex += 1;
            playback.legStartedAt = performance.now();
            playback.from = { phi, theta };
            setPlaybackLeg(playback.legIndex);
          }
        }
      } else if (activePlaceRef.current) {
        const target = targetRef.current;
        phi = easeAngle(phi, target.phi, reducedMotion ? 1 : 0.045);
        theta += (target.theta - theta) * (reducedMotion ? 1 : 0.045);
      } else if (!reducedMotion && !interactionPausedRef.current) {
        phi += 0.0022;
      }
      cameraRef.current = { phi, theta };

      globe.update({
        width: size * 2,
        height: size * 2,
        phi,
        theta,
        markers: buildMarkers(highlightedPlaceId),
        arcs: arcsRef.current,
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

  const stopJourney = useCallback(() => {
    const playback = playbackRef.current;
    if (!playback) return;
    arcsRef.current = playback.trailArcs;
    playbackRef.current = null;
    setIsPlaying(false);
    setPlaybackLeg(-1);
  }, []);

  const startJourney = useCallback(() => {
    if (playbackRef.current) {
      stopJourney();
      return;
    }
    const stops = getJourneyStops(conferenceEditions, places, new Date());
    if (stops.length === 0) return;
    journeyStopsRef.current = stops;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      handleFinishRef.current();
      return;
    }
    playbackRef.current = {
      legIndex: 0,
      legStartedAt: performance.now(),
      from: { ...cameraRef.current },
      trailArcs: [],
    };
    setIsPlaying(true);
    setPlaybackLeg(0);
  }, [conferenceEditions, places, stopJourney]);

  const handleSelectPlace = useCallback((placeId: string) => {
    stopJourney();
    onSelectPlace(placeId);
  }, [onSelectPlace, stopJourney]);

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
          onClick={() => handleSelectPlace(place.id)}
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
                        handleSelectPlace(details.place.id);
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
              onClick={() => handleSelectPlace(place.id)}
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

      <div className="journey-strip">
        <button className="journey-play" type="button" onClick={startJourney}>
          {isPlaying ? "Stop journey" : "Play journey"}
        </button>
      </div>
    </div>
  );
}
