# Publication Details and Globe Label Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep enlarged bibliographic tags inline with publication titles, merge colliding COBE location labels, and show a complete focus card for every selected conference or journal publication.

**Architecture:** `PublicationObservatory` continues to own publication and place selection and gains one reusable focus-card component. `ConferenceGlobe` continues to use COBE's marker anchors, but a pure collision helper groups projected label rectangles before rendering either a city label or an expandable cluster badge. No new dependency is introduced.

**Tech Stack:** React 19, TypeScript 5.9, COBE 2, CSS Anchor Positioning, Node test runner, vinext/Vite, ESLint.

## Global Constraints

- Venue, type, and DOI tags use 9px monospace text with a minimum height of 23px.
- Research-area tags use 8px monospace text.
- Globe city labels use 9px text; expanded editions and counts use 8px text.
- Every conference marker remains present and continues to use COBE's front-facing visibility state.
- Active places never merge into a collision group.
- Journal cards omit the location row and never say that no conference location is attached.
- Selecting a globe place clears the publication focus card.
- DOI selection still targets the globe and opens the DOI in a new tab.
- Add no dependency.

---

## File map

- Create `app/lib/globe-label-collisions.ts`: pure rectangle-overlap and stable-grouping logic.
- Create `tests/globe-label-collisions.test.mjs`: isolated model tests for grouping behavior.
- Modify `app/components/publication-observatory.tsx`: inline row metadata and complete publication focus card.
- Modify `app/components/conference-globe.tsx`: throttled COBE-anchor measurement, cluster labels, and cluster interactions.
- Modify `app/globals.css`: publication tag scale, focus-card layout, larger globe typography, cluster UI, responsive rules.
- Modify `tests/rendered-html.test.mjs`: SSR/source contracts for inline tags, focus-card content, and collision UI.
- Modify `package.json`: include the collision model test in `test:model`.

---

### Task 1: Pure collision grouping model

**Files:**
- Create: `app/lib/globe-label-collisions.ts`
- Create: `tests/globe-label-collisions.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: projected label rectangles measured by `ConferenceGlobe`.
- Produces: `LabelRect`, `LabelGroup`, `rectanglesOverlap(a, b, gap)`, and `groupOverlappingLabels(labels, activePlaceId?, gap?)`.

- [ ] **Step 1: Write the failing collision tests**

Create `tests/globe-label-collisions.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  groupOverlappingLabels,
  rectanglesOverlap,
} from "../app/lib/globe-label-collisions.ts";

const rect = (id, left, top, visible = true) => ({
  id,
  left,
  top,
  right: left + 60,
  bottom: top + 24,
  visible,
});

test("rectangles overlap across the configured safety gap", () => {
  assert.equal(rectanglesOverlap(rect("a", 0, 0), rect("b", 66, 0), 8), true);
  assert.equal(rectanglesOverlap(rect("a", 0, 0), rect("b", 70, 0), 8), false);
});

test("collision groups are transitive and preserve data order", () => {
  assert.deepEqual(
    groupOverlappingLabels([
      rect("san-francisco", 0, 0),
      rect("san-jose", 55, 0),
      rect("long-beach", 110, 0),
      rect("antwerp", 260, 0),
    ]),
    [
      { representativeId: "san-francisco", placeIds: ["san-francisco", "san-jose", "long-beach"] },
      { representativeId: "antwerp", placeIds: ["antwerp"] },
    ],
  );
});

test("the active place stays independent from an overlapping group", () => {
  assert.deepEqual(
    groupOverlappingLabels([
      rect("san-francisco", 0, 0),
      rect("long-beach", 20, 0),
      rect("san-jose", 40, 0),
    ], "long-beach"),
    [
      { representativeId: "san-francisco", placeIds: ["san-francisco", "san-jose"] },
      { representativeId: "long-beach", placeIds: ["long-beach"] },
    ],
  );
});

