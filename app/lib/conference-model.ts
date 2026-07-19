import type {
  ConferenceEdition,
  Location,
  Publication,
} from "../data/portfolio-schema.ts";

export type PublicationTypeFilter = "All" | Publication["type"];

export function filterPublications(
  allPublications: Publication[],
  filters: {
    topic: "All" | string;
    editionIds?: string[];
    type: PublicationTypeFilter;
  },
) {
  return allPublications.filter(
    (publication) =>
      (filters.topic === "All" || publication.topics.includes(filters.topic)) &&
      (!filters.editionIds ||
        (!!publication.conferenceEditionId &&
          filters.editionIds.includes(publication.conferenceEditionId))) &&
      (filters.type === "All" || publication.type === filters.type),
  );
}

export function getEditionForPublication(
  publication: Publication,
  editions: ConferenceEdition[],
) {
  if (!publication.conferenceEditionId) return undefined;
  return editions.find((edition) => edition.id === publication.conferenceEditionId);
}

export function getPlaceForEdition(
  edition: ConferenceEdition | undefined,
  allPlaces: Location[],
) {
  if (!edition) return undefined;
  return allPlaces.find((place) => place.id === edition.placeId);
}

export function getEditionsForPlace(
  placeId: string,
  editions: ConferenceEdition[],
) {
  return editions.filter((edition) => edition.placeId === placeId);
}

export function getEditionIdsForPlace(
  placeId: string,
  editions: ConferenceEdition[],
) {
  return getEditionsForPlace(placeId, editions).map((edition) => edition.id);
}

export function getPublicationsForPlace(
  placeId: string,
  editions: ConferenceEdition[],
  allPublications: Publication[],
) {
  const editionIds = new Set(getEditionIdsForPlace(placeId, editions));
  const seen = new Set<string>();

  return allPublications.filter((publication) => {
    if (
      !publication.conferenceEditionId ||
      !editionIds.has(publication.conferenceEditionId) ||
      seen.has(publication.id)
    ) {
      return false;
    }

    seen.add(publication.id);
    return true;
  });
}

export function coordinatesToAngles(latitude: number, longitude: number) {
  return {
    phi: -Math.PI / 2 - (longitude * Math.PI) / 180,
    theta: (latitude * Math.PI) / 180,
  };
}

export type JourneyStatus = "past" | "upcoming";

export type JourneyStop = {
  edition: ConferenceEdition;
  place: Location;
  startDate: Date;
  status: JourneyStatus;
};

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parseEditionStartDate(edition: ConferenceEdition): Date {
  const match = /^([A-Za-z]{3})[A-Za-z.]*\s+(\d{1,2})/.exec(edition.dates);
  const month = match ? MONTH_INDEX[match[1].toLowerCase()] : undefined;
  if (match && month !== undefined) {
    return new Date(edition.year, month, Number(match[2]));
  }
  return new Date(edition.year, 0, 1);
}

export function getJourneyStops(
  editions: ConferenceEdition[],
  places: Location[],
  now: Date,
): JourneyStop[] {
  const placesById = new Map(places.map((place) => [place.id, place]));
  return editions
    .flatMap((edition) => {
      const place = placesById.get(edition.placeId);
      if (!place) return [];
      const startDate = parseEditionStartDate(edition);
      const status: JourneyStatus = startDate < now ? "past" : "upcoming";
      return [{ edition, place, startDate, status }];
    })
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export function getNextUpcomingStop(stops: JourneyStop[]) {
  return stops.find((stop) => stop.status === "upcoming");
}

export function interpolateCoordinates(
  from: [number, number],
  to: [number, number],
  t: number,
): [number, number] {
  const toVector = ([latitude, longitude]: [number, number]) => {
    const lat = (latitude * Math.PI) / 180;
    const lon = (longitude * Math.PI) / 180;
    return [
      Math.cos(lat) * Math.cos(lon),
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
    ];
  };
  const a = toVector(from);
  const b = toVector(to);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return to;
  const sinOmega = Math.sin(omega);
  const s0 = Math.sin((1 - t) * omega) / sinOmega;
  const s1 = Math.sin(t * omega) / sinOmega;
  const v = [
    s0 * a[0] + s1 * b[0],
    s0 * a[1] + s1 * b[1],
    s0 * a[2] + s1 * b[2],
  ];
  const latitude = (Math.asin(Math.max(-1, Math.min(1, v[2]))) * 180) / Math.PI;
  const longitude = (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  return [latitude, longitude];
}
