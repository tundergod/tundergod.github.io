# Bio and DOI Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a factual bio, correct WinHD, and expose DOI and map actions without hosting copyrighted PDFs.

**Architecture:** Extend publication data with an optional DOI, keep map selection state in `PublicationObservatory`, and replace the row-level button with an article containing explicit controls. The page component owns the compact bio.

**Tech Stack:** React 19, TypeScript, CSS, Node test runner, vinext/Vite.

## Global Constraints

- Do not add an accepted/publication disclaimer.
- Do not invent DOI values or add direct publisher PDF URLs.
- WinHD is a CASES conference paper mapped to the Barcelona joint event.
- Preserve topic/type/conference filter intersections and globe behavior.
- Add no dependency.

---

### Task 1: Publication metadata

**Files:** `app/data/portfolio.ts`, `tests/conference-model.test.mjs`

- [ ] Add failing tests for WinHD as CASES/conference and the ten exact DOI values.
- [ ] Run `npm run test:model` and confirm failure.
- [ ] Add optional `doi` data and correct WinHD.
- [ ] Run `npm run test:model` and confirm success.

### Task 2: Bio and explicit publication actions

**Files:** `app/page.tsx`, `app/components/publication-observatory.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs`

- [ ] Add failing rendered assertions for the bio, DOI resolver links, `Show on map`, and absence of `publication-row` buttons.
- [ ] Run build plus rendered tests and confirm failure.
- [ ] Add the compact bio and hidden `h1`.
- [ ] Convert rows to articles with DOI and map controls; remove the ambiguous arrow.
- [ ] Style bio and actions for desktop/mobile, keyboard focus, and selected state.
- [ ] Run `npm test && npm run lint` and confirm success.
- [ ] Commit with `git commit -m "feat: add bio and publication links"`.
