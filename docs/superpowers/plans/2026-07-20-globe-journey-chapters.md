# Chapter Playback (Journey v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stop-by-stop journey flight with temporal chapters (year / half / quarter) connected by many-to-many arc fans.

**Architecture:** Chapter grouping and spherical centroid are pure functions in `app/lib/conference-model.ts`. The globe's existing rAF playback engine changes from per-stop legs to per-chapter segments: camera eases to the chapter centroid while the full fan from the previous chapter reveals with one shared eased t. Timeline renders chapter-by-chapter (separator before each chapter's first node).

**Tech Stack:** Existing only. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-20-globe-journey-chapters-design.md` (v1 spec still governs carried-over behavior).

## Global Constraints

- Branch: `main`, commit per task, do NOT push (controller pushes after final verification).
- Gates per task: `npm run lint` + named test commands, pristine; Task 2 also runs full `npm test`.
- Strict React Compiler lint rules (`react-hooks/purity`, `react-hooks/refs`): follow the component's existing `useCallback` + latest-ref-effect patterns; if the plan's literal code trips a rule, adapt minimally and report the deviation.
- Constants: `CHAPTER_DURATION_MS = 1900`, `DIM_FACTOR = 0.45`, max stops per chapter default `3`.
- Colors unchanged: `SIGNAL_RGB [0.49, 0.78, 1]` (arc into a past stop), `JOURNEY_RGB [1, 0.54, 0.45]` (arc into an upcoming stop), trails dimmed ×`DIM_FACTOR`.
- Carried-over v1 behavior must keep working: replay clears trails, Stop/selection/`selectionSignature` interruption, reduced-motion instant-trails, landing on next upcoming stop, 24px timeline hit targets, `suppressHydrationWarning` on nodes.

---

### Task 1: Chapter model + spherical centroid

**Files:**
- Modify: `app/lib/conference-model.ts`
- Test: `tests/conference-model.test.mjs` (append)

**Interfaces:**
- Consumes: existing `JourneyStop` (has `edition`, `place`, `startDate: Date`, `status`).
- Produces (Task 2 relies on exact signatures):
  - `type JourneyChapter = { id: string; label: string; year: number; stops: JourneyStop[] }`
  - `getJourneyChapters(stops: JourneyStop[], maxStopsPerChapter = 3): JourneyChapter[]`
  - `averageCoordinates(points: Array<[number, number]>): [number, number]`
- Internal refactor: extract `interpolateCoordinates`'s private `toVector` closure to a module-level helper and add its inverse `toCoordinates`; `interpolateCoordinates` behavior must not change (existing tests stay green).

- [ ] **Step 1: Write the failing tests** — append to `tests/conference-model.test.mjs` (add `getJourneyChapters, averageCoordinates` to the existing import list). Also add this helper above the new tests:

```js
function syntheticStop(id, year, month, day) {
  return {
    edition: { id, series: id.toUpperCase(), name: id, year, dates: "", placeId: "p" },
    place: { id: "p", city: "P", country: "P", latitude: 0, longitude: 0 },
    startDate: new Date(year, month, day),
    status: "past",
  };
}

const close = (a, b) => Math.abs(a - b) < 1e-9;

test("chapters group the real content into year and half-year chapters", () => {
  const stops = getJourneyStops(conferenceEditions, places, new Date(2026, 6, 20));
  const chapters = getJourneyChapters(stops);
  assert.deepEqual(
    chapters.map(({ id, stops: chapterStops }) => [
      id,
      chapterStops.map((stop) => stop.edition.id),
    ]),
    [
      ["2023", ["date-2023", "iccad-2023"]],
      ["2026-h1", ["aspdac-2026", "sac-2026", "date-2026"]],
      ["2026-h2", ["dac-2026", "esweek-2026", "iccad-2026"]],
    ],
  );
  assert.deepEqual(
    chapters.map(({ label }) => label),
    ["2023", "2026 H1", "2026 H2"],
  );
});

