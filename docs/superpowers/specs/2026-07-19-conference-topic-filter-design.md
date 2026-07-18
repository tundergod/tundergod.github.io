# Conference Topic Filter Design

## Goal

Turn the globe into a conference filter and a compact map of how each research topic has appeared across conference locations. The publication list remains the primary content; the globe provides filtering and context rather than a separate navigation system.

## Filter Model

The publication list has three independent filters whose results are intersected:

1. Research topic: `All`, `Memory / Storage`, `Architecture`, `Embedded`, or `Robotics`.
2. Conference edition: all conferences or one selected edition from the globe.
3. Publication type: `All`, `Journal`, or `Conference`.

Changing one filter preserves the other two. `All conferences` clears only the conference filter. Empty intersections show a short empty-state message and keep all filter controls available.

The display labels change without changing the underlying data identifiers:

- `Storage` becomes `Memory / Storage`.
- `Intermittent` becomes `Embedded`.

## Globe Behavior

### Default State

With no conference selected, the COBE globe rotates automatically. Every conference edition appears as a clickable label beside its location marker. Editions sharing a city remain separate controls in a small stack.

The globe uses one land color because COBE 2.0.1 does not expose per-continent colors. Topic routes and active markers provide the visual distinction instead.

### Topic Routes

When one research topic is selected, collect the conference editions linked to publications in that topic. Sort the editions chronologically by year and then by their listed date order. Connect each consecutive pair of locations with a COBE arc, producing one readable research route rather than an all-to-all mesh.

Each conference edition gains a machine-readable `startsOn` date so route ordering never depends on parsing the human-facing `dates` text.

Duplicate consecutive locations do not create a zero-length arc. A topic with fewer than two distinct conference locations has markers but no route.

`All` topics shows no arcs to avoid mixing unrelated routes. Taipei is not rendered as a route origin, and no Taiwan-to-conference arc is shown.

### Conference Selection

Clicking a conference label:

- sets the conference filter;
- focuses the globe on that location and stops automatic rotation;
- highlights the selected edition marker and label;
- filters the publication list using topic AND conference AND publication type;
- shows the selected conference details and all publications linked to that edition in the journey card.

Conference filtering and publication selection use separate state. Clicking a publication continues to focus its linked conference and show its details, but it does not silently activate the conference filter or narrow the list. Only a conference label click activates the conference filter.

Clicking `All conferences` clears the conference filter, removes the focused conference card, and resumes automatic rotation unless reduced motion is enabled. Topic route arcs remain governed only by the active topic.

## Publication Presentation

- Change the profile line to `PhD candidate · National Taiwan University (NTU), Taiwan`.
- Add the `All / Journal / Conference` filter beside the research-topic controls while keeping the two filter groups visually distinct.
- Remove `Accepted` status text from publication rows. Only accepted work is included, so the label carries no information.
- Remove `Map linked` text from publication rows.
- Preserve multi-venue labels such as `TCAD` and `CASES / EMSOFT / CODES` on a single publication record.

## Responsive and Accessible Behavior

- All globe labels and filter chips are native buttons with visible keyboard focus.
- Filter state uses `aria-pressed`; the publication list remains an `aria-live` region.
- On narrow screens, filter groups wrap and the globe remains below the publication controls without cross-column connector lines.
- With reduced motion enabled, the globe does not auto-rotate, but labels, topic routes, focusing, and filtering continue to work.
- Browsers without CSS Anchor Positioning use the existing conference-button fallback below the globe.

## Verification

Tests cover:

- the intersection of topic, conference edition, and publication type;
- conference selection and clearing;
- chronological topic routes without duplicate-location arcs;
- no arcs for `All` topics or fewer than two distinct locations;
- updated labels and removal of `Accepted` and `Map linked` from rendered output;
- successful production build and lint.
