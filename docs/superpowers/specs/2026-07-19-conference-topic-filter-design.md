# Conference Topic Filter Design

## Goal

Turn the globe into a conference filter with conference labels placed inside the map. The publication list remains the primary content; the globe provides filtering and location context rather than a separate navigation system.

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

With no conference selected, the COBE globe rotates automatically. Every conference edition appears as a clickable label beside its location marker. Each label shows `Conference Year` and `City, Country` on separate lines, and editions sharing a city remain separate controls in a small stack.

The globe uses one land color because COBE 2.0.1 does not expose per-continent colors. Active markers and labels provide the visual distinction.

### No Map Connections

The globe does not draw arcs between conference locations or from Taiwan to conference locations. Research-topic filters affect only the publication list; they do not create geographic routes.

### Labels Inside the Globe

Conference labels remain inside the circular globe frame. Browsers with CSS Anchor Positioning attach each label to its COBE marker. Browsers without CSS Anchor Positioning render a compact conference overlay inside the frame instead of placing fallback controls below the globe. The fallback remains clickable and includes the same conference, year, city, and country text.

When a conference is selected, an internal detail card appears inside the globe with the conference series and year, city and country, full conference name, and dates. Conference details are not duplicated in a card below the globe. The external `All conferences` control clears the selection and returns to browsing.

### Conference Selection

Clicking a conference label:

- sets the conference filter;
- focuses the globe on that location and stops automatic rotation;
- highlights the selected edition marker and label;
- filters the publication list using topic AND conference AND publication type;
- shows the selected conference details inside the globe.

Conference filtering and publication selection use separate state. Clicking a publication continues to focus its linked conference and show its details, but it does not silently activate the conference filter or narrow the list. Only a conference label click activates the conference filter.

Clicking `All conferences` clears the conference filter, removes the focused conference card, and resumes automatic rotation unless reduced motion is enabled.

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
- With reduced motion enabled, the globe does not auto-rotate, but labels, focusing, and filtering continue to work.
- Browsers without CSS Anchor Positioning use a compact conference-button overlay inside the globe frame.

## Verification

Tests cover:

- the intersection of topic, conference edition, and publication type;
- conference selection and clearing;
- no COBE arcs or Taiwan route origin;
- conference labels include city and country and remain inside the globe frame in both anchor and fallback modes;
- selected conference details render inside the globe rather than in a journey card below it;
- updated labels and removal of `Accepted` and `Map linked` from rendered output;
- successful production build and lint.
