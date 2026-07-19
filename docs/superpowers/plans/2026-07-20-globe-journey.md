# Conference Journey Globe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** User-triggered ~8s cinematic fly-through of all conference stops with arc trails, plus a timeline strip under the globe that doubles as an exploration control.

**Architecture:** Pure functions for journey data in `app/lib/conference-model.ts` (date parsing, chronological stops with past/upcoming status, great-circle interpolation). Playback lives entirely inside `ConferenceGlobe`'s existing rAF render loop (no parallel timers), driving camera + cobe v2 `arcs` per frame via refs. Timeline strip renders below the globe frame and reuses the existing `selectPlace` path.

**Tech Stack:** Existing only — Next.js 16, React 19, cobe ^2.0.1 (`arcs` supported: `{from, to, color}`), node --test. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-20-globe-journey-design.md`

## Global Constraints

- Branch: work on `main` directly (repo convention); commit per task; do NOT push (controller pushes at the end).
- Gates per task: `npm run lint` + the named test commands must pass pristine; final task also runs full `npm test`.
- No new dependencies. Match existing code style exactly (no reformatting).
- Color vocabulary: signal blue = `[0.49, 0.78, 1]` / `var(--signal)` (past), journey coral = `[1, 0.54, 0.45]` / `var(--journey)` (upcoming). Trail arcs are the leg color dimmed by ×0.45.
- Leg duration 950ms; playback interruptible by Stop button, any place selection, or timeline click.
- `prefers-reduced-motion: reduce`: pressing Play skips the flight — immediately draws all trail arcs and selects the next upcoming stop.
- All text ≥10px; mono uppercase micro-label idiom; `:focus-visible` outlines like `.filter-chip`.
- Today's reference for manual sanity checks: 2026-07-20 → next upcoming stop is `dac-2026` (Long Beach, "Jul. 26–29, 2026").

---

### Task 1: Journey model functions

**Files:**
- Modify: `app/lib/conference-model.ts` (append after `coordinatesToAngles`)
- Test: `tests/conference-model.test.mjs` (append)

**Interfaces:**
- Consumes: existing `ConferenceEdition`, `Location` types from `../data/portfolio-schema.ts`.
- Produces (Task 2/3 rely on these exact signatures):
  - `type JourneyStatus = "past" | "upcoming"`
  - `type JourneyStop = { edition: ConferenceEdition; place: Location; startDate: Date; status: JourneyStatus }`
  - `parseEditionStartDate(edition: ConferenceEdition): Date`
  - `getJourneyStops(editions: ConferenceEdition[], places: Location[], now: Date): JourneyStop[]`
  - `getNextUpcomingStop(stops: JourneyStop[]): JourneyStop | undefined`
  - `interpolateCoordinates(from: [number, number], to: [number, number], t: number): [number, number]`

- [ ] **Step 1: Write the failing tests** — append to `tests/conference-model.test.mjs` (import the new functions alongside the existing imports at the top of the file):

```js
test("parses edition start dates from range strings", () => {
  const base = { id: "x", series: "X", name: "X", placeId: "p" };
  assert.deepEqual(
    parseEditionStartDate({ ...base, year: 2026, dates: "Nov. 8–12, 2026" }),
    new Date(2026, 10, 8),
  );
  assert.deepEqual(
    parseEditionStartDate({ ...base, year: 2023, dates: "Oct. 29–Nov. 2, 2023" }),
    new Date(2023, 9, 29),
  );
  assert.deepEqual(
    parseEditionStartDate({ ...base, year: 2026, dates: "sometime in 2026" }),
    new Date(2026, 0, 1),
  );
});

test("orders journey stops chronologically and classifies past/upcoming", () => {
  const now = new Date(2026, 6, 20);
  const stops = getJourneyStops(conferenceEditions, places, now);
  assert.equal(stops.length, conferenceEditions.length);
  assert.equal(stops[0]?.edition.id, "date-2023");
  assert.equal(stops[1]?.edition.id, "iccad-2023");
  assert.equal(stops[stops.length - 1]?.edition.id, "iccad-2026");
  const statuses = new Map(stops.map((stop) => [stop.edition.id, stop.status]));
  assert.equal(statuses.get("date-2026"), "past");
  assert.equal(statuses.get("dac-2026"), "upcoming");
  assert.equal(getNextUpcomingStop(stops)?.edition.id, "dac-2026");
});

