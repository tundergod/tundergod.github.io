# Direct Observatory Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Publication × Journey the first and dominant home-page content.

**Architecture:** Keep the existing `PublicationObservatory` and data model unchanged. Simplify only the page shell and CSS so the interactive component begins directly below the identity header.

**Tech Stack:** React 19, vinext, TypeScript, CSS, Node test runner.

## Global Constraints

- Do not add replacement marketing copy, a hero, a research summary, a section heading, or a decorative legend.
- Preserve all publication and globe interactions.
- Preserve responsive behavior and accessible navigation.

---

### Task 1: Enforce the direct-home content contract

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `PublicationObservatory`
- Produces: a home page whose first content section has class `publications-section`

- [ ] **Step 1: Add failing rendered-HTML assertions**

Assert that `hero`, `research-section`, `The work, mapped in motion`, and the two slogan strings are absent while `publications-section` remains present.

- [ ] **Step 2: Run the existing build and rendered test**

Run `npm run build` followed by `node --test tests/rendered-html.test.mjs`; expect the new absence assertions to fail.

- [ ] **Step 3: Implement the minimal page-shell change**

Remove hero, research, publication heading/legend, and slogan footer JSX. Keep the header, observatory, and compact real profile/contact links.

- [ ] **Step 4: Remove obsolete CSS**

Delete styles used only by the removed blocks. Give `.publications-section` direct-home top spacing and keep existing observatory breakpoints.

- [ ] **Step 5: Verify**

Run `npm test` and `npm run lint`; expect zero failures and zero lint errors.