test("back-facing labels remain stable singletons", () => {
  assert.deepEqual(
    groupOverlappingLabels([
      rect("barcelona", 0, 0, false),
      rect("antwerp", 0, 0),
    ]),
    [
      { representativeId: "barcelona", placeIds: ["barcelona"] },
      { representativeId: "antwerp", placeIds: ["antwerp"] },
    ],
  );
});
```

- [ ] **Step 2: Run the new test and verify the missing module failure**

Run:

```bash
node --experimental-strip-types --test tests/globe-label-collisions.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `app/lib/globe-label-collisions.ts`.

- [ ] **Step 3: Implement the minimal stable grouping helper**

Create `app/lib/globe-label-collisions.ts`:

```ts
export type LabelRect = {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  visible: boolean;
};

export type LabelGroup = {
  representativeId: string;
  placeIds: string[];
};

export function rectanglesOverlap(a: LabelRect, b: LabelRect, gap = 8) {
  return (
    a.left < b.right + gap &&
    a.right + gap > b.left &&
    a.top < b.bottom + gap &&
    a.bottom + gap > b.top
  );
}

export function groupOverlappingLabels(
  labels: LabelRect[],
  activePlaceId?: string,
  gap = 8,
): LabelGroup[] {
  const groups: LabelGroup[] = [];
  const visited = new Set<string>();

  for (const label of labels) {
    if (visited.has(label.id)) continue;
    visited.add(label.id);

    if (!label.visible || label.id === activePlaceId) {
      groups.push({ representativeId: label.id, placeIds: [label.id] });
      continue;
    }

    const placeIds = [label.id];
    for (let index = 0; index < placeIds.length; index += 1) {
      const member = labels.find((candidate) => candidate.id === placeIds[index]);
      if (!member) continue;

      for (const candidate of labels) {
        if (
          visited.has(candidate.id) ||
          !candidate.visible ||
          candidate.id === activePlaceId ||
          !rectanglesOverlap(member, candidate, gap)
        ) continue;

        visited.add(candidate.id);
        placeIds.push(candidate.id);
      }
    }

    groups.push({ representativeId: placeIds[0], placeIds });
  }

  return groups.sort(
    (a, b) => labels.findIndex((label) => label.id === a.representativeId)
      - labels.findIndex((label) => label.id === b.representativeId),
  );
}
```

- [ ] **Step 4: Add the model test to the standard test command**

Change `package.json`:

```json
"test:model": "node --experimental-strip-types --test tests/conference-model.test.mjs tests/globe-label-collisions.test.mjs"
```

- [ ] **Step 5: Run model tests and verify they pass**

Run `npm run test:model`.

Expected: all existing conference-model tests and four collision tests PASS.

- [ ] **Step 6: Commit the collision model**

```bash
git add app/lib/globe-label-collisions.ts tests/globe-label-collisions.test.mjs package.json
git commit -m "feat: model globe label collisions"
```

---

### Task 2: Inline and enlarge publication metadata

**Files:**
- Modify: `app/components/publication-observatory.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: existing `Publication` fields `title`, `venueTags`, `venue`, `type`, `doi`, and `areas`.
- Produces: one inline `publication-title-line` with indivisible 9px tags and an 8px research-area tag row.

- [ ] **Step 1: Add failing source/style assertions**

Extend `tests/rendered-html.test.mjs`:

```js
test("keeps enlarged bibliographic tags in the title text flow", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(styles, /\.publication-title-line\s*{[^}]*display:\s*block;/s);
  assert.match(styles, /\.venue-chip,[\s\S]*\.publication-doi\s*{[^}]*min-height:\s*23px;[^}]*font-size:\s*9px;/s);
  assert.match(styles, /\.publication-topic-tag\s*{[^}]*font-size:\s*8px;/s);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test --test-name-pattern="enlarged bibliographic" tests/rendered-html.test.mjs