test("getNextUpcomingStop is undefined when every stop is past", () => {
  const stops = getJourneyStops(conferenceEditions, places, new Date(2030, 0, 1));
  assert.equal(getNextUpcomingStop(stops), undefined);
});

test("interpolateCoordinates follows the great circle", () => {
  assert.deepEqual(interpolateCoordinates([10, 20], [50, 60], 0), [10, 20]);
  const end = interpolateCoordinates([10, 20], [50, 60], 1);
  assert.ok(Math.abs(end[0] - 50) < 1e-9 && Math.abs(end[1] - 60) < 1e-9);
  const mid = interpolateCoordinates([0, 0], [0, 90], 0.5);
  assert.ok(Math.abs(mid[0] - 0) < 1e-9 && Math.abs(mid[1] - 45) < 1e-9);
});
```

Note: `date-2023` (Apr. 17) precedes `iccad-2023` (Oct. 29) — the assertion order above is correct.

- [ ] **Step 2: Run to verify failure** — `npm run test:model`. Expected: FAIL (`parseEditionStartDate is not a function` / import error).

- [ ] **Step 3: Implement** — append to `app/lib/conference-model.ts`:

```ts
export type JourneyStatus = "past" | "upcoming";

export type JourneyStop = {
  edition: ConferenceEdition;
  place: Location;
  startDate: Date;
  status: JourneyStatus;
};

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parseEditionStartDate(edition: ConferenceEdition): Date {
  const match = /^([A-Za-z]{3})[A-Za-z.]*\s+(\d{1,2})/.exec(edition.dates);
  const month = match ? MONTH_INDEX[match[1].toLowerCase()] : undefined;
  if (match && month !== undefined) {
    return new Date(edition.year, month, Number(match[2]));
  }
  return new Date(edition.year, 0, 1);
}

