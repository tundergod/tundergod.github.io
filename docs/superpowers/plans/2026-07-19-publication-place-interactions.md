# Publication–Place Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make publication rows, compact metadata tags, and native COBE place labels operate as one bidirectional publication/place browser.

**Architecture:** Keep `PublicationObservatory` as the state owner. Extend the pure conference model with place-to-edition filtering and unique publication lookup, then render city labels as DOM buttons bound to COBE's native CSS anchors. Publication rows use a full-row selection surface plus an independently focusable DOI link whose handler also selects the publication before normal navigation.

**Tech Stack:** React 19, TypeScript, COBE v2, CSS Anchor Positioning, Node test runner, vinext/Vite, ESLint.

## Global Constraints

- Keep the existing COBE dependency and its `--cobe-{id}` / `--cobe-visible-{id}` native bindings; add no globe extension or dependency.
- Resting globe labels show the city only.
- Hover, focus, or selected labels show every conference/year at the place and the unique publication count.
- Clicking a place filters publications across every edition at that place.
- Clicking a publication targets its conference place; a journal without a place leaves ambient rotation running.
- Remove `Show on map`.
- DOI navigation and publication/globe selection both occur from a DOI click.
- Inline tags use `Memory / Storage`, `Architecture`, `Embedded`, and `Robotics`, with multiple topic tags allowed.
- Preserve responsive, keyboard, touch, and reduced-motion behavior.

---

### Task 1: Place-Level Publication Model

**Files:**
- Modify: `app/data/portfolio.ts`
- Modify: `app/lib/conference-model.ts`
- Test: `tests/conference-model.test.mjs`

**Interfaces:**
- Produces: `researchAreaLabels: Record<ResearchArea, string>`
- Produces: `getEditionIdsForPlace(placeId, editions): string[]`
- Produces: `getPublicationsForPlace(placeId, editions, publications): Publication[]`
- Extends: `filterPublications(..., { editionIds?: string[] })`

- [ ] **Step 1: Write failing model tests**

Add tests that require a place with two editions to return publications from both editions exactly once and require all four public research-area labels:

```js
test("place filters include every edition at one location", () => {
  const editionIds = getEditionIdsForPlace("shared-place", [
    { id: "event-2026", placeId: "shared-place" },
    { id: "event-2025", placeId: "shared-place" },
    { id: "elsewhere", placeId: "other-place" },
  ]);
  const result = filterPublications(samplePublications, {
    area: "All",
    editionIds,
    type: "All",
  });
  assert.deepEqual(result.map((paper) => paper.id), ["paper-2026", "paper-2025"]);
});

test("place publication counts deduplicate publication IDs", () => {
  const result = getPublicationsForPlace("shared-place", sampleEditions, [
    samplePublications[0],
    samplePublications[0],
    samplePublications[1],
  ]);
  assert.deepEqual(result.map((paper) => paper.id), ["paper-2026", "paper-2025"]);
});

test("research areas expose reader-facing labels", () => {
  assert.deepEqual(researchAreaLabels, {
    Storage: "Memory / Storage",
    Architecture: "Architecture",
    Intermittent: "Embedded",
    Robotics: "Robotics",
  });
});
```

- [ ] **Step 2: Run the model test and confirm RED**

Run: `npm run test:model`

Expected: FAIL because `getEditionIdsForPlace`, `getPublicationsForPlace`, `editionIds`, and `researchAreaLabels` do not exist.

- [ ] **Step 3: Implement the minimal pure model**

Add the label map and helpers:

```ts
export const researchAreaLabels: Record<ResearchArea, string> = {
  Storage: "Memory / Storage",
  Architecture: "Architecture",
  Intermittent: "Embedded",
  Robotics: "Robotics",
};

export function getEditionIdsForPlace(
  placeId: string,
  editions: ConferenceEdition[],
) {
  return editions
    .filter((edition) => edition.placeId === placeId)
    .map((edition) => edition.id);
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
    ) return false;
    seen.add(publication.id);
    return true;
  });
}
```

Extend `filterPublications` with:

```ts
editionIds?: string[];
```

and:

```ts
(!filters.editionIds ||
  (!!publication.conferenceEditionId &&
    filters.editionIds.includes(publication.conferenceEditionId)))
```

- [ ] **Step 4: Run the model test and confirm GREEN**

Run: `npm run test:model`

Expected: all model tests pass.

- [ ] **Step 5: Commit the model slice**

```bash
git add app/data/portfolio.ts app/lib/conference-model.ts tests/conference-model.test.mjs
git commit -m "feat: add place-level publication filtering"
```

### Task 2: Compact, Directly Selectable Publication Rows