test("a dense half splits into quarters while the other half stays whole", () => {
  const stops = [
    syntheticStop("a", 2027, 0, 10),
    syntheticStop("b", 2027, 1, 5),
    syntheticStop("c", 2027, 2, 20),
    syntheticStop("d", 2027, 4, 1),
    syntheticStop("e", 2027, 6, 4),
    syntheticStop("f", 2027, 7, 15),
    syntheticStop("g", 2027, 10, 30),
  ];
  const chapters = getJourneyChapters(stops);
  assert.deepEqual(
    chapters.map(({ id, stops: chapterStops }) => [
      id,
      chapterStops.map((stop) => stop.edition.id),
    ]),
    [
      ["2027-q1", ["a", "b", "c"]],
      ["2027-q2", ["d"]],
      ["2027-h2", ["e", "f", "g"]],
    ],
  );
  assert.equal(chapters[2].label, "2027 H2");
});

test("half boundary: June stays in H1, July starts H2", () => {
  const stops = [
    syntheticStop("mar", 2029, 2, 31),
    syntheticStop("apr", 2029, 3, 1),
    syntheticStop("jun", 2029, 5, 30),
    syntheticStop("jul", 2029, 6, 1),
  ];
  const chapters = getJourneyChapters(stops);
  assert.deepEqual(
    chapters.map(({ id, stops: chapterStops }) => [
      id,
      chapterStops.map((stop) => stop.edition.id),
    ]),
    [
      ["2029-h1", ["mar", "apr", "jun"]],
      ["2029-h2", ["jul"]],
    ],
  );
});

test("quarter boundary: March 31 in Q1, April 1 in Q2", () => {
  const stops = [
    syntheticStop("m1", 2028, 0, 1),
    syntheticStop("m2", 2028, 1, 1),
    syntheticStop("mar", 2028, 2, 31),
    syntheticStop("apr", 2028, 3, 1),
  ];
  const chapters = getJourneyChapters(stops);
  assert.deepEqual(
    chapters.map(({ id, stops: chapterStops }) => [
      id,
      chapterStops.map((stop) => stop.edition.id),
    ]),
    [
      ["2028-q1", ["m1", "m2", "mar"]],
      ["2028-q2", ["apr"]],
    ],
  );
});

test("averageCoordinates finds spherical centroids", () => {
  const single = averageCoordinates([[25, 121]]);
  assert.ok(close(single[0], 25) && close(single[1], 121));
  const mid = averageCoordinates([[10, 0], [-10, 0]]);
  assert.ok(close(mid[0], 0) && close(mid[1], 0));
  const antipodal = averageCoordinates([[0, 0], [0, 180]]);
  assert.deepEqual(antipodal, [0, 0]);
});
```

- [ ] **Step 2: Run to verify failure** — `npm run test:model`. Expected: FAIL (missing exports).

- [ ] **Step 3: Implement in `app/lib/conference-model.ts`** — first the vector refactor: replace `interpolateCoordinates`'s inner `toVector` closure and inline lat/lon reconstruction with these module-level helpers (place them just above `interpolateCoordinates`), keeping its logic otherwise identical:

```ts
function toVector([latitude, longitude]: [number, number]): [number, number, number] {
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180;
  return [
    Math.cos(lat) * Math.cos(lon),
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
  ];
}

function toCoordinates(vector: [number, number, number]): [number, number] {
  const latitude = (Math.asin(Math.max(-1, Math.min(1, vector[2]))) * 180) / Math.PI;
  const longitude = (Math.atan2(vector[1], vector[0]) * 180) / Math.PI;
  return [latitude, longitude];
}
```

Then append:

```ts
export type JourneyChapter = {
  id: string;
  label: string;
  year: number;
  stops: JourneyStop[];
};

const HALF_LABELS = ["H1", "H2"];
const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"];

