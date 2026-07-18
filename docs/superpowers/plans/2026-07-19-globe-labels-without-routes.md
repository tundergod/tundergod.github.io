# Globe Labels Without Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every map connection and keep clickable `Conference Year · City` controls inside the circular globe in both CSS Anchor and fallback modes.

**Architecture:** Delete the now-unused topic-route model and stop passing arcs into `ConferenceGlobe`. Keep anchored labels for supporting browsers, but move the fallback conference index into `.globe-frame` and style it as an internal overlay.

**Tech Stack:** React 19, TypeScript, COBE 2.0.1, CSS, Node test runner, vinext/Vite.

## Global Constraints

- Draw no COBE arcs.
- Render no Taipei marker, `TPE` label, or Taiwan route origin.
- Every conference control displays `Conference Year · City`.
- Anchor and fallback conference controls both stay inside `.globe-frame`.
- Conference clicks continue to activate the existing intersecting filter.
- Add no dependency and preserve reduced-motion behavior.

---

### Task 1: Remove topic-route model and COBE arcs

**Files:**
- Modify: `app/data/portfolio.ts`
- Modify: `app/lib/conference-model.ts`
- Modify: `app/components/publication-observatory.tsx`
- Modify: `app/components/conference-globe.tsx`
- Test: `tests/conference-model.test.mjs`

**Interfaces:**
- Removes: `ConferenceEdition.startsOn`, `TopicRouteArc`, `getTopicRouteEditions`, `getTopicRouteArcs`, and the `topicRouteArcs` component prop.
- Preserves: `filterPublications` and the three intersecting filters.

- [ ] **Step 1: Add a failing no-arcs contract test**

Read `app/components/conference-globe.tsx` in `tests/rendered-html.test.mjs` and assert the component contains `arcs: []` and no `topicRouteArcs` or `buildArcs`. This fails against the current route implementation. Remove the route-ordering model tests while keeping the intersection test unchanged.

```js
const globeSource = await readFile(
  new URL("../app/components/conference-globe.tsx", import.meta.url),
  "utf8",
);
assert.match(globeSource, /arcs:\s*\[\]/);
assert.doesNotMatch(globeSource, /topicRouteArcs|buildArcs/);
```

- [ ] **Step 2: Remove route-only production code**

Delete `startsOn` from the conference type/data, delete both topic-route helpers, stop calculating route arcs in `PublicationObservatory`, remove the prop from `ConferenceGlobe`, and set both COBE initialization and updates to `arcs: []`.

- [ ] **Step 3: Run model tests**

Run: `npm run test:model`

Expected: all remaining model tests PASS.

### Task 2: Put all conference controls inside the globe

**Files:**
- Modify: `app/components/conference-globe.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Conference label format: `${edition.series} ${edition.year} · ${place.city}`.
- Fallback markup: `.conference-index-fallback` is a child of `.globe-frame`.

- [ ] **Step 1: Add failing rendered assertions**

Assert anchored labels include city text. In the same source-level contract test, assert the fallback markup is nested before the closing globe-frame marker comment. Assert `globe-origin` remains absent.

```js
assert.match(html, /DAC.*2026.*Long Beach/);
assert.match(html, /conference-index-fallback/);
assert.doesNotMatch(html, /class="globe-origin"/);
```

- [ ] **Step 2: Run the rendered test and observe failure**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because labels do not include city names.

- [ ] **Step 3: Render city labels and move fallback markup**

Resolve each edition's place before rendering. Use the same `Conference Year · City` label for anchored and fallback buttons. Move `.conference-index-fallback` inside `.globe-frame`.

- [ ] **Step 4: Style the internal fallback overlay**

Keep the fallback hidden when CSS Anchor Positioning is supported. Otherwise position it absolutely inside the circular frame with safe insets, compact wrapping, a dark translucent background, and bounded overflow. Remove the old below-map margin.

- [ ] **Step 5: Run full verification**

Run: `npm test && npm run lint`

Expected: model and rendered tests PASS, production build succeeds, and lint exits 0.

- [ ] **Step 6: Commit**

```bash
git add app/data/portfolio.ts app/lib/conference-model.ts app/components/publication-observatory.tsx app/components/conference-globe.tsx app/globals.css tests/conference-model.test.mjs tests/rendered-html.test.mjs
git commit -m "fix: keep conference labels inside globe"
```
