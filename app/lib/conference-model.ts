import type {
  ConferenceEdition,
  Place,
  Publication,
  ResearchArea,
} from "../data/portfolio.ts";

export type PublicationTypeFilter = "All" | Publication["type"];

export type TopicRouteArc = {
  id: string;
  from: [number, number];
  to: [number, number];
};

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

export function getTopicRouteEditions(
  area: "All" | ResearchArea,
  allPublications: Publication[],
  editions: ConferenceEdition[],
) {
  if (area === "All") return [];

  const editionIds = new Set(
    allPublications
      .filter((publication) => publication.areas.includes(area))
      .map((publication) => publication.conferenceEditionId)
      .filter((editionId): editionId is string => Boolean(editionId)),
  );

  return editions
    .filter((edition) => editionIds.has(edition.id))
    .toSorted((left, right) => left.startsOn.localeCompare(right.startsOn));
}

export function getTopicRouteArcs(
  routeEditions: ConferenceEdition[],
  allPlaces: Place[],
): TopicRouteArc[] {
  return routeEditions.slice(1).flatMap((edition, index) => {
    const previousEdition = routeEditions[index];
    const from = allPlaces.find(
      (place) => place.id === previousEdition.placeId,
    );
    const to = allPlaces.find((place) => place.id === edition.placeId);

    if (!from || !to || from.id === to.id) return [];

    return [
      {
        id: `topic-route-${previousEdition.id}-${edition.id}`,
        from: [from.latitude, from.longitude],
        to: [to.latitude, to.longitude],
      },
    ];
  });
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
