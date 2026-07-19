# Clickable Conference Globe — Design Specification

## Goal

Make the globe useful before a publication or conference is selected. In its default state it rotates automatically, reveals conference labels on visible locations, and lets visitors select a conference directly from the globe.

## Interaction States

### Browse mode

- This is the initial state: no publication or conference is selected.
- The globe rotates slowly and continuously unless reduced motion is enabled.
- Each conference label is anchored to its location marker and fades in when that marker rotates onto the visible side of the globe.
- Each visible label is a keyboard- and pointer-accessible button.
- A location hosting multiple conference editions shows a stack of separate buttons. Editions are never merged merely because they share coordinates.

### Conference focus mode

- Clicking a conference label selects that conference edition.
- The globe smoothly rotates to the conference location and stops autonomous rotation.
- The existing journey card shows the conference name, city, date, and all publications linked to that edition.
- The first linked publication becomes the selected publication so the publication list and journey card stay synchronized.
- An `All conferences` control returns to browse mode.

### Publication selection

- Clicking a publication with a conference edition enters conference focus mode.
- Clicking a journal without a conference edition leaves the globe in browse mode while showing the journal-only context.

## Component Boundary

- `PublicationObservatory` owns the selected publication/conference state and maps a clicked edition to its first related publication.
- `ConferenceGlobe` owns COBE rendering, rotation, geographic focus animation, and anchored conference-label buttons.
- Conference and place relationships continue to come from `portfolio.ts`; marker labels use the visible `ConferenceEdition.series` value.

## Label Behavior

- Markers receive stable place IDs so COBE exposes CSS anchor and visibility variables.
- Labels are grouped by place and positioned with CSS Anchor Positioning.
- Visibility, opacity, scale, and stacking order follow COBE's front-facing visibility variable.
- Labels render only in browse mode. Focus mode uses the existing journey card instead.
- When CSS Anchor Positioning is unavailable, the labels remain available as a compact conference index below the globe rather than becoming unusable.

## Accessibility and Motion

- Conference buttons contain both series and year, for example `ICCAD 2026`.
- Focus indicators remain visible against the dark globe.
- `prefers-reduced-motion: reduce` disables autonomous rotation and uses immediate focus transitions; conference buttons remain usable.

## Acceptance Criteria

- The server-rendered initial state contains conference buttons and no focused-location card.
- The idle globe rotates when reduced motion is not requested.
- Clicking a conference label focuses the correct place and shows every publication for that edition.
- `All conferences` restores idle rotation and the label layer.
- Multiple conference editions at the same place render as separate buttons.
- Publication filtering, multi-venue labels, responsive layout, build, lint, and existing relationship tests continue to pass.