```

Expected: FAIL because `.publication-title-line` is still flex and tags are still 7px.

- [ ] **Step 3: Convert the title line to inline flow and enlarge tags**

In `app/globals.css`, replace the shared flex rule and tag sizing with:

```css
.publication-secondary-line,
.publication-topic-tags {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}

.publication-title-line {
  display: block;
  line-height: 1.55;
}

.publication-title {
  font-size: clamp(14px, 1.12vw, 17px);
  font-weight: 500;
  line-height: 1.38;
  letter-spacing: -0.018em;
}

.venue-chip,
.publication-type-tag,
.publication-doi {
  display: inline-flex;
  align-items: center;
  min-height: 23px;
  margin-left: 7px;
  padding: 4px 7px;
  font-size: 9px;
  vertical-align: 2px;
}

.publication-topic-tag {
  min-height: 21px;
  padding: 3px 6px;
  font-size: 8px;
}
```

Keep the existing border, color, font-family, letter-spacing, uppercase, `white-space: nowrap`, DOI z-index, and pointer-event rules. Remove the obsolete `.publication-title-line { gap: ... }` rule and the title `max-width`, which caused the metadata tags to start on a separate flex line.

- [ ] **Step 4: Run the focused test and rendered suite**

Run:

```bash
node --test --test-name-pattern="enlarged bibliographic" tests/rendered-html.test.mjs
node --test tests/rendered-html.test.mjs
```

Expected: both commands PASS.

- [ ] **Step 5: Commit the publication-row typography**

```bash
git add app/globals.css tests/rendered-html.test.mjs
git commit -m "style: enlarge inline publication metadata"
```

---

### Task 3: Complete focus card for conferences and journals

**Files:**
- Modify: `app/components/publication-observatory.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `selectedPublication`, `publicationEdition`, `publicationPlace`, `researchAreaLabels`, and `AuthorLine`.
- Produces: `PublicationFocusCard({ publication, place })`, rendered for every selected publication.

- [ ] **Step 1: Add failing rendered contracts for both publication types**

Extend `tests/rendered-html.test.mjs` with source assertions:

```js
test("renders one complete focus card for every selected publication", async () => {
  const source = await readFile(
    new URL("../app/components/publication-observatory.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /function PublicationFocusCard/);
  assert.match(source, /selectedPublication && \(/);
  assert.match(source, /publication-focus-authors/);
  assert.match(source, /publication-focus-topics/);
  assert.match(source, /publication-focus-location/);
  assert.match(source, /publication-focus-doi/);
  assert.doesNotMatch(source, /has no conference location attached/);
  assert.doesNotMatch(source, /!publicationEdition && selectedPublication/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test --test-name-pattern="complete focus card" tests/rendered-html.test.mjs
```

Expected: FAIL because the current card is journal-only and lacks authors, topics, DOI, and conference location.

- [ ] **Step 3: Add the reusable focus-card component**

Add above `PublicationObservatory`:

```tsx
function PublicationFocusCard({
  publication,
  place,
}: {
  publication: Publication;
  place?: (typeof places)[number];
}) {
  const venueTags = publication.venueTags ?? [publication.venue];

  return (
    <div className="journey-card publication-focus-card" aria-live="polite">
      <p className="eyebrow">Publication focus</p>
      <div className="publication-focus-heading">
        {venueTags.map((venue) => <span className="venue-chip" key={venue}>{venue}</span>)}
        <span className="publication-focus-year">{publication.year}</span>
      </div>
      <h3>{publication.title}</h3>
      <p className="publication-focus-authors">
        <AuthorLine authors={publication.authors} />
      </p>
      <div className="publication-focus-meta">
        <div className="publication-focus-topics">
          {publication.areas.map((area) => (
            <span className="publication-topic-tag" key={area}>{researchAreaLabels[area]}</span>
          ))}
        </div>
        {place ? (
          <span className="publication-focus-location">{place.city}, {place.country}</span>
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
```

- [ ] **Step 4: Replace the journal-only conditional**

Replace the existing `!publicationEdition && selectedPublication` block with:

