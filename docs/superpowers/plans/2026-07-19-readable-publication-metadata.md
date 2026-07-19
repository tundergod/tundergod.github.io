# Readable Publication Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move research-topic tags into each publication title flow and raise the site's metadata, utility, filter, author, and globe-label typography to the approved readable sizes.

**Architecture:** Keep the existing components and visual system, changing only the publication-row DOM order and the relevant typography rules. Extend the current rendered-source tests so layout structure and minimum sizes fail before implementation and remain protected across vinext and GitHub Pages builds.

**Tech Stack:** React 19, TypeScript, CSS, Node.js test runner, vinext, Next.js static export, GitHub Pages

## Global Constraints

- Metadata order is title, venue, type, research topic, then DOI.
- Venue, type, topic, and DOI tags remain at least `14px` at every viewport.
- Authors use `13px` on desktop/tablet and at least `12px` on phones.
- Filter buttons use `14px`; filter-group labels and comparable utility text use at least `12px`.
- Publication years use `14px`; counts use `12px`.
- Globe city labels use `11px`; globe details, cluster counts, and cluster-menu text use `12px`.
- Do not change the current globe collision-group interaction in this pass.
- Preserve publication selection, DOI navigation, filters, responsive layout, reduced motion, vinext, and GitHub Pages builds.

---

### Task 1: Move research topics into the title flow

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/components/publication-observatory.tsx`

**Interfaces:**
- Consumes: `publication.areas` and `researchAreaLabels` in `PublicationRow`.
- Produces: topic tags inside `.publication-title-line`; `.publication-secondary-line` contains only `.publication-authors`.

- [ ] **Step 1: Update the rendered/source contract to require the new order**

Read `publication-observatory.tsx` in `tests/rendered-html.test.mjs`, slice the
`PublicationRow` source from `className="publication-title-line"` to
`className="publication-secondary-line"`, and assert that the slice contains
`publication.areas`, `publication-topic-tag`, and `publication-doi`. Slice the
secondary line through its closing author block and assert that it does not
contain `publication-topic-tags`.

- [ ] **Step 2: Run the focused rendered test and verify RED**

Run: `npm test -- --test-name-pattern="metadata"`

Expected: FAIL because topic tags still live in the secondary line.

- [ ] **Step 3: Move the topic mapping after the type tag and before DOI**

In `PublicationRow`, render each `publication.areas` entry as a
`.publication-topic-tag` immediately after `.publication-type-tag`, then render
the DOI action. Remove `.publication-topic-tags` from the secondary line so it
contains only the author span.

- [ ] **Step 4: Re-run the focused test and verify GREEN**

Run: `node --test --test-name-pattern="metadata" tests/rendered-html.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the metadata flow**

```bash
git add app/components/publication-observatory.tsx tests/rendered-html.test.mjs
git commit -m "feat: move publication topics into title flow"
```

### Task 2: Enforce the readable typography scale

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing publication, filter, utility, globe-label, and responsive selectors.
- Produces: the approved desktop and phone minimum sizes without altering color or interaction semantics.

- [ ] **Step 1: Replace the obsolete small-type assertions with approved sizes**

Add focused CSS assertions for:

```text
.publication-title = 18px desktop and 16px phone
.venue-chip/.publication-type-tag/.publication-topic-tag/.publication-doi = 14px
.publication-authors = 13px desktop and 12px phone
.filter-chip = 14px
.filter-group-label = 12px
.year-rail h3 = 14px
.year-rail span = 12px
.panel-kicker/.browse-conferences-button/.header-role = 12px
.globe-label-city = 11px
.globe-label-editions/.globe-label-count/.globe-label-country = 12px
.globe-cluster-button/.globe-cluster-menu button/.globe-cluster-menu small = 12px
```

- [ ] **Step 2: Run the focused typography test and verify RED**

Run: `node --test --test-name-pattern="typography" tests/rendered-html.test.mjs`

Expected: FAIL on the existing `8px`–`10px` rules.

- [ ] **Step 3: Implement the approved sizes and spacing**

Update only the listed selectors. Increase tag minimum height and padding to
match `14px` text, keep title-flow tags inline-flex with natural wrapping, and
remove the phone rule that shrinks the year below `14px`. Allow phone authors
to wrap at `12px`.

- [ ] **Step 4: Re-run typography and full tests**

Run:

```bash
node --test --test-name-pattern="typography" tests/rendered-html.test.mjs
npm run lint
npm test
npm run test:pages
```

Expected: all commands pass.

- [ ] **Step 5: Commit the typography scale**

```bash
git add app/globals.css tests/rendered-html.test.mjs
git commit -m "style: enlarge academic metadata and globe labels"
```

### Task 3: Visual QA, merge, and publish

**Files:**
- No additional source files unless visual QA exposes a verified regression.

**Interfaces:**
- Consumes: the production static build and existing browser interactions.
- Produces: verified desktop, tablet, and phone layouts deployed to `https://tundergod.github.io/`.

- [ ] **Step 1: Run the complete release gate**

Run: `npm run lint && npm test && npm run test:pages && git diff --check`

Expected: all automated checks pass.

- [ ] **Step 2: Inspect three responsive viewports**

Verify `1440x900`, `1024x768`, and `390x844` for title/tag wrapping, author
wrapping, filter readability, globe-label readability, focus visibility, and
absence of horizontal document overflow.

- [ ] **Step 3: Verify representative interactions**

Select a publication, open a DOI, activate a topic filter, focus a globe place,
and select a place filter. The existing cluster behavior is observed but not
redesigned in this task.

- [ ] **Step 4: Merge the verified feature branch to `main`**

Fast-forward the isolated branch into `main`, re-run `npm run lint`, `npm test`,
and `npm run test:pages`, then remove the owned worktree and feature branch.

- [ ] **Step 5: Push and verify GitHub Pages**

Push `main`, wait for the `Deploy GitHub Pages` workflow, then verify the live
HTML and public URL `https://tundergod.github.io/`.

