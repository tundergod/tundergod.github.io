"use client";

import createGlobe, { type Marker } from "cobe";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import type { ConferenceEdition, Place, Publication } from "../data/portfolio";
import {
  coordinatesToAngles,
  getPublicationsForPlace,
} from "../lib/conference-model";

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

export function ConferenceGlobe({
  activePlace,
  activePlaceId,
  conferenceEditions,
  onSelectPlace,
  places,
  publications,
}: ConferenceGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [labelHost, setLabelHost] = useState<HTMLElement | null>(null);
  const activePlaceRef = useRef(activePlace);
  const targetRef = useRef(
    activePlace
      ? coordinatesToAngles(activePlace.latitude, activePlace.longitude)
      : { phi: 0.45, theta: 0.22 },
  );

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

    const buildMarkers = (): Marker[] =>
      places.map((place) => ({
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

    const render = () => {
      const target = targetRef.current;
      if (activePlaceRef.current) {
        phi = easeAngle(phi, target.phi, reducedMotion ? 1 : 0.045);
        theta += (target.theta - theta) * (reducedMotion ? 1 : 0.045);
      } else if (!reducedMotion) {
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
  }, [places]);

  const placesWithConferences = places
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
    .filter(({ editions }) => editions.length > 0);

  const labelLayer = (
    <div className="globe-label-layer">
      {placesWithConferences.map(({ place, editionLabels, publications: placePublications }) => {
        const anchorStyle = {
          "--marker-visibility": `var(--cobe-visible-${place.id}, 0)`,
          positionAnchor: `--cobe-${place.id}`,
        } as CSSProperties & {
          "--marker-visibility": string;
          positionAnchor: string;
        };
        return (
          <div
            className="globe-label-stack"
            key={place.id}
            style={anchorStyle}
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
      })}
    </div>
  );

  return (
    <div className="globe-unit">
      <div className="globe-frame" ref={frameRef}>
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