export function getJourneyChapters(
  stops: JourneyStop[],
  maxStopsPerChapter = 3,
): JourneyChapter[] {
  const chapters: JourneyChapter[] = [];
  const years = [...new Set(stops.map((stop) => stop.edition.year))];
  for (const year of years) {
    const yearStops = stops.filter((stop) => stop.edition.year === year);
    if (yearStops.length <= maxStopsPerChapter) {
      chapters.push({ id: String(year), label: String(year), year, stops: yearStops });
      continue;
    }
    for (let half = 0; half < 2; half += 1) {
      const halfStops = yearStops.filter(
        (stop) => Math.floor(stop.startDate.getMonth() / 6) === half,
      );
      if (halfStops.length === 0) continue;
      if (halfStops.length <= maxStopsPerChapter) {
        chapters.push({
          id: `${year}-${HALF_LABELS[half].toLowerCase()}`,
          label: `${year} ${HALF_LABELS[half]}`,
          year,
          stops: halfStops,
        });
        continue;
      }
      for (let quarter = half * 2; quarter < half * 2 + 2; quarter += 1) {
        const quarterStops = yearStops.filter(
          (stop) => Math.floor(stop.startDate.getMonth() / 3) === quarter,
        );
        if (quarterStops.length === 0) continue;
        chapters.push({
          id: `${year}-${QUARTER_LABELS[quarter].toLowerCase()}`,
          label: `${year} ${QUARTER_LABELS[quarter]}`,
          year,
          stops: quarterStops,
        });
      }
    }
  }
  return chapters;
}

export function averageCoordinates(
  points: Array<[number, number]>,
): [number, number] {
  const sum: [number, number, number] = [0, 0, 0];
  for (const point of points) {
    const vector = toVector(point);
    sum[0] += vector[0];
    sum[1] += vector[1];
    sum[2] += vector[2];
  }
  const magnitude = Math.hypot(sum[0], sum[1], sum[2]);
  if (magnitude < 1e-6) return points[0];
  return toCoordinates([sum[0] / magnitude, sum[1] / magnitude, sum[2] / magnitude]);
}
```

Note: years/quarters iterate in chronological order automatically because `stops` is pre-sorted and `Set` preserves insertion order.

TS pitfall (from plan review): when rewriting `interpolateCoordinates` to use `toCoordinates`, its local result vector currently infers `number[]`; pass a tuple explicitly (e.g. `return toCoordinates([v[0], v[1], v[2]]);` or annotate `const v: [number, number, number]`) or strict TS rejects it.

- [ ] **Step 4: Run to verify pass** — `npm run test:model` (ALL tests including the pre-existing `interpolateCoordinates` ones), `npm run lint`.

- [ ] **Step 5: Commit** — `git add app/lib/conference-model.ts tests/conference-model.test.mjs && git commit -m "feat: add journey chapter grouping and spherical centroid"`

---

### Task 2: Chapter playback + chapter timeline

**Files:**
- Modify: `app/components/conference-globe.tsx`
- Modify: `app/globals.css` (one new rule)
- Test: `tests/rendered-html.test.mjs` (append one test)

**Interfaces:**
- Consumes from Task 1: `getJourneyChapters`, `averageCoordinates`, `JourneyChapter` (add to the conference-model import).
- Produces: final feature. State rename `playbackLeg` → `playbackChapter` is internal.

- [ ] **Step 1: Write the failing rendered-HTML test** — append to `tests/rendered-html.test.mjs` (same `render()`/`.text()` helper pattern as the existing journey test):

```js
test("journey timeline renders chapter separators", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, />2023</);
  assert.match(html, />2026 H1</);
  assert.match(html, />H2</);
  assert.doesNotMatch(html, />2026 H2</);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test`. Expected: only this new test fails.

- [ ] **Step 3: Rework the playback engine in `conference-globe.tsx`.**

Module scope — rename/replace v1 pieces:

```ts
const CHAPTER_DURATION_MS = 1900;
const DIM_FACTOR = 0.45;
const EMPTY_HIGHLIGHT: ReadonlySet<string> = new Set();

type PlaybackState = {
  chapterIndex: number;
  chapterStartedAt: number;
  from: { phi: number; theta: number };
  trailArcs: Arc[];
};

