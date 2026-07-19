# Publication–Place Interaction Design

## Goal

Make the publication list and COBE globe behave as one academic record browser while increasing the number of publications visible in one viewport.

## Confirmed COBE Capability

COBE v2 markers with an `id` expose CSS anchors (`--cobe-{id}`) and visibility variables (`--cobe-visible-{id}`). The existing site already uses this native mechanism. Conference labels, hover details, focus states, and click targets remain ordinary DOM elements bound to COBE markers; no globe extension or new dependency is required.

References:

- https://github.com/shuding/cobe#bindable-markers--arcs
- https://cobe.vercel.app/

## Publication Rows

Each publication row is the primary selection control.

- Clicking anywhere on a row selects the publication.
- If the publication has a conference edition, the globe stops ambient rotation and turns to that edition's place.
- If the publication is a journal without a conference edition, the row is selected and the globe continues ambient rotation.
- The separate `Show on map` control is removed.
- A DOI remains a real link that opens in a new tab. Its click handler first selects the publication and performs the same globe interaction as the row, then allows the link's default navigation. It must not call `preventDefault` or suppress publication selection.

Rows use a compact two-line composition:

1. Publication title followed inline by venue, publication type, and DOI tags.
2. Authors followed by zero or more research-area tags.

Research-area labels map as follows:

- `Storage` → `Memory / Storage`
- `Architecture` → `Architecture`
- `Intermittent` → `Embedded`
- `Robotics` → `Robotics`

Multiple research-area tags are allowed and retain data order.

## Place Labels on the Globe

There is one COBE marker and one bound DOM label per place.

- The resting label shows only the city, for example `Long Beach`.
- Hover, keyboard focus, or a mobile tap expands the same label.
- The expanded label lists every conference series and year at the place, for example `DAC'26, DAC'25`.
- The expanded label shows the number of unique publications attached to all editions at the place, for example `3 publications`.
- Publication counts deduplicate by publication ID even when a publication has multiple venue tags.
- The expanded label may include country as secondary context, but the resting label remains city-only.

When several editions share a place, conference tokens are ordered by year descending and then by their existing data order.

## Place Filtering

Clicking a place label applies a place-level filter to the publication list.

- The filter includes publications whose `conferenceEditionId` resolves to any edition at the selected place.
- Different conference series and different years at the same place are included together.
- The existing topic and Journal/Conference filters continue to intersect with the place filter.
- A place selection highlights its globe marker and turns the globe to that place.
- `All conferences` clears the place filter and publication selection, returning the globe to ambient rotation.

Clicking a globe place does not select an arbitrary publication. It filters the list; publication selection occurs only when the reader subsequently chooses a publication.

## Interaction State

The observatory owns four independent pieces of state:

- topic filter;
- publication type filter;
- selected place ID;
- selected publication ID.

The selected publication determines the globe target only when it has a conference place. A selected place takes precedence as the active place filter. Selecting a publication clears the place filter so the full topic/type result set remains visible with the chosen paper highlighted.

## Accessibility and Responsive Behavior

- Publication rows are keyboard-operable buttons or button-equivalent controls.
- DOI links remain independently focusable and open in a new tab.
- Place labels are keyboard-operable and expose their selected state with `aria-pressed`.
- Hover details must also appear on `:focus-visible` and remain available after a touch/click selection.
- Visible focus styling uses the existing signal color.
- On narrow screens, inline tags wrap without forcing horizontal scrolling; expanded place details stay inside the circular globe frame.
- Reduced-motion users receive immediate globe targeting without eased rotation.

## Verification

Model tests must cover:

- place filtering across multiple editions;
- unique publication counts per place;
- research-area label mapping;
- journal publications without a place.

Rendered output tests must cover:

- absence of `Show on map`;
- publication rows as primary controls;
- inline DOI, venue, type, and research-area tags;
- city-only resting labels;
- expandable conference/year and publication-count details.

The final gate is model tests, server-rendered HTML tests, production build, ESLint, and an HTTP 200 local preview check.
