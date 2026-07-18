# Conference Topic Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make topic, conference edition, and publication type intersect as filters while the COBE globe displays chronological topic routes and clickable conference labels.

**Architecture:** Keep portfolio data in `app/data/portfolio.ts`, add pure filtering and route-building helpers to `app/lib/conference-model.ts`, and keep React state orchestration in `PublicationObservatory`. `ConferenceGlobe` receives prepared topic editions, draws consecutive COBE arcs, and keeps conference labels visible in browse mode.

**Tech Stack:** React 19, TypeScript, COBE 2.0.1, CSS, Node test runner, vinext/Vite.

## Global Constraints

- All filters intersect and changing one preserves the other two.
- Display `Memory / Storage` and `Embedded` without changing existing internal research-area identifiers.
- Only globe conference-label clicks activate the conference filter; publication clicks only focus the globe.
- No Taipei marker, `TPE` label, or Taiwan-to-conference arc.
- `All` topics has no arcs; selected topics connect chronological consecutive conference locations.
- No new dependency.
- Preserve keyboard, reduced-motion, responsive, and CSS Anchor fallback behavior.

---

### Task 1: Pure conference filtering and topic-route model

**Files:**
- Modify: `app/data/portfolio.ts`
- Modify: `app/lib/conference-model.ts`
- Test: `tests/conference-model.test.mjs`

**Interfaces:**
- Produces: `PublicationTypeFilter = "All" | Publication["type"]`.
- Produces: `filterPublications(allPublications, { area, editionId, type }) => Publication[]`.
- Produces: `getTopicRouteEditions(area, allPublications, editions) => ConferenceEdition[]` sorted by `startsOn`.
- Produces: `getTopicRouteArcs(routeEditions, allPlaces) => Array<{ id, from, to }>` without zero-length consecutive arcs.

- [ ] **Step 1: Write failing model tests**

Add tests proving all three filter dimensions intersect, route editions sort by `startsOn`, duplicate consecutive locations do not produce arcs, and `All` produces no route editions.

```js
const filtered = filterPublications(publications, {
  area: "Storage",
  editionId: "dac-2026",
  type: "conference",
});
assert.deepEqual(filtered.map(({ id }) => id).sort(), [
  "flashhd-dac-2026",
  "rememtier-dac-2026",
]);

const route = getTopicRouteEditions("Intermittent", publications, conferenceEditions);
assert.deepEqual(route.map(({ startsOn }) => startsOn), [...route.map(({ startsOn }) => startsOn)].sort());
assert.deepEqual(getTopicRouteEditions("All", publications, conferenceEditions), []);
```

- [ ] **Step 2: Run the model tests and observe failure**

Run: `npm run test:model`

Expected: FAIL because the new helpers and `startsOn` property do not exist.

- [ ] **Step 3: Add machine-readable dates and minimal pure helpers**

Add an ISO `startsOn` string to every `ConferenceEdition`, then implement filtering and route helpers. Filtering treats `All`/undefined as no constraint. Route building deduplicates editions, sorts by `startsOn`, and skips an arc only when consecutive editions resolve to the same place.

```ts
export type PublicationTypeFilter = "All" | Publication["type"];

export function filterPublications(
  allPublications: Publication[],
  filters: {
    area: "All" | ResearchArea;
    editionId?: string;
    type: PublicationTypeFilter;
  },
) {
  return allPublications.filter((publication) =>
    (filters.area === "All" || publication.areas.includes(filters.area)) &&
    (!filters.editionId || publication.conferenceEditionId === filters.editionId) &&
    (filters.type === "All" || publication.type === filters.type)
  );
}
```

- [ ] **Step 4: Run the model tests and observe success**

Run: `npm run test:model`

Expected: all model tests PASS.

- [ ] **Step 5: Commit the model task**

```bash
git add app/data/portfolio.ts app/lib/conference-model.ts tests/conference-model.test.mjs
git commit -m "feat: model conference topic filters"
```

### Task 2: Intersecting publication controls and copy cleanup

