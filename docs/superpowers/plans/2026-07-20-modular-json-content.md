# Modular JSON Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all website-specific personal and portfolio content into validated modular JSON files so routine updates never require React or TypeScript logic changes.

**Architecture:** Introduce a pure validation module whose small interface converts raw JSON-shaped values into `PortfolioData`. A static-import adapter serves the Next/vinext application, while a filesystem adapter serves the CLI and Node tests; both adapters cross the same validation seam. Server page/layout code passes the validated portfolio to the interactive observatory, and all filters, author emphasis, globe relationships, links, and metadata derive from that value.

**Tech Stack:** TypeScript 5.9, JSON modules, Node.js 22 built-in test runner, React 19, Next.js 16 static export, vinext/Vite 8, GitHub Pages

## Global Constraints

- JSON is the canonical website-content format; do not add a BibTeX parser or exporter.
- Do not modify or synchronize `../tundergod-cv/main.tex`.
- Add no schema-validation dependency; use repository TypeScript and Node built-ins.
- Preserve exactly 15 publications, 8 conference editions, and 8 locations.
- Preserve GraphISC as one journal record with `TCAD` and `CASES / EMSOFT / CODES` tags linked to `esweek-2026`.
- Preserve WinHD as a `CASES` conference publication linked to `esweek-2026`.
- Preserve the current visuals, responsive layout, filters, DOI behavior, publication–globe selection, and existing cluster interaction.
- Publication array order remains display order; years must be non-increasing.
- `content:validate` must run before development and both production builds.
- The final verified result is merged to `main` and deployed to `https://tundergod.github.io/`.

---

## File structure

**Create:**

- `content/bio.json` — identity, affiliation, biography, location, and SEO copy.
- `content/links.json` — ordered header/footer profile destinations.
- `content/publications.json` — ordered publication records.
- `content/conferences.json` — conference-edition records.
- `content/locations.json` — globe places and coordinates.
- `content/research-topics.json` — filter/topic IDs and labels.
- `content/travel.json` — travel placeholder and future journeys.
- `content/README.md` — editing instructions and copy-ready templates.
- `public/travel/.gitkeep` — reserved travel-image directory.
- `app/data/portfolio-schema.ts` — types plus the pure `validatePortfolioData(raw)` interface.
- `app/data/portfolio-content.ts` — static JSON adapter used by the application.
- `scripts/load-content.ts` — filesystem adapter used by Node and tests.
- `scripts/validate-content.ts` — zero-argument CLI entrypoint.
- `tests/content-validation.test.mjs` — isolated validator failures.
- `tests/content-migration.test.mjs` — migrated-record parity and relationship tests.
- `tests/content-boundary.test.mjs` — guards against personal content returning to behavior files.

**Modify:**

- `package.json` — add `content:validate` and pre-build validation chains.
- `app/lib/conference-model.ts` — consume schema types and dynamic topic IDs.
- `app/components/conference-globe.tsx` — consume schema types.
- `app/components/publication-observatory.tsx` — receive `PortfolioData`, generate topic filters, render author arrays, and use travel content.
- `app/page.tsx` — render profile data and pass `PortfolioData` into the observatory.
- `app/layout.tsx` — derive metadata from `bio.json` through the content module.
- `tests/conference-model.test.mjs` — load migrated content through the filesystem adapter.
- `tests/rendered-html.test.mjs` — protect data-driven rendering and removal of hard-coded content.
- `README.md` — point maintainers to the modular content workflow.

**Delete:**

- `app/data/portfolio.ts` — remove the hard-coded portfolio implementation after all consumers migrate.

---

### Task 1: Define and test the content validation seam

**Files:**
- Create: `app/data/portfolio-schema.ts`
- Create: `tests/content-validation.test.mjs`

**Interfaces:**
- Consumes: one raw object with `bio`, `links`, `publications`, `conferences`, `locations`, `researchTopics`, and `travel` properties.
- Produces: `validatePortfolioData(raw: unknown): PortfolioData`; throws `ContentValidationError` with file/domain, record ID, and field context.

