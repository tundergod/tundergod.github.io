# Conference Details Inside Globe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attach conference and location labels to globe markers and display selected conference details inside the circular map.

**Architecture:** `ConferenceGlobe` already owns marker labels and conference/place data, so it will render both compact labels and the selected detail card. `PublicationObservatory` will retain filtering and the external clear control while removing the duplicate selected-conference journey card.

**Tech Stack:** React 19, TypeScript, COBE 2.0.1, CSS, Node test runner, vinext/Vite.

## Global Constraints

- Compact marker labels show `Conference Year` plus `City, Country`.
- The selected detail card stays inside `.globe-frame`.
- Do not render a selected-conference detail card below the globe.
- Preserve conference filtering, same-city stacking, automatic rotation, reduced motion, and the internal fallback overlay.
- Draw no map arcs and add no dependency.

---

### Task 1: Add failing inside-globe information contracts

**Files:**
- Test: `tests/rendered-html.test.mjs`

- [ ] Add a rendered assertion for `DAC 2026 Long Beach, USA`, which fails because current labels omit the country.
- [ ] Extend the source contract to require `.globe-conference-detail` inside `.globe-frame` and reject `Focused location` from `publication-observatory.tsx`.
- [ ] Run `npm run build && node --test tests/rendered-html.test.mjs` and confirm the new assertions fail for the expected missing content.

### Task 2: Move conference information into the globe

**Files:**
- Modify: `app/components/conference-globe.tsx`
- Modify: `app/components/publication-observatory.tsx`
- Modify: `app/globals.css`

- [ ] Render marker and fallback button copy using two spans: conference/year and city/country.
- [ ] Resolve the active edition and render an internal `.globe-conference-detail` with series, year, place, full name, and dates.
- [ ] Remove the selected-conference journey card and its related-publication mapping from `PublicationObservatory`; keep the journal-without-conference card.
- [ ] Style compact two-line labels and a bounded, translucent internal detail card that remains legible on mobile.
- [ ] Run `npm test && npm run lint`; expect all tests, build, and lint to pass.
- [ ] Commit with `git commit -m "feat: show conference details inside globe"`.
