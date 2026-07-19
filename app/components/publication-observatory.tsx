"use client";

import { useMemo, useState } from "react";

import type {
  Location,
  PortfolioData,
  Publication,
} from "../data/portfolio-schema";
import {
  filterPublications,
  getEditionIdsForPlace,
  getEditionForPublication,
  getPlaceForEdition,
  type PublicationTypeFilter,
} from "../lib/conference-model";
import { ConferenceGlobe } from "./conference-globe";

const publicationTypeFilters: Array<{
  value: PublicationTypeFilter;
  label: string;
}> = [
  { value: "All", label: "All" },
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
];

function AuthorLine({
  authors,
  highlightedAuthor,
}: {
  authors: string[];
  highlightedAuthor: string;
}) {
  return (
    <span>
      {authors.map((author, index) => (
        <span key={author}>
          {index > 0 && (index === authors.length - 1
            ? authors.length === 2 ? " and " : ", and "
            : ", ")}
          {author === highlightedAuthor ? <strong>{author}</strong> : author}
        </span>
      ))}
    </span>
  );
}

function PublicationRow({
  publication,
  selected,
  onSelect,
  topicLabels,
  highlightedAuthor,
}: {
  publication: Publication;
  selected: boolean;
  onSelect: (publication: Publication) => void;
  topicLabels: Map<string, string>;
  highlightedAuthor: string;
}) {
  return (
    <article
      className={`publication-row${selected ? " is-selected" : ""}`}
    >
      <button
        className="publication-row-hit-area"
        type="button"
        aria-label={`Select ${publication.title}`}
        aria-pressed={selected}
        onClick={() => onSelect(publication)}
      />
      <span className="publication-index" aria-hidden="true">
        {publication.type === "conference" ? "◎" : "◇"}
      </span>
      <span className="publication-copy">
        <span className="publication-title-line">
          <span className="publication-title">{publication.title}</span>
          {publication.venueTags.map((venue) => (
            <span className="venue-chip" key={venue}>{venue}</span>
          ))}
          <span className="publication-type-tag">
            {publication.type === "journal" ? "Journal" : "Conference"}
          </span>
          {publication.topics.map((topic) => (
            <span className="publication-topic-tag" key={topic}>
              {topicLabels.get(topic) ?? topic}
            </span>
          ))}
          {publication.doi && (
            <a
              className="publication-doi"
              href={`https://doi.org/${publication.doi}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open DOI for ${publication.title}`}
              onClick={() => onSelect(publication)}
            >
              DOI <span aria-hidden="true">↗</span>
            </a>
          )}
        </span>
        <span className="publication-secondary-line">
          <span className="publication-authors">
            <AuthorLine
              authors={publication.authors}
              highlightedAuthor={highlightedAuthor}
            />
          </span>
        </span>
      </span>
    </article>
  );
}

