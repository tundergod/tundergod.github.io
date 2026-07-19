"use client";

import { useMemo, useState } from "react";

import {
  conferenceEditions,
  places,
  publications,
  researchAreaLabels,
  type Publication,
  type ResearchArea,
} from "../data/portfolio";
import {
  filterPublications,
  getEditionIdsForPlace,
  getEditionForPublication,
  getPlaceForEdition,
  type PublicationTypeFilter,
} from "../lib/conference-model";
import { ConferenceGlobe } from "./conference-globe";

const topicFilters: Array<{
  value: "All" | ResearchArea;
  label: string;
}> = [
  { value: "All", label: "All" },
  { value: "Storage", label: researchAreaLabels.Storage },
  { value: "Architecture", label: researchAreaLabels.Architecture },
  { value: "Intermittent", label: researchAreaLabels.Intermittent },
  { value: "Robotics", label: researchAreaLabels.Robotics },
];

const publicationTypeFilters: Array<{
  value: PublicationTypeFilter;
  label: string;
}> = [
  { value: "All", label: "All" },
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
];

function AuthorLine({ authors }: { authors: string }) {
  const pieces = authors.split("Wen Sheng Lim");
  return (
    <span>
      {pieces.map((piece, index) => (
        <span key={`${piece}-${index}`}>
          {index > 0 && <strong>Wen Sheng Lim</strong>}
          {piece}
        </span>
      ))}
    </span>
  );
}

function PublicationRow({
  publication,
  selected,
  onSelect,
}: {
  publication: Publication;
  selected: boolean;
  onSelect: (publication: Publication) => void;
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
          {(publication.venueTags ?? [publication.venue]).map((venue) => (
            <span className="venue-chip" key={venue}>{venue}</span>
          ))}
          <span className="publication-type-tag">
            {publication.type === "journal" ? "Journal" : "Conference"}
          </span>
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
            <AuthorLine authors={publication.authors} />
          </span>
          <span className="publication-topic-tags">
            {publication.areas.map((area) => (
              <span className="publication-topic-tag" key={area}>
                {researchAreaLabels[area]}
              </span>
            ))}
          </span>
        </span>
      </span>
    </article>
  );
}

export function PublicationObservatory() {
  const [activeFilter, setActiveFilter] = useState<"All" | ResearchArea>("All");
  const [publicationType, setPublicationType] =
    useState<PublicationTypeFilter>("All");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPlaceEditionIds = useMemo(
    () => selectedPlaceId
      ? getEditionIdsForPlace(selectedPlaceId, conferenceEditions)
      : undefined,
    [selectedPlaceId],
  );

  const visiblePublications = useMemo(
    () =>
      filterPublications(publications, {
        area: activeFilter,
        editionIds: selectedPlaceEditionIds,
        type: publicationType,
      }),
    [activeFilter, publicationType, selectedPlaceEditionIds],
  );
  const years = [...new Set(visiblePublications.map((publication) => publication.year))];
  const selectedPublication = selectedId
    ? publications.find((publication) => publication.id === selectedId)
    : undefined;
  const publicationEdition = selectedPublication
    ? getEditionForPublication(selectedPublication, conferenceEditions)
    : undefined;
  const publicationPlace = getPlaceForEdition(publicationEdition, places);
  const selectedPlace = selectedPlaceId
    ? places.find((place) => place.id === selectedPlaceId)
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
            conferenceEditions={conferenceEditions}
            places={places}
            publications={publications}
            onSelectPlace={selectPlace}
          />

          {!publicationEdition && selectedPublication ? (
            <div className="journey-card" aria-live="polite">
              <div className="journal-focus">
                <p className="eyebrow">Publication focus</p>
                <h3>
                  {(selectedPublication.venueTags ?? [selectedPublication.venue]).join(" + ")} · {selectedPublication.year}
                </h3>
                <p>{selectedPublication.title}</p>
                <span>This journal record has no conference location attached.</span>
              </div>
            </div>
          ) : null}

          <div className="photo-empty">
            <span className="photo-mark" aria-hidden="true">＋</span>
            <span>
              <strong>Travel field notes</strong>
              Photos from each conference journey can be added here later.
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