- [ ] **Step 1: Write a valid fixture and failing validator tests**

Create `tests/content-validation.test.mjs` with a minimal complete fixture and focused mutations:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  ContentValidationError,
  validatePortfolioData,
} from "../app/data/portfolio-schema.ts";

function validContent() {
  return {
    bio: {
      name: "Wen Sheng Lim",
      monogram: "WS",
      role: "PhD candidate",
      affiliation: "National Taiwan University (NTU)",
      affiliationCountry: "Taiwan",
      location: "Taipei, Taiwan",
      biography: "Profile copy.",
      seoTitle: "Wen Sheng Lim — Computer Systems Research",
      seoDescription: "Research profile.",
    },
    links: [{ id: "header-scholar", label: "Scholar", url: "https://example.com", placement: "header" }],
    publications: [{
      id: "paper-2026",
      title: "A Paper",
      authors: ["Wen Sheng Lim", "Co Author"],
      year: 2026,
      type: "conference",
      venueTags: ["TEST"],
      venueLong: "Test Conference",
      doi: "10.1000/test",
      topics: ["systems"],
      conferenceEditionId: "test-2026",
    }],
    conferences: [{ id: "test-2026", series: "TEST", name: "Test Conference", year: 2026, dates: "Jan. 1–2, 2026", placeId: "test-city" }],
    locations: [{ id: "test-city", city: "Test City", country: "Testland", latitude: 1, longitude: 2 }],
    researchTopics: [{ id: "systems", label: "Systems", description: "Systems research." }],
    travel: { placeholder: { title: "Travel field notes", body: "Photos later." }, journeys: [] },
  };
}

test("accepts a complete related content graph", () => {
  assert.deepEqual(validatePortfolioData(validContent()), validContent());
});

test("rejects unknown publication fields", () => {
  const raw = validContent();
  raw.publications[0].accepted = true;
  assert.throws(() => validatePortfolioData(raw), /publication "paper-2026".*unknown field "accepted"/s);
});

test("rejects missing topic and conference references", () => {
  const raw = validContent();
  raw.publications[0].topics = ["missing-topic"];
  raw.publications[0].conferenceEditionId = "missing-2026";
  assert.throws(() => validatePortfolioData(raw), /unknown topic "missing-topic"/);
});

test("rejects duplicate IDs, malformed DOIs, and invalid coordinates", () => {
  const duplicate = validContent();
  duplicate.locations.push({ ...duplicate.locations[0] });
  assert.throws(() => validatePortfolioData(duplicate), /duplicate location id "test-city"/);

  const badDoi = validContent();
  badDoi.publications[0].doi = "https://doi.org/10.1000/test";
  assert.throws(() => validatePortfolioData(badDoi), /bare DOI/);

  const badCoordinate = validContent();
  badCoordinate.locations[0].latitude = 91;
  assert.throws(() => validatePortfolioData(badCoordinate), /latitude/);
});

test("rejects increasing publication years and an omitted profile author", () => {
  const order = validContent();
  order.publications.push({ ...order.publications[0], id: "paper-2027", year: 2027 });
  assert.throws(() => validatePortfolioData(order), /non-increasing year order/);

  const author = validContent();
  author.publications[0].authors = ["Someone Else"];
  assert.throws(() => validatePortfolioData(author), /must include "Wen Sheng Lim" exactly once/);
});

