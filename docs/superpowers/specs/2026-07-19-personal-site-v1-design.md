# Personal Website V1 — Design Specification

## Goal

Build a dark, responsive academic profile that immediately shows Wen Sheng Lim's computer-systems research and complete publication record. A lightweight COBE globe connects publications to the conference editions and places where the work was presented, so the academic record and travel history feel like one system rather than separate pages.

## Experience

- The opening viewport names the researcher, states the broad computer-systems focus, and offers direct routes to publications and contact profiles.
- The main experience is a "Split Observatory": a complete publication list on the left and a sticky rotating globe with context on the right.
- Selecting a conference publication focuses the globe on that edition's city and updates the context card with the conference, date, location, and all papers tied to that edition.
- Journal papers remain selectable but do not invent a geographic relationship; the context card explains that no conference location is attached.
- Research-area chips are an auxiliary filter. "All" is the default and no work is hidden on first load.
- A future travel-photo area is represented by an honest empty state, not fabricated images or upload behavior.

## Information Architecture

1. Compact navigation: name, Research, Publications, Journey, CV/contact links.
2. Hero: identity, broad research statement, status, primary profile links, and a small publication/conference summary.
3. Research lenses: memory and storage systems, computer architecture, intermittent computing, robotics.
4. Publication Observatory: full publication list plus interactive COBE globe and conference context.
5. Contact footer.

## Data Model

- `Publication` has a stable ID, title, venue, year, type, authors, research areas, and optional `conferenceEditionId`.
- `ConferenceEdition` is one series in one year, with dates and one `placeId`. It may relate to multiple publications.
- `Place` owns city, country, latitude, and longitude. It may relate to multiple conference editions, including different series and years.

This supports repeated attendance at the same series, several conferences in the same city, and several papers at one edition without duplicating place data.

## Visual System

- Palette: Void `#07090c`, Carbon `#11161d`, Steel `#2a3642`, Ice `#e8eef6`, Signal Blue `#7cc7ff`, Journey Coral `#ff8a74`.
- Typography: restrained sans-serif for reading and compact monospace labels for years, venues, and metadata.
- Signature element: a dotted COBE globe in a circular observation frame, with blue research markers and coral travel/focus accents.
- Motion: slow autonomous rotation, smooth focus transitions, and reduced-motion support.
- Desktop: approximately 60/40 list/globe split with sticky globe.
- Tablet: balanced split with reduced globe size.
- Mobile: single-column list followed by an in-flow compact globe/context panel; no fixed overlay blocking content.

## Content Rules

- Use the CV as the canonical source and list all 16 publications.
- Do not label any subset as "Selected Publications".
- Do not invent paper links, DOI links, photos, awards, or claims that are absent from the CV.
- Use a neutral research sentence: "I work on computer systems, with interests spanning memory and storage systems, computer architecture, intermittent computing, and robotics."

## Acceptance Criteria

- All CV publications render, grouped by year, with journal/conference distinctions.
- Selecting a mapped publication changes the selected conference edition and globe target.
- Multiple papers at CASES 2026, DAC 2026, and SAC 2026 are shown together in their edition context.
- Shared-place and repeated-edition relations are represented through IDs rather than one-to-one assumptions.
- Layout remains readable on desktop, tablet, and mobile; interactive controls are keyboard accessible.
- Reduced-motion users receive a stable globe with no autonomous rotation.
- Production build, data-model tests, rendered-HTML test, and lint pass.