**Files:**
- Modify: `app/components/publication-observatory.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `researchAreaLabels`
- Consumes: `getEditionIdsForPlace(placeId, conferenceEditions)`
- Produces: `PublicationRow` with a full-row selection surface and DOI link

- [ ] **Step 1: Write failing rendered-output assertions**

Require the new controls and compact tags while rejecting the old action:

```js
assert.match(html, /class="publication-row-hit-area"/);
assert.match(html, /class="publication-title-line"/);
assert.match(html, /class="publication-topic-tag"[^>]*>Memory \/ Storage</);
assert.match(html, /class="publication-type-tag"[^>]*>Conference</);
assert.doesNotMatch(html, /Show on map/);
```

- [ ] **Step 2: Run the rendered test and confirm RED**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL on the missing full-row surface and inline topic/type tags.

- [ ] **Step 3: Implement the compact row**

Render a positioned row with a full-row button, non-interactive compact content, and an interactive DOI above that surface:

```tsx
<article className={`publication-row${selected ? " is-selected" : ""}`}>
  <button
    className="publication-row-hit-area"
    type="button"
    aria-label={`Show ${publication.title} on the conference globe`}
    aria-pressed={selected}
    onClick={() => onSelect(publication)}
  />
  <span className="publication-index" aria-hidden="true">…</span>
  <span className="publication-copy">
    <span className="publication-title-line">
      <span className="publication-title">{publication.title}</span>
      {(publication.venueTags ?? [publication.venue]).map((venue) => (
        <span className="venue-chip" key={venue}>{venue}</span>
      ))}
      <span className="publication-type-tag">…</span>
      {publication.doi && (
        <a
          className="publication-doi"
          href={`https://doi.org/${publication.doi}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => onSelect(publication)}
        >DOI ↗</a>
      )}
    </span>
    <span className="publication-secondary-line">
      <span className="publication-authors"><AuthorLine authors={publication.authors} /></span>
      <span className="publication-topic-tags">
        {publication.areas.map((area) => (
          <span className="publication-topic-tag" key={area}>{researchAreaLabels[area]}</span>
        ))}
      </span>
    </span>
  </span>
</article>
```

Use CSS so `.publication-row-hit-area` covers the row at `z-index: 1`, content sits at `z-index: 2` with `pointer-events: none`, and `.publication-doi` restores `pointer-events: auto`. Reduce vertical padding and remove the old `.publication-actions` block.

- [ ] **Step 4: Connect place-aware state**

Replace `conferenceFilterId` with `selectedPlaceId`. Resolve `selectedPlaceEditionIds` through `getEditionIdsForPlace`, pass those IDs into `filterPublications`, clear the place selection when selecting a publication, and clear the publication when selecting a place.

```ts
function selectPublication(publication: Publication) {
  setSelectedPlaceId(null);
  setSelectedId(publication.id);
}

function selectPlace(placeId: string) {
  setSelectedPlaceId(placeId);
  setSelectedId(null);
}
```

- [ ] **Step 5: Run rendered and model tests**

Run: `npm test`

Expected: all model and rendered tests pass.

- [ ] **Step 6: Commit the publication slice**

```bash
git add app/components/publication-observatory.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: compact publication rows and direct globe selection"
```

### Task 3: Native COBE Place Labels and Details

**Files:**
- Modify: `app/components/conference-globe.tsx`
- Modify: `app/components/publication-observatory.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `getPublicationsForPlace(placeId, conferenceEditions, publications)`
- Changes prop: `onSelectEdition` → `onSelectPlace`
- Changes prop: `activeEditionId` → `activePlaceId`
- Adds prop: `publications: Publication[]`

- [ ] **Step 1: Add failing label assertions**

Require resting city labels and expandable detail content:

```js
assert.match(html, /class="globe-label-city"[^>]*>Long Beach</);
assert.match(html, /class="globe-label-editions"[^>]*>DAC '26</);
assert.match(html, /class="globe-label-count"[^>]*>2 publications</);
assert.doesNotMatch(html, /Long Beach, USA/);
```

Use the real current publication count for Long Beach in the assertion.

- [ ] **Step 2: Run the rendered test and confirm RED**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because labels currently render one edition button at a time and expose the place immediately.

- [ ] **Step 3: Group and render one native bound label per place**

For every place, derive editions and unique publications, then render one button attached to the existing COBE CSS anchor:

```tsx
<button
  className={place.id === activePlaceId
    ? "globe-place-button is-active"
    : "globe-place-button"}
  type="button"
  aria-pressed={place.id === activePlaceId}
  onClick={() => onSelectPlace(place.id)}
>
  <span className="globe-label-city">{place.city}</span>
  <span className="globe-place-details">
    <span className="globe-label-editions">{editionLabels.join(", ")}</span>
    <span className="globe-label-count">
      {placePublications.length} {placePublications.length === 1 ? "publication" : "publications"}
    </span>
    <span className="globe-label-country">{place.country}</span>
  </span>
</button>
```

Format each edition as `${edition.series} '${String(edition.year).slice(-2)}` and keep editions sorted by descending year with stable data order for ties.

- [ ] **Step 4: Style resting and expanded states**

Show only `.globe-label-city` by default. Reveal `.globe-place-details` on `.globe-place-button:hover`, `:focus-visible`, and `.is-active`. Keep the detail within the circular frame, use the existing dark panel and journey color, and add a visible signal-colored focus outline.

- [ ] **Step 5: Remove obsolete edition detail UI**

Remove `activeEdition`, `.globe-conference-detail`, per-edition globe buttons, and edition-selection callbacks. Preserve the no-CSS-anchor fallback as place buttons with the same city/detail content.

- [ ] **Step 6: Run tests and lint**

Run: `npm test && npm run lint`

Expected: all tests pass, production build exits 0, and ESLint exits 0.

- [ ] **Step 7: Commit the globe slice**

```bash
git add app/components/conference-globe.tsx app/components/publication-observatory.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: add interactive COBE place labels"
```

### Task 4: Final Verification

**Files:**
- Verify only; modify only if a failing gate identifies a defect in a file already listed above.

**Interfaces:**
- Consumes the complete observatory interaction.
- Produces fresh verification evidence.

- [ ] **Step 1: Review the final diff against the design spec**

Run:

```bash
git diff b23bbfd..HEAD --check
git diff b23bbfd..HEAD --stat
```

Expected: no whitespace errors; every changed file traces to the approved interaction design.

- [ ] **Step 2: Run the full verification gate**

Run:

```bash
npm test
npm run lint
```

Expected: all model tests and rendered tests pass, the production build exits 0, and ESLint exits 0.

- [ ] **Step 3: Confirm the retained local preview**

Run: `curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3000/`

Expected: `200`.