```tsx
{selectedPublication ? (
  <PublicationFocusCard
    publication={selectedPublication}
    place={publicationPlace}
  />
) : null}
```

Keep `selectPlace()` clearing `selectedId`; this preserves the distinction between a place filter and a publication focus.

- [ ] **Step 5: Add focused card styles**

Add to `app/globals.css`:

```css
.publication-focus-card {
  display: grid;
  gap: 14px;
}

.publication-focus-heading,
.publication-focus-meta,
.publication-focus-topics {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.publication-focus-heading .venue-chip {
  margin-left: 0;
}

.publication-focus-year,
.publication-focus-location,
.publication-focus-doi {
  font-family: var(--font-geist-mono), monospace;
  font-size: 9px;
}

.publication-focus-card h3,
.publication-focus-authors {
  margin: 0;
}

.publication-focus-authors {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.6;
}

.publication-focus-authors strong {
  color: var(--ice);
}

.publication-focus-location {
  color: var(--signal);
}

.publication-focus-doi {
  margin-left: auto;
  color: var(--journey);
}
```

Retain the existing journey-card border, background, and responsive width.

- [ ] **Step 6: Run the focused test and rendered suite**

Run:

```bash
node --test --test-name-pattern="complete focus card" tests/rendered-html.test.mjs
node --test tests/rendered-html.test.mjs
```

Expected: both commands PASS.

- [ ] **Step 7: Commit the focus card**

```bash
git add app/components/publication-observatory.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: show complete publication focus cards"
```

---

### Task 4: COBE collision badges and expanded city groups

