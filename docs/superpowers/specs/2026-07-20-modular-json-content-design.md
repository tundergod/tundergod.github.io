# Modular JSON Content Design

## Goal

Move all personal, publication, conference, location, topic, link, SEO, and
travel content out of React and TypeScript implementation files into a modular
`content/` directory. Routine website updates must require content-file edits
only; React behavior must change only when a new content concept or interaction
is introduced.

This project uses JSON as its canonical website-content format. BibTeX parsing,
BibTeX generation, and CV synchronization are outside this change.

## Content ownership

The website content directory is the canonical source for the website:

```text
content/
├── bio.json
├── links.json
├── publications.json
├── conferences.json
├── locations.json
├── research-topics.json
├── travel.json
└── README.md
```

The CV remains independently canonical in `../tundergod-cv/main.tex`. The
website does not read, generate, or modify the CV.

Images referenced by `travel.json` live under `public/travel/`. Adding travel
media may therefore require copying an image into `public/travel/` and editing
`travel.json`, but it must not require a code change.

## Content module and seam

Application callers use one deep content module rather than importing JSON
files independently. Its external interface is a fully validated
`PortfolioData` value:

```ts
type PortfolioData = {
  bio: Bio;
  links: ProfileLink[];
  publications: Publication[];
  conferences: ConferenceEdition[];
  locations: Location[];
  researchTopics: ResearchTopic[];
  travel: TravelContent;
};
```

The module hides file locations, raw JSON shapes, relationship validation, and
normalization. Page, publication-list, filter, and globe code consume only this
interface.

The data flow is:

```text
content/*.json
      ↓
content loader + validator
      ↓
PortfolioData
      ↓
page / publication list / filters / globe
```

## File schemas

### `bio.json`

Contains the individual's name, role, affiliation, location, biography,
and SEO metadata. The person's name is also the source used to emphasize that
author in every publication. The biography is stored as complete display copy,
including the expected-graduation sentence, so the application does not
assemble personal prose.

```json
{
  "name": "Wen Sheng Lim",
  "monogram": "WS",
  "role": "PhD candidate",
  "affiliation": "National Taiwan University (NTU)",
  "affiliationCountry": "Taiwan",
  "location": "Taipei, Taiwan",
  "biography": "Wen Sheng Lim is a PhD candidate in Computer Science and Information Engineering at National Taiwan University. His research spans memory and storage systems, embedded computing, and efficient systems under resource constraints. He expects to graduate in January 2027.",
  "seoTitle": "Wen Sheng Lim — Computer Systems Research",
  "seoDescription": "Research, publications, and conference journeys by Wen Sheng Lim, a computer systems researcher in Taipei."
}
```

### `links.json`

Contains the ordered profile links used in the header and footer. Each entry
has a stable ID, label, URL, and placement. URLs must use `https:` or `mailto:`.
Separate header and footer entries are allowed when the same destination needs
different reader-facing labels, such as `Contact` and `Email`.

```json
[
  {
    "id": "header-scholar",
    "label": "Scholar",
    "url": "https://scholar.google.com/citations?user=y_7M9psAAAAJ",
    "placement": "header"
  },
  {
    "id": "footer-email",
    "label": "Email",
    "url": "mailto:tundergod1882@gmail.com",
    "placement": "footer"
  }
]
```

### `publications.json`

Contains an ordered array of publication records. The array order is the
display order; the application groups the records by year without reordering
records within a year. Years must therefore be non-increasing.

A representative record is:

```json
{
  "id": "graphisc-tcad-2026",
  "title": "GraphISC: Enabling Out-of-Core Graph Processing with Distributed Computational Storage",
  "authors": [
    "Ssu-Hao Tsai",
    "Wen Sheng Lim",
    "Liang-Chi Chen",
    "Tei-Wei Kuo",
    "Yuan-Hao Chang"
  ],
  "year": 2026,
  "type": "journal",
  "venueTags": ["TCAD", "CASES / EMSOFT / CODES"],
  "venueLong": "IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems",
  "doi": null,
  "topics": ["memory-storage", "architecture"],
  "conferenceEditionId": "esweek-2026"
}
```

Publication rules:

- `authors` is an ordered non-empty array; the `bio.json` name must occur once.
- `type` is `journal` or `conference`.
- `venueTags` is the ordered, non-empty set of tags rendered after the title.
- `doi` is a bare DOI string or `null`.
- `topics` references IDs from `research-topics.json`.
- `conferenceEditionId` references `conferences.json` or is `null`.
- A journal may reference a conference edition, which preserves the single
  GraphISC record with TCAD and CASES / EMSOFT / CODES tags and an ESWEEK place.
- No `accepted` field exists because publication on the site already implies a
  published or accepted record.
- IDs remain stable after publication because selections, travel records, and
  future media may reference them.

### `conferences.json`

Contains conference editions, not merely conference series:

```json
{
  "id": "dac-2026",
  "series": "DAC",
  "name": "ACM/IEEE The Chips to Systems Conference",
  "year": 2026,
  "dates": "Jul. 26–29, 2026",
  "placeId": "long-beach"
}
```