**Files:**
- Modify: `app/components/publication-observatory.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `filterPublications` and `PublicationTypeFilter` from Task 1.
- Produces: independent `activeFilter`, `conferenceFilterId`, `publicationType`, and `selectedId` UI state.

- [ ] **Step 1: Add failing rendered-output assertions**

Assert the new profile text and filter labels exist, and that obsolete copy does not render.

```js
assert.match(html, /PhD candidate · National Taiwan University \(NTU\), Taiwan/);
assert.match(html, /Memory \/ Storage/);
assert.match(html, /Embedded/);
assert.match(html, /Filter publications by type/);
assert.doesNotMatch(html, />Accepted</);
assert.doesNotMatch(html, /Map linked/);
```

- [ ] **Step 2: Run the rendered test and observe failure**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL on the new profile/filter assertions and obsolete text assertions.

- [ ] **Step 3: Implement the three intersecting filters**

Use a second filter group for `All`, `Journal`, and `Conference`. Pass all three values to `filterPublications`. Globe conference clicks set `conferenceFilterId` and select the first linked publication; publication-row clicks set only `selectedId`. Clearing conferences clears both the filter and focused selection. Render a short `No publications match these filters.` state when the intersection is empty.

Remove `publication.status` and `mapped-label` rendering from `PublicationRow`. Change only the visible research labels, leaving `ResearchArea` values untouched.

- [ ] **Step 4: Style the separate filter groups and empty state**

Add `.filter-toolbar`, `.filter-group`, `.filter-group-label`, and `.publication-empty` rules. Reuse `.filter-chip`; allow both groups to wrap below 660px.

- [ ] **Step 5: Run rendered tests and lint**

Run: `npm run build && node --test tests/rendered-html.test.mjs && npm run lint`

Expected: rendered tests PASS and lint exits 0.

- [ ] **Step 6: Commit the controls task**

```bash
git add app/components/publication-observatory.tsx app/page.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: intersect publication filters"
```

### Task 3: Chronological topic routes and persistent conference labels

**Files:**
- Modify: `app/components/publication-observatory.tsx`
- Modify: `app/components/conference-globe.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `getTopicRouteEditions` and `getTopicRouteArcs` from Task 1.
- `ConferenceGlobe` consumes `activeEditionId`, `activePlace`, `conferenceEditions`, `topicRouteArcs`, `onSelectEdition`, and `places`.

- [ ] **Step 1: Add failing rendered-output assertions for the new globe contract**

Assert the page includes conference labels in both focused-capable and fallback markup, and no longer renders the `TPE` origin text.

```js
assert.match(html, /globe-conference-button/);
assert.doesNotMatch(html, /class="globe-origin"/);
```

- [ ] **Step 2: Run rendered tests and observe failure**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because `globe-origin` still renders.

- [ ] **Step 3: Replace the Taiwan route with topic arcs**

Remove `TAIPEI`, its marker, `globe-origin`, and the active-place arc. Build COBE arcs from the route data passed by `PublicationObservatory`. Keep route arcs visible while a conference is focused and color them with the active topic signal color.

- [ ] **Step 4: Keep conference labels beside markers**

Render label stacks regardless of focus. Add `aria-pressed` and an active class to the chosen conference button. Keep the CSS Anchor fallback list and apply the same active state there.

- [ ] **Step 5: Run rendered tests, model tests, and lint**

Run: `npm test && npm run lint`

Expected: all model/rendered tests PASS, the production build succeeds, and lint exits 0.

- [ ] **Step 6: Commit the globe task**

```bash
git add app/components/publication-observatory.tsx app/components/conference-globe.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: connect conference locations by topic"
```

### Task 4: Final verification and local preview handoff

**Files:**
- Verify only; modify a prior task file only if a real failure is found.

**Interfaces:**
- Consumes the complete site from Tasks 1-3.
- Produces a healthy local preview with no deployment.

- [ ] **Step 1: Run fresh complete verification**

Run: `npm test && npm run lint`

Expected: all tests PASS, build succeeds, lint exits 0.

- [ ] **Step 2: Confirm the retained local preview responds**

Request `http://localhost:3000/` once.

Expected: HTTP 200. Do not perform screenshots, DOM inspection, clicking, or resizing unless the user separately requests browser QA.

- [ ] **Step 3: Report the implemented behavior**

Summarize the three intersecting filters, topic route behavior, persistent conference labels, copy cleanup, verification results, and local preview URL. Do not publish because the current review workflow is local-only.
