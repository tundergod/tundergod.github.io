# Conference Journey Globe — Design

Date: 2026-07-20 · Status: approved (方案 A)

## Goal

Make the globe's purpose legible and compelling: it is the map of the owner's
research journey. Primary: a user-triggered, ~8-second cinematic fly-through of
all conference stops in chronological order. Secondary: a timeline strip that
doubles as a bidirectional exploration control. No new dependencies — everything
stays inside the existing cobe v2 + anchor-label architecture.

## Non-goals

- No per-stop cards or list interference during playback (pure visual flight).
- No three.js / overlay-canvas effects layer.
- No changes to the publication list/filter architecture beyond what the
  timeline reuses (`selectPlace`, existing place selection semantics).

## Data model (`app/lib/conference-model.ts`)

New pure functions, unit-testable with an injected `now: Date`:

- `parseEditionStartDate(edition): Date` — parses the existing
  `dates` strings (`"Nov. 8–12, 2026"`, `"Oct. 29–Nov. 2, 2023"`): month
  abbreviation + first day + year. Malformed input falls back to Jan 1 of
  `edition.year` (never throws; content is schema-validated).
- `getJourneyStops(editions, places, now): JourneyStop[]` — editions sorted by
  start date ascending, joined with their place; each stop gets
  `status: "past" | "upcoming"` (start date < now → past). Editions whose
  `placeId` has no matching place are skipped.
- `getNextUpcomingStop(stops): JourneyStop | undefined` — first upcoming stop;
  undefined when none (all past).

`JourneyStop = { edition, place, startDate, status }`.

## Playback (`app/components/conference-globe.tsx`)

> **SUPERSEDED:** this section is replaced by the chapter-based playback in
> `2026-07-20-globe-journey-chapters-design.md`. The rest of this spec
> (data parsing, interruption, reduced motion, a11y, fallback, landing)
> still governs.

- "Play journey" control rendered by the globe unit, at the left end of the
  journey strip under the globe frame (next to the timeline, keeping the
  feature self-contained in `ConferenceGlobe`); toggles to "Stop" while
  playing. Any stop-click, place selection, or second press interrupts playback
  and returns to the normal ambient/selected state.
- Flight: reuse the existing `easeAngle` render-loop easing. Sequence through
  the chronological stops (~1s per stop, ≈8s total). On arrival at stop N,
  reveal the arc from stop N−1 to N by animating its endpoint along the great
  circle (slerp between lat/lon pairs, updating `arcs` each frame); the
  arriving stop's label pulses via the existing `--marker-visibility` /
  active-label styling.
- Arc colors: past-to-past legs use `--signal` blue; legs ending at an
  upcoming stop use `--journey` coral (matches the site's existing
  blue = signal, coral = journey vocabulary).
- After the flight: all arcs remain as faint trails (reduced opacity via arc
  color dimming), and the camera lands on `getNextUpcomingStop()` (today: DAC,
  Long Beach), selecting it exactly as if the user clicked its label. If no
  upcoming stop exists, land on the last stop.
- Trails persist for the rest of the session (until a reload); they do not
  redraw on subsequent place selections. Replaying the journey resets and
  re-reveals them.
- `prefers-reduced-motion`: no flight animation — pressing Play immediately
  shows all trail arcs and selects the next upcoming stop.
- Browsers without CSS anchor positioning (existing `@supports` fallback):
  playback still works (camera + arcs are canvas-level); only label pulses are
  absent. The fallback index list keeps functioning.

## Timeline strip

- A thin horizontal strip under the globe frame: one node per journey stop,
  grouped by year with separators (2023 ｜ 2026). Chronological order.
- Node states: past = filled `--signal` blue; upcoming = hollow `--journey`
  coral outline; the next upcoming stop pulses (reusing the pulse-dot idiom);
  the currently selected place's node shows an active ring.
- Each node is a `<button>` (accessible name: series + year + city). Click →
  camera flies to that stop and selects the place via the existing
  `selectPlace` path, so the publication list filters exactly as today.
- During playback the timeline highlights the current leg; clicking a node
  mid-playback interrupts and jumps.
- Keyboard/AT: nodes are real buttons in DOM order; the strip has an
  `aria-label`; playback state changes are announced via the button's
  accessible name ("Play journey" / "Stop journey"). The flight itself is
  decorative (`canvas` stays `aria-hidden`).

## Styling

New CSS in `app/globals.css` following the existing token vocabulary
(`--signal`, `--journey`, `--line`, mono uppercase micro-labels ≥10px,
`focus-visible` outlines like `.filter-chip`). No layout changes to the
observatory grid; the strip lives inside `.globe-unit` below `.globe-frame`.

## Testing

- Unit (node --test, no browser): date parsing (both date formats, malformed
  fallback), journey ordering, past/upcoming classification with injected
  `now`, next-upcoming selection (including all-past edge).
- Rendered HTML: play button and timeline nodes present with accessible
  names; one node per conference edition.
- Animation itself is not auto-tested; reduced-motion branch is exercised by
  unit-testing the state transitions where practical.

## Risks

- cobe v2 `arcs` rendering quality is the main unknown; if arc visuals are
  unacceptable in practice, fallback is labels-only pulses during flight
  (design degrades gracefully; decision at implementation review).
- Timers in a client component must be cleaned up on unmount and on
  interruption (single rAF loop already exists; playback should piggyback on
  it rather than adding parallel timers).