Several publications may reference one edition. Several editions, including
different series and years, may reference one place.

### `locations.json`

Contains stable place IDs, city, optional region, country, latitude, and
longitude:

```json
{
  "id": "long-beach",
  "city": "Long Beach",
  "region": "California",
  "country": "USA",
  "latitude": 33.7701,
  "longitude": -118.1937
}
```

### `research-topics.json`

Contains topic ID, reader-facing label, and optional description. Array order
defines the topic-filter order. Publication topic chips and filters use the
same source, so adding a topic requires content edits only.

```json
{
  "id": "memory-storage",
  "label": "Memory / Storage",
  "description": "Flash, CXL, computational storage, and data movement."
}
```

The existing IDs migrate to:

- `memory-storage` → `Memory / Storage`
- `architecture` → `Architecture`
- `embedded` → `Embedded`
- `robotics` → `Robotics`

### `travel.json`

Contains the current travel placeholder text and, later, journey records. A
journey may reference a conference edition, publications, image paths, and
captions. Its location is derived through the conference edition. All
references are validated. The initial migration may contain no photos.

```json
{
  "placeholder": {
    "title": "Travel field notes",
    "body": "Photos from each conference journey can be added here later."
  },
  "journeys": []
}
```

A future journey record has a stable ID, one `conferenceEditionId`, optional
`publicationIds`, and an ordered `images` array. Each image contains a
root-relative `src` under `/travel/`, accessible `alt` text, and an optional
caption. The journey location is derived from its conference edition rather
than duplicated.

### `README.md`

Documents the editing workflow and contains copy-ready templates for a new
publication, conference edition, location, research topic, link, and journey.
It also explains when editing one record requires adding a referenced record to
another file.

## Automated validation

`npm run content:validate` runs before development, tests, the vinext build,
and the GitHub Pages build. It uses repository code rather than a new schema
dependency.

The validator rejects:

- invalid JSON and unknown fields;
- empty or duplicate IDs;
- incomplete publication titles, authors, years, types, venues, or topics;
- publication author lists that omit the name from `bio.json`;
- publication types other than `journal` and `conference`;
- malformed bare DOI values;
- missing topic, conference-edition, place, travel, or publication references;
- out-of-range latitude or longitude;
- publication years that increase later in the ordered file; and
- link URLs outside `https:` and `mailto:`.

Errors name the file, record ID, and field, for example:

```text
content/publications.json
publication "flashhd-dac-2026":
unknown conferenceEditionId "dac-2027"
```

Invalid content stops development or production builds rather than producing a
partially broken site.

## Migration

The migration extracts and preserves:

- publications, conference editions, places, and research-topic labels from
  `app/data/portfolio.ts`;
- name, role, affiliation, biography, location, links, and footer content from
  `app/page.tsx`;
- page title and description from `app/layout.tsx`;
- the fixed topic filters and author-highlight name from
  `app/components/publication-observatory.tsx`; and
- the travel placeholder copy from the current observatory.

The application changes only enough to consume `PortfolioData`:

- topic filters are generated from `research-topics.json`;
- author highlighting uses the profile name from `bio.json`;
- header, biography, footer, links, and SEO consume content data;
- publication, conference, globe, and place relationships consume JSON data;
  and
- the hard-coded portfolio arrays are removed.

The migration must preserve all 15 publications, 8 conference editions, and 8
locations. It must preserve GraphISC as one publication with TCAD and CASES /
EMSOFT / CODES tags linked to ESWEEK 2026, and WinHD as a CASES publication.

## Testing and verification

Testing has three layers:

1. Validator unit tests prove that missing topics, duplicate IDs, malformed
   DOIs, invalid coordinates, unknown fields, ordering errors, and broken
   references fail with specific diagnostics.
2. Migration-parity tests assert record counts and representative special
   relationships, including GraphISC, WinHD, journals without conference
   locations, repeated conference places, and multiple publications at one
   edition.
3. Existing behavior tests continue to cover filters, publication selection,
   DOI navigation, globe linkage, server-rendered content, vinext, and GitHub
   Pages static export.

The final release gate includes lint, content validation, all tests, both
production builds, responsive browser checks, and public GitHub Pages
verification.

## Non-goals

- No BibTeX parser or JSON-to-BibTeX exporter.
- No automatic synchronization with `tundergod-cv/main.tex`.
- No visual redesign or copy rewrite.
- No publication, topic, conference, location, or travel additions beyond
  migrating the current site content.
- No COBE collision-group redesign; that remains a separate next-round task.
- No new persistence service or runtime database.

## Completion criteria

- All personal and portfolio content listed in this design lives under
  `content/`, with travel images reserved under `public/travel/`.
- No personal name, biography, profile URL, publication, research-topic label,
  conference edition, or location remains hard-coded in React behavior files.
- Editing valid content JSON updates both vinext and GitHub Pages builds without
  changing application logic.
- Invalid JSON or relationships fail before a build with actionable messages.
- The rendered site and interactions remain behaviorally and visually
  equivalent to the approved version.
- The verified change is merged to `main` and deployed to the public GitHub
  Pages site.