function dimColor(color: [number, number, number]): [number, number, number] {
  return [color[0] * DIM_FACTOR, color[1] * DIM_FACTOR, color[2] * DIM_FACTOR];
}

function buildChapterArcs(
  previous: JourneyChapter | undefined,
  current: JourneyChapter,
  t: number,
): Arc[] {
  if (!previous) return [];
  return previous.stops.flatMap((fromStop) =>
    current.stops.map((toStop) => ({
      from: [fromStop.place.latitude, fromStop.place.longitude] as [number, number],
      to: t >= 1
        ? ([toStop.place.latitude, toStop.place.longitude] as [number, number])
        : interpolateCoordinates(
            [fromStop.place.latitude, fromStop.place.longitude],
            [toStop.place.latitude, toStop.place.longitude],
            t,
          ),
      color: legColor(toStop),
    })),
  );
}
```

Delete `LEG_DURATION_MS`. Keep `legColor`, `easeInOutCubic`, `SIGNAL_RGB`, `JOURNEY_RGB`.

Component — replace the v1 refs/state:

```ts
const journeyChaptersRef = useRef<JourneyChapter[]>([]);
const [playbackChapter, setPlaybackChapter] = useState(-1);
```

(`journeyStopsRef` stays — the finish handler still lands via flat stops.) Rename every `playbackLeg`/`setPlaybackLeg` use. In `startJourney`, after `journeyStopsRef.current = stops;` add `journeyChaptersRef.current = getJourneyChapters(stops);` (in BOTH the reduced-motion and animated paths — set it before the reduced-motion branch), and change the playback init to `{ chapterIndex: 0, chapterStartedAt: performance.now(), from: { ...cameraRef.current }, trailArcs: [] }` with `setPlaybackChapter(0)`.

Finish handler — fans instead of legs. IMPORTANT: this stays inside the existing no-dep `useEffect` that refreshes `handleFinishRef` every render (so it captures the latest `onSelectPlace`); do not hoist it. The `arc.color as [number, number, number]` cast below is load-bearing — keep it:

```ts
handleFinishRef.current = () => {
  const chapters = journeyChaptersRef.current;
  const stops = journeyStopsRef.current;
  arcsRef.current = chapters.flatMap((chapter, index) =>
    buildChapterArcs(chapters[index - 1], chapter, 1).map((arc) => ({
      ...arc,
      color: dimColor(arc.color as [number, number, number]),
    })),
  );
  playbackRef.current = null;
  setIsPlaying(false);
  setPlaybackChapter(-1);
  const landing = getNextUpcomingStop(stops) ?? stops[stops.length - 1];
  if (landing) onSelectPlace(landing.place.id);
};
```

`buildMarkers` — Set-based multi-highlight:

```ts
const buildMarkers = (highlighted: ReadonlySet<string>): Marker[] =>
  placesWithConferences.map(({ place }) => ({
    id: place.id,
    location: [place.latitude, place.longitude] as [number, number],
    size: highlighted.has(place.id) ? 0.085 : 0.045,
    color: highlighted.has(place.id) ? JOURNEY_RGB : SIGNAL_RGB,
  }));
```

`createGlobe` initial options: `markers: buildMarkers(activePlaceRef.current ? new Set([activePlaceRef.current.id]) : EMPTY_HIGHLIGHT)`.

Render loop playback branch (replaces the per-leg branch wholesale; the two non-playback branches and the trailing `cameraRef` write / `globe.update` stay as they are, except `buildMarkers` now receives the set):

```ts
const playback = playbackRef.current;
let highlighted: ReadonlySet<string> = activePlaceRef.current
  ? new Set([activePlaceRef.current.id])
  : EMPTY_HIGHLIGHT;
