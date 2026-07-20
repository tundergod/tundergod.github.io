# Conference Journey Globe v2 — Chapter Playback (many-to-many arcs)

Date: 2026-07-20 · Status: approved by owner (chapter concept + adaptive
granularity); spec review delegated to subagent. Supersedes the playback
section of `2026-07-20-globe-journey-design.md`; everything not mentioned here
(data parsing, interruption semantics, reduced motion, a11y, fallback
browsers, landing rules) carries over unchanged from v1.

## Goal

Replace the stop-by-stop single-chain flight with **temporal chapters**: the
journey advances year by year (subdividing dense years into half-years or
quarters), each chapter lights up all of its cities at once, and consecutive
chapters connect with **many-to-many arc fans** (every city of chapter N−1 →
every city of chapter N).

## Non-goals

- No home-base (Taipei) arcs; connections are chapter-to-chapter only.
- The stop-by-stop chain playback is REMOVED, not kept as an option.
- Timeline nodes remain one-per-stop (chapter grouping affects separators and
  playback highlighting only).

## Data model (`app/lib/conference-model.ts`)

New pure functions (unit-tested, no clock access — status already lives on
`JourneyStop`):

- `type JourneyChapter = { id: string; label: string; year: number; stops: JourneyStop[] }`
- `getJourneyChapters(stops: JourneyStop[], maxStopsPerChapter = 3): JourneyChapter[]`
  - Input stops are already chronological (from `getJourneyStops`).
  - Group by `edition.year`. A year group with ≤ max stops is one chapter
    (`id: "2023"`, `label: "2023"`).
  - A year group exceeding max splits into half-years by start-date month
    (Jan–Jun → H1, Jul–Dec → H2): `id: "2026-h1"`, `label: "2026 H1"`.
  - A half still exceeding max splits into quarters (Q1: Jan–Mar, Q2:
    Apr–Jun, Q3: Jul–Sep, Q4: Oct–Dec): `id: "2026-q1"`, `label: "2026 Q1"`.
    Quarters are the finest granularity; a quarter may exceed max (no further
    split — with 8 real stops this is theoretical).
  - Empty subdivisions are dropped. Chapters and the stops inside them stay
    chronological.
- `averageCoordinates(points: Array<[number, number]>): [number, number]` —
  spherical centroid: sum of unit vectors, normalized, back to lat/lon.
  Requires extracting `interpolateCoordinates`'s private `toVector` closure
  (and adding its lat/lon inverse) as shared module-level helpers. If the
  summed vector's magnitude is `< 1e-6` (degenerate, e.g. antipodal pair),
  fall back to `points[0]`.

Invariant the label rules rely on: a year is EITHER ≤ max stops (exactly one
whole-year chapter, label has no space) OR > max (only split chapters, labels
always contain a space) — never mixed. Chapter composition depends only on
edition dates, never the clock.

With today's content this yields exactly:
`[ {id:"2023", stops:[date-2023, iccad-2023]},
   {id:"2026-h1", stops:[aspdac-2026, sac-2026, date-2026]},
   {id:"2026-h2", stops:[dac-2026, esweek-2026, iccad-2026]} ]`.

## Playback (`app/components/conference-globe.tsx`)

- One segment per chapter, `CHAPTER_DURATION_MS = 1900` (~6s total for 3
  chapters). Per segment, with `eased = easeInOutCubic(t)`:
  - Camera eases from the segment's start position to
    `coordinatesToAngles(...averageCoordinates(chapter stops))`.
  - All arcs from every stop of the previous chapter to every stop of the
    current chapter reveal simultaneously: each arc's endpoint slides along
    its great circle with the same `eased` (reuse `interpolateCoordinates`).
    Chapter 0 has no arcs.
  - Every marker belonging to the current chapter is enlarged + coral
    (multi-highlight replaces v1's single-stop highlight; `buildMarkers`
    takes a `Set<string>` of highlighted place ids — a selected place outside
    playback passes a one-element set; empty set = no highlight, which is the
    intended ambient state). During playback the set contains ONLY the active
    chapter's stops — playback visually overrides any prior selection on the
    canvas, while `activePlaceId` itself is untouched until landing.
  - CANVAS MARKERS ONLY: anchor labels do not participate in playback
    highlighting. Label `is-active` styling stays driven solely by
    `activePlaceId` (unchanged during flight). This supersedes v1's "the
    arriving stop's label pulses" clause.
  - Arc color per TARGET stop status: signal blue when the target stop is
    past, journey coral when upcoming (same `legColor` rule as v1).
