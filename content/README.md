# Website content

The JSON files in this directory are the website's canonical content. Routine profile, publication, conference, location, topic, link, and travel updates should not require changes under `app/`.

After every edit, run:

```bash
npm run content:validate
```

The validator rejects unknown fields, duplicate IDs, broken references, malformed DOI values, invalid coordinates, and publications outside non-increasing year order. `npm run dev`, `npm run build`, and `npm run build:pages` run the same validation automatically.

## Adding a publication

1. Insert the record in `publications.json` at its intended display position. The array order is the website order, and years must not increase as the list proceeds.
2. Copy authors in publication order. The exact `name` from `bio.json` must occur once.
3. Reuse IDs from `research-topics.json` in `topics`.
4. For a conference-linked publication, reuse an edition ID from `conferences.json`. Use `null` for a journal without a conference location.
5. Store a DOI as its bare identifier, such as `10.1145/1234567`, without `https://doi.org/`. Use `null` when no DOI is available.
6. Run `npm run content:validate`.

For a new conference edition, add one record to `conferences.json`. Reuse an existing `placeId`; add a new `locations.json` record only when the city is not already present. Several editions and several publications may reference the same location or edition.

## Copy-ready templates

JSON does not support comments. Copy the relevant object into the existing array or replace the corresponding object, then fill every required field.

### `bio.json`

```json
{
  "name": "Full Name",
  "monogram": "FN",
  "role": "PhD candidate",
  "affiliation": "University Name",
  "affiliationCountry": "Country",
  "location": "City, Country",
  "biography": "Short biography.",
  "seoTitle": "Full Name — Computer Systems Research",
  "seoDescription": "Research, publications, and conference journeys by Full Name."
}
```

### `links.json` item

```json
{
  "id": "header-scholar",
  "label": "Scholar",
  "url": "https://example.com/profile",
  "placement": "header"
}
```

`placement` must be `header` or `footer`. Array order controls link order.

### `publications.json` item

```json
{
  "id": "paper-slug-2027",
  "title": "Paper Title",
  "authors": ["Full Name", "Coauthor Name"],
  "year": 2027,
  "type": "conference",
  "venueTags": ["VENUE"],
  "venueLong": "Full Venue Name",
  "doi": null,
  "topics": ["architecture", "memory-storage"],
  "conferenceEditionId": "venue-2027"
}
```

`type` must be `journal` or `conference`. A publication may have several `venueTags` and `topics` but appears only once.

### `conferences.json` item

```json
{
  "id": "venue-2027",
  "series": "VENUE",
  "name": "Full Conference Name",
  "year": 2027,
  "dates": "Jul. 1–4, 2027",
  "placeId": "city-slug"
}
```

### `locations.json` item

```json
{
  "id": "city-slug",
  "city": "City",
  "region": "State or Region",
  "country": "Country",
  "latitude": 25.033,
  "longitude": 121.5654
}
```

`region` is optional. Latitude must be between -90 and 90; longitude must be between -180 and 180.

### `research-topics.json` item

```json
{
  "id": "topic-slug",
  "label": "Reader-facing label",
  "description": "Short topic description."
}
```

`description` is optional. The `id` is the value referenced by publications.

### `travel.json`

```json
{
  "placeholder": {
    "title": "Travel field notes",
    "body": "Photos from each conference journey can be added here later."
  },
  "journeys": [
    {
      "id": "venue-2027-trip",
      "conferenceEditionId": "venue-2027",
      "publicationIds": ["paper-slug-2027"],
      "images": [
        {
          "src": "/travel/venue-2027/photo.jpg",
          "alt": "Accessible description of the photograph",
          "caption": "Optional caption."
        }
      ]
    }
  ]
}
```

`publicationIds` and image `caption` are optional. Put image files under `public/travel/`; every `src` must begin with `/travel/`.

## File responsibilities

- `bio.json`: identity, affiliation, biography, location, and search metadata.
- `links.json`: ordered header and footer links.
- `publications.json`: complete publication list in display order.
- `conferences.json`: conference editions and their location references.
- `locations.json`: reusable globe locations and coordinates.
- `research-topics.json`: topic filter IDs and labels.
- `travel.json`: travel placeholder and future photo journeys.

The CV is maintained independently in `../tundergod-cv/main.tex`; neither source automatically overwrites the other.