if (playback) {
  const chapters = journeyChaptersRef.current;
  const chapter = chapters[playback.chapterIndex];
  const progress = Math.min(
    1,
    (performance.now() - playback.chapterStartedAt) / CHAPTER_DURATION_MS,
  );
  const eased = easeInOutCubic(progress);
  const centroid = averageCoordinates(
    chapter.stops.map((stop) => [stop.place.latitude, stop.place.longitude]),
  );
  const target = coordinatesToAngles(centroid[0], centroid[1]);
  phi = easeAngle(playback.from.phi, target.phi, eased);
  theta = playback.from.theta + (target.theta - playback.from.theta) * eased;
  highlighted = new Set(chapter.stops.map((stop) => stop.place.id));
  const previous = chapters[playback.chapterIndex - 1];
  if (previous) {
    arcsRef.current = [
      ...playback.trailArcs,
      ...buildChapterArcs(previous, chapter, eased),
    ];
  }
  if (progress >= 1) {
    if (previous) {
      playback.trailArcs = [
        ...playback.trailArcs,
        ...buildChapterArcs(previous, chapter, 1),
      ];
    }
    if (playback.chapterIndex >= chapters.length - 1) {
      handleFinishRef.current();
    } else {
      playback.chapterIndex += 1;
      playback.chapterStartedAt = performance.now();
      playback.from = { phi, theta };
      setPlaybackChapter(playback.chapterIndex);
    }
  }
} else if (activePlaceRef.current) {
  // ... unchanged v1 easing branch
} else if (!reducedMotion && !interactionPausedRef.current) {
  // ... unchanged ambient branch
}
```

(`easeAngle(from, target, eased)` is correct here: `from` is fixed per segment, so amount-based and t-based interpolation coincide.)

- [ ] **Step 4: Rework the timeline to chapter-by-chapter rendering.** Replace the flat `timelineStops.map(...)` block:

```tsx
const timelineChapters = useMemo(
  () => getJourneyChapters(timelineStops),
  [timelineStops],
);
```

```tsx
<div className="journey-timeline" role="group" aria-label="Conference journey timeline">
  {timelineChapters.map((chapter, chapterIndex) => {
    const previousChapter = timelineChapters[chapterIndex - 1];
    const separator =
      !previousChapter || previousChapter.year !== chapter.year
        ? chapter.label
        : chapter.label.slice(chapter.label.indexOf(" ") + 1);
    const chapterActive = isPlaying && chapterIndex === playbackChapter;
    return (
      <Fragment key={chapter.id}>
        <span
          className={chapterActive ? "journey-year is-playing" : "journey-year"}
          aria-hidden="true"
        >
          {separator}
        </span>
        {chapter.stops.map((stop) => {
          const classNames = [
            "journey-node",
            stop.status === "past" ? "is-past" : "is-upcoming",
          ];
          if (stop.edition.id === nextUpcomingEditionId) classNames.push("is-next");
          if (stop.place.id === activePlaceId) classNames.push("is-current");
          if (chapterActive) classNames.push("is-playing");
          return (
            <button
              className={classNames.join(" ")}
              type="button"
              key={stop.edition.id}
              suppressHydrationWarning
              aria-label={`${stop.edition.series} ${stop.edition.year}, ${stop.place.city}`}
              aria-pressed={stop.place.id === activePlaceId}
              onClick={() => handleSelectPlace(stop.place.id)}
            />
          );
        })}
      </Fragment>
    );
  })}
</div>
```

(`timelineStops`, `nextUpcomingEditionId`, node CSS, hit targets all stay as-is. The old per-stop `showYear` logic disappears with this block.)

- [ ] **Step 5: CSS** — append after the existing `.journey-year` rules in `app/globals.css`:

```css
.journey-year.is-playing {
  color: var(--journey);
}
```

- [ ] **Step 6: Verify** — `npm run lint`, full `npm test`, `npm run test:pages`. All pristine. (Browser-drive verification is done by the controller after commit.)

- [ ] **Step 7: Commit** — `git add app/components/conference-globe.tsx app/globals.css tests/rendered-html.test.mjs && git commit -m "feat: chapter-based journey playback with many-to-many arc fans"`