test("exposes validation errors as ContentValidationError", () => {
  assert.throws(
    () => validatePortfolioData(null),
    (error) => error instanceof ContentValidationError,
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --experimental-strip-types --test tests/content-validation.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `app/data/portfolio-schema.ts`.

- [ ] **Step 3: Implement the typed schema and strict validator**

Create `app/data/portfolio-schema.ts` with these exported types and interface:

```ts
export type ProfileLink = { id: string; label: string; url: string; placement: "header" | "footer" };
export type Bio = {
  name: string;
  monogram: string;
  role: string;
  affiliation: string;
  affiliationCountry: string;
  location: string;
  biography: string;
  seoTitle: string;
  seoDescription: string;
};
export type Publication = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  type: "journal" | "conference";
  venueTags: string[];
  venueLong: string;
  doi: string | null;
  topics: string[];
  conferenceEditionId: string | null;
};
export type ConferenceEdition = { id: string; series: string; name: string; year: number; dates: string; placeId: string };
export type Location = { id: string; city: string; region?: string; country: string; latitude: number; longitude: number };
export type ResearchTopic = { id: string; label: string; description?: string };
export type JourneyImage = { src: string; alt: string; caption?: string };
export type Journey = { id: string; conferenceEditionId: string; publicationIds?: string[]; images: JourneyImage[] };
export type TravelContent = { placeholder: { title: string; body: string }; journeys: Journey[] };
export type PortfolioData = {
  bio: Bio;
  links: ProfileLink[];
  publications: Publication[];
  conferences: ConferenceEdition[];
  locations: Location[];
  researchTopics: ResearchTopic[];
  travel: TravelContent;
};

export class ContentValidationError extends Error {
  override name = "ContentValidationError";
}

export function validatePortfolioData(raw: unknown): PortfolioData {
  const problems: string[] = [];
  const root = isRecord(raw) ? raw : {};

  if (!isRecord(raw)) problems.push("content: expected an object");
  assertExactKeys(root, [
    "bio", "links", "publications", "conferences", "locations",
    "researchTopics", "travel",
  ], "content", problems);

  const bio = validateBio(root.bio, problems);
  const links = validateLinks(root.links, problems);
  const publications = validatePublications(root.publications, problems);
  const conferences = validateConferences(root.conferences, problems);
  const locations = validateLocations(root.locations, problems);
  const researchTopics = validateResearchTopics(root.researchTopics, problems);
  const travel = validateTravel(root.travel, problems);

  validateRelationships({
    bio,
    links,
    publications,
    conferences,
    locations,
    researchTopics,
    travel,
  }, problems);

  if (problems.length > 0) {
    throw new ContentValidationError(problems.join("\n"));
  }

  return {
    bio,
    links,
    publications,
    conferences,
    locations,
    researchTopics,
    travel,
  };
}
```

Implement the internal functions referenced above in the same file. The record
validators return safe empty values after recording structural errors so
relationship validation can continue. Use helpers named `isRecord`,
`assertExactKeys`, `assertString`, `assertOptionalString`, `assertArray`,
`assertUniqueIds`, and `formatRecordPath`. Apply the exact field lists from the
exported types; validate DOI form with `/^10\.\d{4,9}\/\S+$/i`, latitude within
`[-90, 90]`, longitude within `[-180, 180]`, links with `new URL()` plus the
allowed-protocol set, travel image paths beginning `/travel/`, profile-author
occurrence, all foreign keys, and non-increasing publication years. Unknown
fields must be rejected rather than ignored. Collect all errors in input order
so one edit cycle reports every discoverable issue.

- [ ] **Step 4: Re-run validator tests and verify GREEN**

Run:

```bash
node --experimental-strip-types --test tests/content-validation.test.mjs
```

Expected: 6 tests pass, 0 fail.

- [ ] **Step 5: Commit the validation seam**

```bash
git add app/data/portfolio-schema.ts tests/content-validation.test.mjs
git commit -m "feat: validate modular portfolio content"
```

### Task 2: Extract current content and add filesystem/static adapters

**Files:**
- Create: `content/bio.json`
- Create: `content/links.json`
- Create: `content/publications.json`
- Create: `content/conferences.json`
- Create: `content/locations.json`
- Create: `content/research-topics.json`
- Create: `content/travel.json`
- Create: `public/travel/.gitkeep`
- Create: `app/data/portfolio-content.ts`
- Create: `scripts/load-content.ts`
- Create: `scripts/validate-content.ts`
- Create: `tests/content-migration.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `validatePortfolioData(raw)` from Task 1 and current hard-coded data from `app/data/portfolio.ts`, `app/page.tsx`, and `app/layout.tsx`.
- Produces: `portfolioData: PortfolioData`, `loadContent(contentDirectory?): Promise<PortfolioData>`, and `npm run content:validate`.

- [ ] **Step 1: Write the migration-parity test before creating content**

Create `tests/content-migration.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { loadContent } from "../scripts/load-content.ts";

const data = await loadContent();

test("migrates the complete current portfolio", () => {
  assert.equal(data.publications.length, 15);
  assert.equal(data.conferences.length, 8);
  assert.equal(data.locations.length, 8);
  assert.deepEqual(data.researchTopics.map(({ id }) => id), [
    "memory-storage", "architecture", "embedded", "robotics",
  ]);
});

test("preserves publication ordering and exact DOI ownership", () => {
  assert.deepEqual(data.publications.slice(0, 4).map(({ id }) => id), [
    "graphisc-tcad-2026",
    "timing-composable-tecs-2026",
    "progress-gambit-iccad-2026",
    "winhd-cases-2026",
  ]);
  assert.equal(
    data.publications.find(({ id }) => id === "isafe-tcad-2025")?.doi,
    "10.1109/TCAD.2024.3522211",
  );
});

test("preserves GraphISC and WinHD shared-edition semantics", () => {
  const graphisc = data.publications.find(({ id }) => id === "graphisc-tcad-2026");
  const winhd = data.publications.find(({ id }) => id === "winhd-cases-2026");
  assert.deepEqual(graphisc?.venueTags, ["TCAD", "CASES / EMSOFT / CODES"]);
  assert.equal(graphisc?.type, "journal");
  assert.equal(graphisc?.conferenceEditionId, "esweek-2026");
  assert.deepEqual(winhd?.venueTags, ["CASES"]);
  assert.equal(winhd?.conferenceEditionId, "esweek-2026");
});

test("preserves reusable edition and place relationships", () => {
  const dacPapers = data.publications.filter(({ conferenceEditionId }) => conferenceEditionId === "dac-2026");
  assert.deepEqual(dacPapers.map(({ id }) => id), ["rememtier-dac-2026", "flashhd-dac-2026"]);
  assert.equal(data.conferences.find(({ id }) => id === "dac-2026")?.placeId, "long-beach");
  assert.equal(data.locations.find(({ id }) => id === "long-beach")?.city, "Long Beach");
});
```

- [ ] **Step 2: Run the parity test and verify RED**

Run:

```bash
node --experimental-strip-types --test tests/content-migration.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/load-content.ts`.

- [ ] **Step 3: Populate the seven JSON files from current approved content**

Use the exact current record IDs:

```text
Publications (15):
graphisc-tcad-2026, timing-composable-tecs-2026,
progress-gambit-iccad-2026, winhd-cases-2026, rememtier-dac-2026,
flashhd-dac-2026, star-date-2026, volunteer-computing-sac-2026,
recross-sac-2026, sara-aspdac-2026, isafe-tcad-2025,
flash-survey-tos-2025, train-iccad-2023, data-freshness-date-2023,
icheck-tcad-2021

Conference editions (8):
iccad-2026, esweek-2026, dac-2026, date-2026, sac-2026,
aspdac-2026, iccad-2023, date-2023

Locations (8):
san-jose, barcelona, long-beach, verona, thessaloniki, hong-kong,
san-francisco, antwerp
```

Convert current `authors` strings into ordered arrays without changing spelling
or order. Replace topic IDs as follows:

```text
Storage      -> memory-storage
Architecture -> architecture
Intermittent -> embedded
Robotics     -> robotics
```

Every publication receives an explicit `venueTags` array, bare DOI or `null`,
topics array, and conference-edition ID or `null`. Do not migrate the unused
`status` field. Populate `bio.json`, `links.json`, and `travel.json` with the
exact currently rendered copy and destinations.

- [ ] **Step 4: Implement both adapters and the CLI**

Create `scripts/load-content.ts` to read exactly these filenames with
`readFile`, `JSON.parse` each file with a filename-specific parse error, and
call `validatePortfolioData`:

```ts
export async function loadContent(
  contentDirectory = new URL("../content/", import.meta.url),
): Promise<PortfolioData>;
```

Create `scripts/validate-content.ts`:

```ts
import { loadContent } from "./load-content.ts";

try {
  const data = await loadContent();
  console.log(
    `Content valid: ${data.publications.length} publications, ` +
      `${data.conferences.length} conference editions, ` +
      `${data.locations.length} locations.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
```

Create `app/data/portfolio-content.ts` with static JSON imports for all seven
files, validate once, and export only `portfolioData` plus schema type exports:

```ts
export const portfolioData = validatePortfolioData({
  bio,
  links,
  publications,
  conferences,
  locations,
  researchTopics,
  travel,
});
```

- [ ] **Step 5: Wire validation into package scripts**

Add:

```json
"content:validate": "node --experimental-strip-types scripts/validate-content.ts"
```

Prefix `dev`, `build`, and `build:pages` with
`npm run content:validate &&`. Add both new test files to `test:model`.

- [ ] **Step 6: Run content validation and parity tests**

Run:

```bash
npm run content:validate
node --experimental-strip-types --test tests/content-validation.test.mjs tests/content-migration.test.mjs
```

Expected: validation reports `15 publications, 8 conference editions, 8 locations`; 10 tests pass, 0 fail.

- [ ] **Step 7: Commit the extracted content graph**

```bash
git add content public/travel app/data/portfolio-content.ts scripts package.json package-lock.json tests/content-migration.test.mjs
git commit -m "feat: extract portfolio into modular JSON content"
```

### Task 3: Migrate publication, filter, and globe behavior to `PortfolioData`

**Files:**
- Modify: `app/lib/conference-model.ts`
- Modify: `app/components/conference-globe.tsx`
- Modify: `app/components/publication-observatory.tsx`
- Modify: `app/page.tsx`
- Modify: `tests/conference-model.test.mjs`
- Modify: `tests/rendered-html.test.mjs`
- Delete: `app/data/portfolio.ts`

**Interfaces:**
- Consumes: `PortfolioData`, `Publication`, `ConferenceEdition`, and `Location` from the Task 1 schema; `portfolioData` from Task 2.
- Produces: `<PublicationObservatory data={portfolioData} />`; topic filtering uses string topic IDs; author rendering uses `string[]` and `data.bio.name`.

- [ ] **Step 1: Update behavior tests to require data-driven consumers**

Change `tests/conference-model.test.mjs` to load content once:

```js
import { loadContent } from "../scripts/load-content.ts";
const {
  conferences: conferenceEditions,
  locations: places,
  publications,
  researchTopics,
} = await loadContent();
```

Replace old topic values with `memory-storage`, `architecture`, `embedded`, and
`robotics`. Assert the exact label map derived from `researchTopics`.

Add source assertions to `tests/rendered-html.test.mjs`:

```js
assert.match(observatorySource, /function PublicationObservatory\(\{ data \}/);
assert.match(observatorySource, /data\.researchTopics\.map/);
assert.match(observatorySource, /highlightedAuthor=\{data\.bio\.name\}/);
assert.doesNotMatch(observatorySource, /Wen Sheng Lim|topicFilters\s*=/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --experimental-strip-types --test tests/conference-model.test.mjs
npm test -- --test-name-pattern="data-driven"
```

Expected: model tests fail on old topic IDs/shapes; rendered source assertion
fails because the observatory has no `data` prop.

- [ ] **Step 3: Migrate model types and topic filtering**

In `conference-model.ts`, import schema types from
`../data/portfolio-schema.ts`. Replace `ResearchArea` with `string` in the
filter interface and compare against `publication.topics`:

```ts
export type PublicationTypeFilter = "All" | Publication["type"];

export function filterPublications(
  allPublications: Publication[],
  filters: {
    topic: "All" | string;
    editionId?: string;
    editionIds?: string[];
    type: PublicationTypeFilter;
  },
) {
  return allPublications.filter(
    (publication) =>
      (filters.topic === "All" || publication.topics.includes(filters.topic)) &&
      (!filters.editionId || publication.conferenceEditionId === filters.editionId) &&
      (!filters.editionIds ||
        (!!publication.conferenceEditionId && filters.editionIds.includes(publication.conferenceEditionId))) &&
      (filters.type === "All" || publication.type === filters.type),
  );
}
```

Rename place types to `Location` internally or alias `Location as Place` only
inside the globe/model files; JSON and schema vocabulary remains `locations`.

- [ ] **Step 4: Make the observatory entirely data-driven**

Change the exported signature:

```ts
export function PublicationObservatory({ data }: { data: PortfolioData })
```

Derive topic filters inside the module:

```ts
const topicFilters = [
  { value: "All", label: "All" },
  ...data.researchTopics.map(({ id, label }) => ({ value: id, label })),
];
```

Use `data.publications`, `data.conferences`, and `data.locations` throughout.
Replace `areas` with `topics`, look up labels from a memoized map, use required
`venueTags` directly, and render the travel placeholder from
`data.travel.placeholder`.

Replace string splitting with an ordered-array author renderer:

```tsx
function AuthorLine({ authors, highlightedAuthor }: {
  authors: string[];
  highlightedAuthor: string;
}) {
  return (
    <span>
      {authors.map((author, index) => {
        const separator = index === 0
          ? ""
          : index === authors.length - 1
            ? authors.length === 2 ? " and " : ", and "
            : ", ";
        return (
          <span key={author}>
            {separator}
            {author === highlightedAuthor ? <strong>{author}</strong> : author}
          </span>
        );
      })}
    </span>
  );
}
```

Pass `highlightedAuthor={data.bio.name}` to every `AuthorLine`, including the
focus card.

- [ ] **Step 5: Migrate the globe and page entrypoint, then remove hard-coded data**

Update `conference-globe.tsx` to import schema types. In `page.tsx`, import the
validated adapter and pass it into the observatory:

```tsx
import { portfolioData } from "./data/portfolio-content";

<PublicationObservatory data={portfolioData} />
```

Delete `app/data/portfolio.ts` after `rg 'data/portfolio' app tests` shows no
remaining consumer.

- [ ] **Step 6: Run model, rendering, and build tests**

Run:

```bash
npm run lint
npm test
```

Expected: all model, validation, migration, rendering, and vinext build tests
pass; rendered author punctuation and tags match the existing page.

- [ ] **Step 7: Commit the behavior migration**

```bash
git add app tests/conference-model.test.mjs tests/rendered-html.test.mjs
git commit -m "refactor: drive publication observatory from JSON content"
```

### Task 4: Migrate identity, links, footer, and SEO metadata

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Create: `tests/content-boundary.test.mjs`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `portfolioData.bio`, `portfolioData.links`, and `portfolioData.travel`.
- Produces: identical rendered identity/profile metadata with no personal content literals in React behavior files.

- [ ] **Step 1: Write the content-boundary failure test**

Create `tests/content-boundary.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const behaviorFiles = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/components/publication-observatory.tsx",
];

test("keeps personal and portfolio content outside behavior files", async () => {
  for (const file of behaviorFiles) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /Wen Sheng Lim|tundergod1882|y_7M9psAAAAJ|0000-0002-2391-8127/);
    assert.doesNotMatch(source, /Memory \/ Storage|CASES \/ EMSOFT \/ CODES|Long Beach/);
  }
});
```

Add this test to `test:model`.

- [ ] **Step 2: Run the boundary test and verify RED**

Run:

```bash
node --test tests/content-boundary.test.mjs
```

Expected: FAIL on `page.tsx`, `layout.tsx`, and the observatory's remaining
personal literals.

- [ ] **Step 3: Render page identity and links from content**

In `page.tsx`, derive:

```ts
const { bio, links } = portfolioData;
const headerLinks = links.filter(({ placement }) => placement === "header");
const footerLinks = links.filter(({ placement }) => placement === "footer");
const headerRole = `${bio.role} · ${bio.affiliation}, ${bio.affiliationCountry}`;
```

Use `bio.monogram`, `bio.name`, `headerRole`, `bio.biography`, and
`${bio.name} · ${bio.location}`. Map `headerLinks` and `footerLinks` without
special-casing IDs or URLs.

- [ ] **Step 4: Derive Next metadata from `bio.json`**

In `layout.tsx`:

```ts
import { portfolioData } from "./data/portfolio-content";

export const metadata: Metadata = {
  title: portfolioData.bio.seoTitle,
  description: portfolioData.bio.seoDescription,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
```

- [ ] **Step 5: Update rendered assertions and verify GREEN**

Keep the exact current HTML assertions for title, biography, role, links,
GraphISC, filters, and globe labels. Add source assertions that page/layout
import `portfolioData` and contain no personal literals.

Run:

```bash
npm run lint
npm test
npm run test:pages
```

Expected: all commands pass and both production artifacts contain the same
reader-facing profile.

- [ ] **Step 6: Commit the identity migration**

```bash
git add app/page.tsx app/layout.tsx tests/content-boundary.test.mjs tests/rendered-html.test.mjs package.json
git commit -m "refactor: load profile identity and metadata from JSON"
```

### Task 5: Document the content workflow and complete release verification

**Files:**
- Create: `content/README.md`
- Modify: `README.md`
- Modify: `tests/rendered-html.test.mjs` only if browser QA exposes a verified regression.
- Modify: implementation files only when a failing test or browser observation proves a regression.

**Interfaces:**
- Consumes: the completed content module and public site workflow.
- Produces: copy-ready editing documentation, verified local artifacts, and the deployed public site.

- [ ] **Step 1: Write the content editing guide**

Document these exact workflows in `content/README.md`:

1. Add a publication at the intended display position in `publications.json`.
2. Use an existing topic, conference-edition, and location ID when possible.
3. For a new conference edition, add one `conferences.json` record; add a
   `locations.json` record only if the place does not already exist.
4. Use `null` for missing DOI and conference edition.
5. Copy authors as an ordered JSON array and include the exact `bio.json` name.
6. Run `npm run content:validate` before committing.
7. Treat stable IDs as permanent.

Include complete copy-ready JSON examples for each of the seven content files,
using the representative values from the approved spec rather than ellipses or
comments (JSON does not support comments).

- [ ] **Step 2: Update the root README content map**

Replace the old instruction to update `app/data/portfolio.ts` with:

```text
- `content/`: canonical website content and editing guide.
- `app/data/portfolio-schema.ts`: schema types and validation.
- `app/data/portfolio-content.ts`: application content adapter.
- `app/lib/conference-model.ts`: relationship lookups and globe coordinates.
```

State that the CV remains independently canonical and is not synchronized.

- [ ] **Step 3: Run the complete automated release gate**

Run:

```bash
npm run content:validate
npm run lint
npm test
npm run test:pages
git diff --check
```

Expected: validation reports 15/8/8; all tests and both builds pass; no diff
whitespace errors.

- [ ] **Step 4: Perform responsive and interaction QA**

At `1440x900`, `1024x768`, and `390x844`, verify:

- no horizontal document overflow;
- title/tag/author typography and wrapping are unchanged;
- all 15 publications render in the correct order;
- topic/type filters still intersect;
- selecting a publication rotates/focuses the related place;
- selecting a visible place filters publications;
- DOI selection still selects the publication and opens its DOI destination;
- conference labels and focus cards still show migrated content; and
- header, biography, links, footer, and SEO title match the approved page.

- [ ] **Step 5: Commit documentation and any verified regression fixes**

```bash
git add content/README.md README.md
git commit -m "docs: explain modular website content updates"
```

- [ ] **Step 6: Merge, push, and verify GitHub Pages**

Fast-forward the verified feature branch into `main`, rerun the complete
automated release gate on merged `main`, remove the owned worktree and branch,
push `main`, wait for `Deploy GitHub Pages`, and verify
`https://tundergod.github.io/` reports the migrated content and computed layout
without horizontal overflow.