export function getJourneyStops(
  editions: ConferenceEdition[],
  places: Location[],
  now: Date,
): JourneyStop[] {
  const placesById = new Map(places.map((place) => [place.id, place]));
  return editions
    .flatMap((edition) => {
      const place = placesById.get(edition.placeId);
      if (!place) return [];
      const startDate = parseEditionStartDate(edition);
      const status: JourneyStatus = startDate < now ? "past" : "upcoming";
      return [{ edition, place, startDate, status }];
    })
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export function getNextUpcomingStop(stops: JourneyStop[]) {
  return stops.find((stop) => stop.status === "upcoming");
}

export function interpolateCoordinates(
  from: [number, number],
  to: [number, number],
  t: number,
): [number, number] {
  const toVector = ([latitude, longitude]: [number, number]) => {
    const lat = (latitude * Math.PI) / 180;
    const lon = (longitude * Math.PI) / 180;
    return [
      Math.cos(lat) * Math.cos(lon),
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
    ];
  };
  const a = toVector(from);
  const b = toVector(to);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return to;
  const sinOmega = Math.sin(omega);
  const s0 = Math.sin((1 - t) * omega) / sinOmega;
  const s1 = Math.sin(t * omega) / sinOmega;
  const v = [
    s0 * a[0] + s1 * b[0],
    s0 * a[1] + s1 * b[1],
    s0 * a[2] + s1 * b[2],
  ];
  const latitude = (Math.asin(Math.max(-1, Math.min(1, v[2]))) * 180) / Math.PI;
  const longitude = (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  return [latitude, longitude];
}
```

- [ ] **Step 4: Run to verify pass** — `npm run test:model` (all pass) and `npm run lint`.

- [ ] **Step 5: Commit** — `git add app/lib/conference-model.ts tests/conference-model.test.mjs && git commit -m "feat: add journey model functions"`

---

### Task 2: Playback engine in ConferenceGlobe

**Files:**
- Modify: `app/components/conference-globe.tsx`
- Modify: `app/globals.css` (append `.journey-strip` / `.journey-play` rules)

**Interfaces:**
- Consumes from Task 1: `getJourneyStops`, `getNextUpcomingStop`, `interpolateCoordinates`, `JourneyStop` (plus existing `coordinatesToAngles`, cobe `Arc` type: `import createGlobe, { type Arc, type Marker } from "cobe"`).
- Produces for Task 3: component state `isPlaying: boolean`, `playbackLeg: number` (−1 when idle), functions `startJourney()`, `stopJourney()`, `handleSelectPlace(placeId: string)` (interrupt-then-select — Task 3's timeline uses it), and the `.journey-strip` container div rendered after `.globe-frame` inside `.globe-unit` (Task 3 appends the timeline into it).

Manual acceptance (not automated): `npm run dev`, press Play journey — camera flies 2023→2026 in order, arcs draw leg by leg (blue to past stops, coral into upcoming ones), ends selected on Long Beach with faint trails; pressing Stop mid-flight halts; clicking any city label mid-flight interrupts; with OS reduced-motion on, Play instantly shows trails + selects Long Beach.

- [ ] **Step 1: Module-scope helpers** — in `conference-globe.tsx`, extend the cobe import to `import createGlobe, { type Arc, type Marker } from "cobe";`, add `getJourneyStops, getNextUpcomingStop, interpolateCoordinates, type JourneyStop` to the conference-model import, and add above `easeAngle`:

```ts
const LEG_DURATION_MS = 950;
const SIGNAL_RGB: [number, number, number] = [0.49, 0.78, 1];
const JOURNEY_RGB: [number, number, number] = [1, 0.54, 0.45];

type PlaybackState = {
  legIndex: number;
  legStartedAt: number;
  from: { phi: number; theta: number };
  trailArcs: Arc[];
};

function dimColor(color: [number, number, number]): [number, number, number] {
  return [color[0] * 0.45, color[1] * 0.45, color[2] * 0.45];
}

function legColor(stop: JourneyStop) {
  return stop.status === "upcoming" ? JOURNEY_RGB : SIGNAL_RGB;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function interpolateAngle(from: number, to: number, t: number) {
  let difference = to - from;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return from + difference * t;
}
```

- [ ] **Step 2: Component state, refs, and handlers** — inside `ConferenceGlobe`, after the existing refs:

```tsx
const playbackRef = useRef<PlaybackState | null>(null);
const arcsRef = useRef<Arc[]>([]);
const journeyStopsRef = useRef<JourneyStop[]>([]);
const cameraRef = useRef({ ...targetRef.current });
const [isPlaying, setIsPlaying] = useState(false);
const [playbackLeg, setPlaybackLeg] = useState(-1);

const handleFinishRef = useRef(() => {});
handleFinishRef.current = () => {
  const stops = journeyStopsRef.current;
  arcsRef.current = stops.slice(1).map((stop, index) => ({
    from: [stops[index].place.latitude, stops[index].place.longitude] as [number, number],
    to: [stop.place.latitude, stop.place.longitude] as [number, number],
    color: dimColor(legColor(stop)),
  }));
  playbackRef.current = null;
  setIsPlaying(false);
  setPlaybackLeg(-1);
  const landing = getNextUpcomingStop(stops) ?? stops[stops.length - 1];
  if (landing) onSelectPlace(landing.place.id);
};
```

And with the other component functions:

```tsx
function stopJourney() {
  const playback = playbackRef.current;
  if (!playback) return;
  arcsRef.current = playback.trailArcs;
  playbackRef.current = null;
  setIsPlaying(false);
  setPlaybackLeg(-1);
}

function startJourney() {
  if (playbackRef.current) {
    stopJourney();
    return;
  }
  const stops = getJourneyStops(conferenceEditions, places, new Date());
  if (stops.length === 0) return;
  journeyStopsRef.current = stops;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    handleFinishRef.current();
    return;
  }
  playbackRef.current = {
    legIndex: 0,
    legStartedAt: performance.now(),
    from: { ...cameraRef.current },
    trailArcs: [],
  };
  setIsPlaying(true);
  setPlaybackLeg(0);
}

function handleSelectPlace(placeId: string) {
  stopJourney();
  onSelectPlace(placeId);
}
```

Replace every existing `onSelectPlace(...)` call in label buttons, cluster menu buttons, and the fallback index with `handleSelectPlace(...)` (the prop itself is still used inside `handleFinishRef`).

- [ ] **Step 3: Render-loop playback branch** — in the globe effect: initialize `cameraRef.current = { phi, theta };` right after `let phi/theta` are set; change `buildMarkers` to accept the highlight id:

```ts
const buildMarkers = (highlightedPlaceId?: string): Marker[] =>
  placesWithConferences.map(({ place }) => ({
    id: place.id,
    location: [place.latitude, place.longitude] as [number, number],
    size: highlightedPlaceId === place.id ? 0.085 : 0.045,
    color: highlightedPlaceId === place.id ? JOURNEY_RGB : SIGNAL_RGB,
  }));
```

(`createGlobe` initial options keep `markers: buildMarkers(activePlaceRef.current?.id)`.) Then rework `render()`:

```ts
const render = () => {
  const playback = playbackRef.current;
  let highlightedPlaceId = activePlaceRef.current?.id;
  if (playback) {
    const stops = journeyStopsRef.current;
    const stop = stops[playback.legIndex];
    const progress = Math.min(
      1,
      (performance.now() - playback.legStartedAt) / LEG_DURATION_MS,
    );
    const eased = easeInOutCubic(progress);
    const target = coordinatesToAngles(stop.place.latitude, stop.place.longitude);
    phi = interpolateAngle(playback.from.phi, target.phi, eased);
    theta = playback.from.theta + (target.theta - playback.from.theta) * eased;
    highlightedPlaceId = stop.place.id;
    const previous = stops[playback.legIndex - 1];
    if (previous) {
      arcsRef.current = [
        ...playback.trailArcs,
        {
          from: [previous.place.latitude, previous.place.longitude] as [number, number],
          to: interpolateCoordinates(
            [previous.place.latitude, previous.place.longitude],
            [stop.place.latitude, stop.place.longitude],
            eased,
          ),
          color: legColor(stop),
        },
      ];
    }
    if (progress >= 1) {
      if (previous) {
        playback.trailArcs = [
          ...playback.trailArcs,
          {
            from: [previous.place.latitude, previous.place.longitude] as [number, number],
            to: [stop.place.latitude, stop.place.longitude] as [number, number],
            color: legColor(stop),
          },
        ];
      }
      if (playback.legIndex >= stops.length - 1) {
        handleFinishRef.current();
      } else {
        playback.legIndex += 1;
        playback.legStartedAt = performance.now();
        playback.from = { phi, theta };
        setPlaybackLeg(playback.legIndex);
      }
    }
  } else if (activePlaceRef.current) {
    const target = targetRef.current;
    phi = easeAngle(phi, target.phi, reducedMotion ? 1 : 0.045);
    theta += (target.theta - theta) * (reducedMotion ? 1 : 0.045);
  } else if (!reducedMotion && !interactionPausedRef.current) {
    phi += 0.0022;
  }
  cameraRef.current = { phi, theta };

  globe.update({
    width: size * 2,
    height: size * 2,
    phi,
    theta,
    markers: buildMarkers(highlightedPlaceId),
    arcs: arcsRef.current,
  });
  if (collisionFrame % 8 === 0) updateLabelGroups();
  collisionFrame += 1;
  animationFrame = requestAnimationFrame(render);
};
```

Also change the `createGlobe` initial `arcs: []` to `arcs: arcsRef.current`.

- [ ] **Step 4: Play button JSX** — inside `.globe-unit`, after the `.globe-frame` div:

```tsx
<div className="journey-strip">
  <button className="journey-play" type="button" onClick={startJourney}>
    {isPlaying ? "Stop journey" : "Play journey"}
  </button>
</div>
```

- [ ] **Step 5: CSS** — append to `app/globals.css` (near the other `globe-*` rules):

```css
.journey-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  margin-top: 14px;
}

.journey-play {
  padding: 6px 10px;
  border: 1px solid var(--line);
  color: var(--muted);
  background: transparent;
  font-family: var(--font-geist-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease;
}

.journey-play:hover,
.journey-play:focus-visible {
  color: var(--journey);
  border-color: var(--journey);
}

.journey-play:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}
```

- [ ] **Step 6: Verify** — `npm run lint`, `npm run test:model`, then full `npm test` (build + rendered HTML must stay green). Run the manual acceptance pass above via `npm run dev` and report what you observed (arc rendering quality is a named spec risk — describe it).

- [ ] **Step 7: Commit** — `git add app/components/conference-globe.tsx app/globals.css && git commit -m "feat: add journey playback with arc trails to conference globe"`

---

### Task 3: Timeline strip + rendered-HTML tests

**Files:**
- Modify: `app/components/conference-globe.tsx` (timeline nodes inside `.journey-strip`)
- Modify: `app/globals.css` (timeline rules)
- Test: `tests/rendered-html.test.mjs` (append)

**Interfaces:**
- Consumes from Task 2: `isPlaying`, `playbackLeg`, `handleSelectPlace`, the `.journey-strip` container. From Task 1: `getJourneyStops`, `getNextUpcomingStop`.
- Produces: final user-facing feature; no downstream consumers.

- [ ] **Step 1: Write the failing rendered-HTML test** — append to `tests/rendered-html.test.mjs`, following the file's existing `render()` helper pattern and exact city strings from `content/locations.json`:

```js
test("journey playback control and timeline are rendered", async () => {
  const html = await render("/");
  assert.match(html, /Play journey/);
  const nodeCount = (html.match(/journey-node/g) ?? []).length;
  assert.ok(nodeCount >= 8, `expected 8 timeline nodes, saw ${nodeCount}`);
  assert.match(html, /ICCAD 2023, San Francisco/);
  assert.match(html, /DAC 2026, Long Beach/);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` (rendered-html only fails on the new test). Expected: FAIL.

- [ ] **Step 3: Timeline implementation** — in `ConferenceGlobe`: add `Fragment` and `useState` (already imported) usage:

```tsx
const [timelineNow] = useState(() => new Date());
const timelineStops = useMemo(
  () => getJourneyStops(conferenceEditions, places, timelineNow),
  [conferenceEditions, places, timelineNow],
);
const nextUpcomingEditionId = getNextUpcomingStop(timelineStops)?.edition.id;
```

Inside `.journey-strip`, after the play button:

```tsx
<div className="journey-timeline" role="group" aria-label="Conference journey timeline">
  {timelineStops.map((stop, index) => {
    const previousStop = timelineStops[index - 1];
    const showYear = !previousStop || previousStop.edition.year !== stop.edition.year;
    const classNames = ["journey-node", stop.status === "past" ? "is-past" : "is-upcoming"];
    if (stop.edition.id === nextUpcomingEditionId) classNames.push("is-next");
    if (stop.place.id === activePlaceId) classNames.push("is-current");
    if (isPlaying && index === playbackLeg) classNames.push("is-playing");
    return (
      <Fragment key={stop.edition.id}>
        {showYear && (
          <span className="journey-year" aria-hidden="true">{stop.edition.year}</span>
        )}
        <button
          className={classNames.join(" ")}
          type="button"
          suppressHydrationWarning
          aria-label={`${stop.edition.series} ${stop.edition.year}, ${stop.place.city}`}
          aria-pressed={stop.place.id === activePlaceId}
          onClick={() => handleSelectPlace(stop.place.id)}
        />
      </Fragment>
    );
  })}
</div>
```

(`suppressHydrationWarning` because `status` classes derive from the clock: build-time SSR vs. client can differ on a conference's start day.) Add `Fragment` to the react import.

- [ ] **Step 4: CSS** — append to `app/globals.css` after the `.journey-play` rules:

```css
.journey-timeline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.journey-year {
  margin-left: 6px;
  color: var(--steel-light);
  font-family: var(--font-geist-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.journey-year:first-child {
  margin-left: 0;
}

.journey-node {
  width: 10px;
  height: 10px;
  padding: 0;
  border: 1px solid var(--signal);
  border-radius: 50%;
  background: var(--signal);
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.journey-node.is-upcoming {
  border-color: var(--journey);
  background: transparent;
}

.journey-node.is-next {
  animation: journey-pulse 1.8s ease-in-out infinite;
}

@keyframes journey-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 138, 116, 0.45); }
  50% { box-shadow: 0 0 0 5px rgba(255, 138, 116, 0); }
}

.journey-node.is-current {
  box-shadow: 0 0 0 3px rgba(124, 199, 255, 0.35);
}

.journey-node.is-playing,
.journey-node:hover {
  transform: scale(1.3);
}

.journey-node:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}
```

(The existing global `prefers-reduced-motion` rule already suppresses `journey-pulse`.)

- [ ] **Step 5: Run to verify pass** — `npm run lint`, full `npm test`, and `npm run test:pages`. All green, pristine.

- [ ] **Step 6: Commit** — `git add app/components/conference-globe.tsx app/globals.css tests/rendered-html.test.mjs && git commit -m "feat: add journey timeline strip under the globe"`
