"use client";

import createGlobe, { type Marker } from "cobe";
import { useEffect, useRef, type CSSProperties } from "react";

import type { ConferenceEdition, Place } from "../data/portfolio";
import { coordinatesToAngles } from "../lib/conference-model";

type ConferenceGlobeProps = {
  activeEditionId?: string;
  activePlace?: Place;
  conferenceEditions: ConferenceEdition[];
  onSelectEdition: (editionId: string) => void;
  places: Place[];
};

function easeAngle(current: number, target: number, amount: number) {
  let difference = target - current;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return current + difference * amount;
}

export function ConferenceGlobe({
  activeEditionId,
  activePlace,
  conferenceEditions,
  onSelectEdition,
  places,
}: ConferenceGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
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

  const editionsByPlace = places
    .map((place) => ({
      place,
      editions: conferenceEditions.filter(
        (edition) => edition.placeId === place.id,
      ),
    }))
    .filter(({ editions }) => editions.length > 0);

  return (
    <div className="globe-unit">
      <div className="globe-frame" ref={frameRef}>
        <canvas ref={canvasRef} className="globe-canvas" aria-hidden="true" />
        <div className="globe-orbit globe-orbit-one" aria-hidden="true" />
        <div className="globe-orbit globe-orbit-two" aria-hidden="true" />

        <div className="globe-label-layer">
          {editionsByPlace.map(({ place, editions }) => {
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
                {editions.map((edition) => (
                  <button
                    className={
                      edition.id === activeEditionId
                        ? "globe-conference-button is-active"
                        : "globe-conference-button"
                    }
                    type="button"
                    key={edition.id}
                    aria-pressed={edition.id === activeEditionId}
                    onClick={() => onSelectEdition(edition.id)}
                  >
                    {edition.series} {edition.year} · {place.city}
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div className="conference-index-fallback" aria-label="Conferences">
          {conferenceEditions.map((edition) => {
            const place = places.find(
              (candidate) => candidate.id === edition.placeId,
            );
            if (!place) return null;

            return (
              <button
                className={edition.id === activeEditionId ? "is-active" : undefined}
                type="button"
                key={edition.id}
                aria-pressed={edition.id === activeEditionId}
                onClick={() => onSelectEdition(edition.id)}
              >
                {edition.series} {edition.year} · {place.city}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
