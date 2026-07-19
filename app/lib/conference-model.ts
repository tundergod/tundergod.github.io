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
    editionIds?: string[];
    type: PublicationTypeFilter;
  },
) {
  return allPublications.filter(
    (publication) =>
      (filters.area === "All" || publication.areas.includes(filters.area)) &&
      (!filters.editionId ||
        publication.conferenceEditionId === filters.editionId) &&
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