**Files:**
- Modify: `app/components/conference-globe.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `groupOverlappingLabels()` from Task 1 and the existing `placesWithConferences` metadata.
- Produces: throttled `labelGroups`, singleton city buttons, and expandable collision badges that call the existing `onSelectPlace(placeId)`.

- [ ] **Step 1: Add failing collision-UI source assertions**

Extend `tests/rendered-html.test.mjs`:

```js
test("renders expandable collision groups from COBE marker anchors", async () => {
  const source = await readFile(
    new URL("../app/components/conference-globe.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /groupOverlappingLabels/);
  assert.match(source, /globe-cluster-button/);
  assert.match(source, /globe-cluster-menu/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /onPointerEnter/);
  assert.match(source, /onFocus/);
  assert.match(source, /onSelectPlace\(place\.id\)/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test --test-name-pattern="expandable collision groups" tests/rendered-html.test.mjs
```

Expected: FAIL because no grouping UI exists.

- [ ] **Step 3: Add collision state and throttled anchor measurement**

In `conference-globe.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  groupOverlappingLabels,
  type LabelGroup,
  type LabelRect,
} from "../lib/globe-label-collisions";
```

Add component state and refs:

```tsx
const [labelGroups, setLabelGroups] = useState<LabelGroup[]>(
  () => places.map((place) => ({ representativeId: place.id, placeIds: [place.id] })),
);
const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
const labelGroupsRef = useRef(labelGroups);
const interactionPausedRef = useRef(false);
```

Keep `labelGroupsRef` synchronized in an effect. Inside the existing globe render loop, run a collision pass every eight animation frames:

```tsx
let collisionFrame = 0;

const updateLabelGroups = () => {
  const host = canvas.parentElement;
  if (!host) return;
  const rootStyle = getComputedStyle(document.documentElement);
  const rectangles: LabelRect[] = places.map((place) => {
    const anchor = Array.from(host.children).find((element) =>
      (element as HTMLElement).style.getPropertyValue("anchor-name") === `--cobe-${place.id}`
    ) as HTMLElement | undefined;
    const anchorRect = anchor?.getBoundingClientRect();
    const width = Math.max(54, place.city.length * 5.6 + 18);
    const height = 24;
    const left = (anchorRect?.left ?? 0) - width / 2;
    const top = (anchorRect?.top ?? 0) - height - 6;

    return {
      id: place.id,
      left,
      top,
      right: left + width,
      bottom: top + height,
      visible: rootStyle.getPropertyValue(`--cobe-visible-${place.id}`).trim() === "1",
    };
  });
  const nextGroups = groupOverlappingLabels(rectangles, activePlaceRef.current?.id);
  if (JSON.stringify(nextGroups) !== JSON.stringify(labelGroupsRef.current)) {
    labelGroupsRef.current = nextGroups;
    setLabelGroups(nextGroups);
  }
};
```

After each `globe.update`, call `updateLabelGroups()` when `collisionFrame % 8 === 0`, then increment `collisionFrame`. Change ambient rotation to:

```tsx
} else if (!reducedMotion && !interactionPausedRef.current) {
  phi += 0.0022;
}
```

- [ ] **Step 4: Render singleton labels and collision badges**

Build `placeDetailsById` with `useMemo` from `placesWithConferences`. Replace the normal label `map` with `labelGroups.map`:

```tsx
{labelGroups.map((group) => {
  const representative = placeDetailsById.get(group.representativeId);
  if (!representative) return null;
  const anchorStyle = getAnchorStyle(representative.place.id);

  if (group.placeIds.length === 1) {
    return renderPlaceLabel(representative, anchorStyle);
  }

  const expanded = expandedGroupId === group.representativeId;
  return (
    <div
      className="globe-label-stack globe-label-cluster"
      key={group.representativeId}
      style={anchorStyle}
      onPointerEnter={() => { interactionPausedRef.current = true; }}
      onPointerLeave={() => {
        interactionPausedRef.current = false;
        setExpandedGroupId(null);
      }}
      onFocus={() => { interactionPausedRef.current = true; }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          interactionPausedRef.current = false;
          setExpandedGroupId(null);
        }
      }}
    >
      <button
        className="globe-cluster-button"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpandedGroupId(expanded ? null : group.representativeId)}
        onPointerEnter={() => setExpandedGroupId(group.representativeId)}
        onFocus={() => setExpandedGroupId(group.representativeId)}
      >
        {group.placeIds.length}
        <span className="sr-only"> nearby conference places</span>
      </button>
      {expanded ? (
        <div className="globe-cluster-menu">
          {group.placeIds.map((placeId) => {
            const details = placeDetailsById.get(placeId);
            if (!details) return null;
            return (
              <button
                type="button"
                key={placeId}
                onClick={() => {
                  setExpandedGroupId(null);
                  onSelectPlace(details.place.id);
                }}
              >
                <span>{details.place.city}</span>
                <small>{details.editionLabels.join(", ")} · {details.publications.length} publications</small>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
})}
```

Extract only the repeated anchor-style and singleton-label JSX into local helpers; do not move COBE lifecycle logic to a new component.

- [ ] **Step 5: Add larger label and cluster styles**

Update and add in `app/globals.css`:

```css
.globe-place-button,
.conference-index-fallback button {
  font-size: 9px;
}

.globe-label-editions,
.globe-label-count,
.globe-label-country {
  font-size: 8px;
}

.globe-label-cluster {
  z-index: 3;
}

.globe-cluster-button {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid var(--journey);
  border-radius: 50%;
  color: var(--journey);
  background: rgba(7, 9, 12, 0.94);
  font-family: var(--font-geist-mono), monospace;
  font-size: 9px;
  cursor: pointer;
}

.globe-cluster-menu {
  position: absolute;
  left: 50%;
  bottom: 32px;
  width: max-content;
  max-width: min(230px, 70vw);
  display: grid;
  padding: 5px;
  border: 1px solid rgba(124, 199, 255, 0.38);
  background: rgba(7, 9, 12, 0.96);
  transform: translateX(-50%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.42);
}

.globe-cluster-menu button {
  display: grid;
  gap: 3px;
  padding: 7px 8px;
  border: 0;
  color: var(--ice);
  background: transparent;
  font-family: var(--font-geist-mono), monospace;
  font-size: 9px;
  text-align: left;
  cursor: pointer;
}

.globe-cluster-menu button:hover,
.globe-cluster-menu button:focus-visible {
  color: var(--journey);
  background: rgba(255, 138, 116, 0.08);
  outline: 1px solid var(--journey);
}

.globe-cluster-menu small {
  color: var(--muted);
  font-size: 8px;
}
```

Increase fallback buttons to the same 9px/8px hierarchy. Preserve active/focus z-index and the scale-to-zero hit-area guard.

- [ ] **Step 6: Run model, rendered, and build gates**

Run:

```bash
npm run test:model
node --test tests/rendered-html.test.mjs
npm run build
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit collision-aware labels**

```bash
git add app/components/conference-globe.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: merge colliding globe labels"
```

---

### Task 5: Browser interaction and responsive verification

**Files:**
- Modify if a defect is reproduced: `app/components/conference-globe.tsx`, `app/components/publication-observatory.tsx`, or `app/globals.css`
- Test if a defect is reproduced: `tests/globe-label-collisions.test.mjs` or `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: the completed publication rows, focus card, and collision UI.
- Produces: evidence that the user-visible workflow works at desktop and mobile widths.

- [ ] **Step 1: Verify desktop publication metadata and conference focus**

In the existing in-app browser at `http://localhost:3000/`:

1. Confirm title, venue, type, and DOI share one inline text flow.
2. Click ReMemTier.
3. Confirm the globe targets Long Beach and its active label is expanded.
4. Confirm the focus card shows venue/year, title, authors, topics, DOI when present, and `Long Beach, USA`.
5. Click the Long Beach globe label and confirm the list filters to the two DAC publications and the publication focus card clears.

Expected: every item above is visible and interactive; no neighboring label intercepts Long Beach.

- [ ] **Step 2: Verify journal focus and DOI behavior**

1. Restore all conferences.
2. Click the TECS journal publication.
3. Confirm the focus card contains full metadata and no location row or “no conference location” sentence.
4. Click a DOI tag and confirm its row becomes selected while the DOI opens in a new tab.

Expected: the journal card is complete without invented geography, and DOI preserves both actions.

- [ ] **Step 3: Verify collision badge pointer, keyboard, and touch behavior**

1. Restore ambient rotation and wait until nearby California labels merge.
2. Hover the count badge; confirm the globe pauses and the city menu opens.
3. Move through menu buttons and select San Francisco; confirm the list filters to that place.
4. Restore ambient rotation, reach the badge by keyboard, and confirm `:focus-visible`, expansion, and Enter selection.
5. At a touch/mobile viewport, tap once to expand and tap a city to select.

Expected: no hidden label intercepts input, the expanded menu stays still, and every city is selectable.

- [ ] **Step 4: Verify responsive layout**

Test at 1440×900, 768×1024, and 390×844.

Expected at every viewport:

- no horizontal document overflow;
- 9px globe city labels remain legible;
- cluster menus stay inside the viewport;
- publication tags wrap only between whole tags;
- focus card remains within the journey panel.

- [ ] **Step 5: If browser QA exposes a defect, add a failing regression first**

Use `tests/globe-label-collisions.test.mjs` for grouping defects and `tests/rendered-html.test.mjs` for markup/style contracts. Run the focused test to observe failure, make the smallest fix, and rerun the focused test before continuing.

- [ ] **Step 6: Run final verification**

Run:

```bash
npm test
npm run lint
git diff --check
```

Expected: all tests, production build, lint, and whitespace checks exit 0.

- [ ] **Step 7: Commit any browser-QA fixes**

If Step 5 changed files:

```bash
git add app/components/conference-globe.tsx app/components/publication-observatory.tsx app/globals.css tests/globe-label-collisions.test.mjs tests/rendered-html.test.mjs
git commit -m "fix: polish publication and globe interactions"
```

If Step 5 changed no files, do not create an empty commit.
