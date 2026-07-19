# Clickable Conference Globe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an idle rotating globe with front-facing clickable conference labels and a reversible focused-conference state.

**Architecture:** `PublicationObservatory` owns nullable selection state and converts a clicked conference edition into its first linked publication. `ConferenceGlobe` receives editions and a selection callback, assigns COBE marker IDs by place, and renders one anchored button stack per place while idle.

**Tech Stack:** React 19, TypeScript, COBE, CSS Anchor Positioning, vinext, Node test runner.

## Global Constraints

- Default to browse mode with no selected publication or conference.
- Show each conference edition as a separate clickable button, including editions sharing one place.
- Stop autonomous rotation only when a conference edition is focused.
- `prefers-reduced-motion: reduce` disables autonomous rotation but keeps buttons usable.
- Preserve multi-venue publication tags and current responsive behavior.

---

### Task 1: Idle selection contract

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/components/publication-observatory.tsx`

**Interfaces:**
- Consumes: `conferenceEditions`, `getPublicationsForEdition()`
- Produces: nullable `selectedId`, `selectEdition(editionId: string)`, `clearConferenceFocus()`

- [ ] **Step 1: Write a failing rendered-state test**

Add assertions that the initial HTML contains `ICCAD 2026`, `CASES / EMSOFT / CODES 2026`, and `Browse all conferences`, while it does not contain `Focused location`.

- [ ] **Step 2: Verify the new assertions fail**

Run `npm run build` and `node --test tests/rendered-html.test.mjs`. Expect failure because the current state starts on Progress Gambit and does not render conference buttons.

- [ ] **Step 3: Implement nullable selection**

Initialize `selectedId` as `string | null` with `null`. Derive `selectedPublication`, `selectedEdition`, and `selectedPlace` safely. Add:

```ts
function selectEdition(editionId: string) {
  const [firstPublication] = getPublicationsForEdition(editionId, publications);
  if (firstPublication) setSelectedId(firstPublication.id);
}

function clearConferenceFocus() {
  setSelectedId(null);
}
```

Render journal context only when `selectedPublication` exists. Pass conference editions, active edition ID, and `selectEdition` into `ConferenceGlobe`. Render `Browse all conferences` only while focused.

### Task 2: Anchored clickable conference labels

**Files:**
- Modify: `app/components/conference-globe.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- `ConferenceGlobe` consumes `activeEditionId?: string`, `conferenceEditions: ConferenceEdition[]`, and `onSelectEdition: (editionId: string) => void`.
- Marker IDs are place IDs and labels group `ConferenceEdition[]` by `placeId`.

- [ ] **Step 1: Assign stable COBE marker IDs**

Set each place marker's `id` to `place.id`, preserving marker color and size logic.

- [ ] **Step 2: Render idle conference button stacks**

Group editions by `placeId`. While `activeEditionId` is absent, render `.globe-label-stack` elements anchored to `--cobe-${placeId}`. Each button label is `${edition.series} ${edition.year}` and calls `onSelectEdition(edition.id)`.

- [ ] **Step 3: Add label and focus-control styling**

Use COBE's `--cobe-visible-${placeId}` for opacity, scale, and z-index. Add compact dark buttons with visible hover and keyboard focus. Add an in-flow `.conference-index-fallback` so the same buttons remain usable when anchor positioning is unsupported.

- [ ] **Step 4: Verify the rendered contract passes**

Run `npm test`; expect all model tests, build, and rendered-state tests to pass.

### Task 3: Final validation

**Files:**
- Verify all modified files.

**Interfaces:**
- No new interfaces.

- [ ] **Step 1: Run lint**

Run `npm run lint`; expect zero errors.

- [ ] **Step 2: Confirm the development server remains healthy**

Read the retained server output and confirm the home route returns HTTP 200 after HMR.