function PublicationFocusCard({
  publication,
  place,
  topicLabels,
  highlightedAuthor,
}: {
  publication: Publication;
  place?: Location;
  topicLabels: Map<string, string>;
  highlightedAuthor: string;
}) {
  const venueTags = publication.venueTags;

  return (
    <div className="journey-card publication-focus-card" aria-live="polite">
      <p className="eyebrow">Publication focus</p>
      <div className="publication-focus-heading">
        {venueTags.map((venue) => (
          <span className="venue-chip" key={venue}>{venue}</span>
        ))}
        <span className="publication-focus-year">{publication.year}</span>
      </div>
      <h3>{publication.title}</h3>
      <p className="publication-focus-authors">
        <AuthorLine
          authors={publication.authors}
          highlightedAuthor={highlightedAuthor}
        />
      </p>
      <div className="publication-focus-meta">
        <div className="publication-focus-topics">
          {publication.topics.map((topic) => (
            <span className="publication-topic-tag" key={topic}>
              {topicLabels.get(topic) ?? topic}
            </span>
          ))}
        </div>
        {place ? (
          <span className="publication-focus-location">
            {place.city}, {place.country}
          </span>
        ) : null}
        {publication.doi ? (
          <a
            className="publication-focus-doi"
            href={`https://doi.org/${publication.doi}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open DOI for ${publication.title}`}
          >
            DOI <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function PublicationObservatory({ data }: { data: PortfolioData }) {
  const topicFilters = [
    { value: "All", label: "All" },
    ...data.researchTopics.map(({ id, label }) => ({ value: id, label })),
  ];
  const topicLabels = useMemo(
    () => new Map(data.researchTopics.map(({ id, label }) => [id, label])),
    [data.researchTopics],
  );
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [publicationType, setPublicationType] =
    useState<PublicationTypeFilter>("All");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPlaceEditionIds = useMemo(
    () => selectedPlaceId
      ? getEditionIdsForPlace(selectedPlaceId, data.conferences)
      : undefined,
    [data.conferences, selectedPlaceId],
  );

  const visiblePublications = useMemo(
    () =>
      filterPublications(data.publications, {
        topic: activeFilter,
        editionIds: selectedPlaceEditionIds,
        type: publicationType,
      }),
    [activeFilter, data.publications, publicationType, selectedPlaceEditionIds],
  );
  const years = [...new Set(visiblePublications.map((publication) => publication.year))];
  const selectedPublication = selectedId
    ? data.publications.find((publication) => publication.id === selectedId)
    : undefined;
  const publicationEdition = selectedPublication
    ? getEditionForPublication(selectedPublication, data.conferences)
    : undefined;
  const publicationPlace = getPlaceForEdition(publicationEdition, data.locations);
  const selectedPlace = selectedPlaceId
    ? data.locations.find((place) => place.id === selectedPlaceId)
    : publicationPlace;

  function selectPublication(publication: Publication) {
    setSelectedPlaceId(null);
    setSelectedId(publication.id);
  }

  function selectPlace(placeId: string) {
    setSelectedPlaceId(placeId);
    setSelectedId(null);
  }

  function clearConferenceFocus() {
    setSelectedPlaceId(null);
    setSelectedId(null);
  }

  return (
    <div className="observatory-grid">
      <div className="publication-panel">
        <div className="filter-toolbar">
          <div className="filter-group">
            <span className="filter-group-label">Topic</span>
            <div className="filter-row" aria-label="Filter publications by research area">
              {topicFilters.map((filter) => (
                <button
                  className={activeFilter === filter.value ? "filter-chip is-active" : "filter-chip"}
                  type="button"
                  key={filter.value}
                  aria-pressed={activeFilter === filter.value}
                  onClick={() => {
                    setActiveFilter(filter.value);
                    setSelectedId(null);
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Type</span>
            <div className="filter-row" aria-label="Filter publications by type">
              {publicationTypeFilters.map((filter) => (
                <button
                  className={publicationType === filter.value ? "filter-chip is-active" : "filter-chip"}
                  type="button"
                  key={filter.value}
                  aria-pressed={publicationType === filter.value}
                  onClick={() => {
                    setPublicationType(filter.value);
                    setSelectedId(null);
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="publication-list" aria-live="polite">
          {visiblePublications.length === 0 && (
            <p className="publication-empty">No publications match these filters.</p>
          )}
          {years.map((year) => (
            <section className="publication-year" key={year} aria-labelledby={`year-${year}`}>
              <div className="year-rail">
                <h3 id={`year-${year}`}>{year}</h3>
                <span>{visiblePublications.filter((paper) => paper.year === year).length}</span>
              </div>
              <div className="year-papers">
                {visiblePublications
                  .filter((publication) => publication.year === year)
                  .map((publication) => (
                    <PublicationRow
                      key={publication.id}
                      publication={publication}
                      selected={publication.id === selectedId}
                      onSelect={selectPublication}
                      topicLabels={topicLabels}
                      highlightedAuthor={data.bio.name}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <aside className="journey-panel" aria-label="Conference journey">
        <div className="journey-sticky">
          <div className="panel-kicker">
            <span className="pulse-dot" />
            Conference signal
            {selectedPlace ? (
              <button
                className="browse-conferences-button"
                type="button"
                onClick={clearConferenceFocus}
              >
                All conferences
              </button>
            ) : (
              <span>Browse all conferences</span>
            )}
          </div>

          <ConferenceGlobe
            activePlace={selectedPlace}
            activePlaceId={selectedPlace?.id}
            conferenceEditions={data.conferences}
            places={data.locations}
            publications={data.publications}
            onSelectPlace={selectPlace}
          />

          {selectedPublication ? (
            <PublicationFocusCard
              publication={selectedPublication}
              place={publicationPlace}
              topicLabels={topicLabels}
              highlightedAuthor={data.bio.name}
            />
          ) : null}

          <div className="photo-empty">
            <span className="photo-mark" aria-hidden="true">＋</span>
            <span>
              <strong>{data.travel.placeholder.title}</strong>
              {data.travel.placeholder.body}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
