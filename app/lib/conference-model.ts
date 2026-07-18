import type {
  ConferenceEdition,
  Place,
  Publication,
  ResearchArea,
} from "../data/portfolio.ts";

export type PublicationTypeFilter = "All" | Publication["type"];

export function filterPublications(
  allPublications: Publication[],
  filters: {
    area: "All" | ResearchArea;
    editionId?: string;
    type: PublicationTypeFilter;
  },
) {
  return allPublications.filter(
    (publication) =>
      (filters.area === "All" || publication.areas.includes(filters.area)) &&
      (!filters.editionId ||
        publication.conferenceEditionId === filters.editionId) &&
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
  allPlaces: Place[],
) {
  if (!edition) return undefined;
  return allPlaces.find((place) => place.id === edition.placeId);
}

export function getPublicationsForEdition(
  editionId: string,
  allPublications: Publication[],
) {
  return allPublications.filter(
    (publication) => publication.conferenceEditionId === editionId,
  );
}

export function getEditionsForPlace(
  placeId: string,
  editions: ConferenceEdition[],
) {
  return editions.filter((edition) => edition.placeId === placeId);
}

export function coordinatesToAngles(latitude: number, longitude: number) {
  return {
    phi: -Math.PI / 2 - (longitude * Math.PI) / 180,
    theta: (latitude * Math.PI) / 180,
  };
}