- Completed chapter fans persist bright during playback; on finish all fans
  redraw dimmed by `DIM_FACTOR` (a named constant, initially 0.45, tunable
  after the browser check) and the camera lands on `getNextUpcomingStop(flat
  stops) ?? last stop`, selecting it (unchanged v1 landing/selection).
- Replay clears trails first (v1 fix retained). Stop/interruption semantics,
  the `selectionSignature` interrupt effect, and reduced-motion short-circuit
  (instant dimmed fans + landing) all carry over; reduced-motion's "all
  trails" now means ALL chapter-transition arcs.
- State rename: `playbackLeg` → `playbackChapter` (index into chapters, −1
  idle). The timeline consumes it.

## Timeline strip

- Nodes: unchanged (one `<button>` per stop, same classes/aria/click).
- The timeline derives chapter structure itself via
  `getJourneyChapters(timelineStops)` and renders chapter-by-chapter (a
  stop's chapter index is therefore known at render time). A separator label
  is emitted BEFORE EACH CHAPTER'S FIRST STOP — not on year change; reusing
  v1's year-change trigger would drop the "H2" separator.
- Separator text: full `chapter.label` when the chapter's year differs from
  the previous chapter's year, otherwise only the suffix after the space
  (safe by the invariant above: same-year consecutive chapters are always
  splits, whose labels always contain a space). Rendering:
  `2023 ●● 2026 H1 ●●● H2 ●●●`.
- During playback, every node whose chapter index equals `playbackChapter`
  gets `is-playing` (multi-node highlight), and that chapter's separator
  label gets an `is-playing` class (colored `--journey`). A node may carry
  `is-current` (prior selection, ring) and `is-playing` (scale) at the same
  time — the two styles compose and no suppression is needed.
- Chapter composition depends only on dates, not the clock — labels are
  hydration-safe; node status classes keep their existing
  `suppressHydrationWarning`.

## Testing

- Unit (`tests/conference-model.test.mjs`): real-content chapters match the
  exact 3-chapter expectation above; a synthetic 7-stop year with fixed
  dates Jan 10, Feb 5, Mar 20, May 1, Jul 4, Aug 15, Nov 30 splits into
  `[Q1: Jan,Feb,Mar] [Q2: May] [H2: Jul,Aug,Nov]` (the half→quarter decision
  is made PER HALF: H1 has 4 stops → quarter split; H2 has 3 → stays a
  half-chapter; mixed granularity within one year is expected); ≤3-stop year
  stays whole;
  H1/H2 and quarter month boundaries (Jun vs Jul; Mar vs Apr);
  `averageCoordinates` identity, symmetric midpoint, and degenerate fallback
  cases.
- Degenerate playback: `chapters.length === 1` falls out as one segment
  (camera ease + highlight, zero arcs) — intentional, no special casing.
- Rendered HTML (`tests/rendered-html.test.mjs`): still 8 nodes; chapter
  labels "2023", "2026 H1", "H2" present; playback button present. Update
  any v1 assertions that pinned removed internals.
- Animation not auto-tested; browser drive (headless Chrome) verifies: fan
  reveal, multi-marker highlight, 15 dimmed trails after finish, landing on
  Long Beach, replay reset, both interrupt cases.

## Risks

- 15 persistent arcs may read as clutter; if the browser check shows a mess,
  the dimming factor may be lowered (e.g. ×0.3) at implementation review —
  a one-constant tweak.
- Camera centroid for a geographically wide chapter (e.g. Long
  Beach + Barcelona + San Jose) can leave stops near the globe's limb;
  acceptable for v2 (cobe shows a full hemisphere), noted for future
  per-chapter mini-pans if the browser check deems it unreadable.
- Inter-chapter pans can be very wide (mid-Atlantic centroid → Central Asia
  centroid in 1900ms). The browser check must judge whether the sweep reads
  as fast-but-followable; if not, CHAPTER_DURATION_MS is the tuning knob.
