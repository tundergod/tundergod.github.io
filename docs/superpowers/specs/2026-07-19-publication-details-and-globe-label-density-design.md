# Publication Details and Globe Label Density Design

## Goal

Make publication metadata easier to scan and make the COBE conference globe readable as the number of locations grows. A successful version keeps venue metadata directly attached to each title, prevents overlapping globe labels from blocking one another, and gives every selected conference or journal publication the same complete detail card below the globe.

## Publication rows

- The publication title and its venue, type, and DOI tags share one inline text flow. A tag follows the last title word whenever space permits; when space is insufficient, the whole tag moves to the next line without splitting internally.
- Venue, type, and DOI tags use 9px monospace text with a minimum height of 23px. Venue remains the strongest neutral tag, DOI keeps the coral action color, and publication type stays muted.
- Research-area tags remain on the author line because they describe the paper rather than its bibliographic identity. Their text increases from 7px to 8px so they remain legible without competing with the title-line tags.
- The entire row remains the globe-selection target. DOI continues to both select the publication and open the DOI in a new tab.

## Collision-aware globe labels

The selected visual direction is option A: collision merging.

- Every conference location keeps its COBE marker. Marker visibility continues to follow COBE's front-facing visibility state.
- City labels use 9px monospace text. Expanded conference editions and publication counts use 8px text.
- On each throttled collision pass, visible marker anchors are grouped when their label rectangles overlap with a small safety gap. This pass reads COBE's existing DOM anchors; it does not reimplement globe projection.
- A group with one place renders the normal city label. A group with several places renders one compact count badge at the group's representative anchor.
- Hovering or keyboard-focusing a count badge expands an anchored list of every city in the group. Each city is an independent button showing its conference editions and unique publication count. Choosing a city applies the existing place filter.
- The active place, whether reached from a publication or a place filter, is removed from collision merging and always renders its expanded city label above neighboring labels. This preserves the direct publication-to-globe-to-filter path.
- Without an active publication, the representative for a collision group is stable: the first place in portfolio data order. Stable representatives prevent labels from flickering while the globe rotates.
- Hidden or back-facing labels have no pointer hit area. Hovered, focused, expanded, and active labels render above other labels.
- On touch devices, tapping a collision badge opens its city list; tapping a city applies the filter. Tapping elsewhere or choosing “All conferences” closes the group.
- The CSS-anchor fallback retains the existing scrollable list and receives the same increased typography, but it does not need collision grouping.

## Complete publication focus card

- Selecting any publication, conference or journal, renders one detail card below the globe.
- The card contains:
  - venue tag or tags and publication year;
  - publication title;
  - full author list with Wen Sheng Lim emphasized;
  - research-area tags;
  - DOI action when a DOI exists;
  - city and country for conference publications with a mapped edition.
- Journal publications omit the location row. The current sentence saying that no conference location is attached is removed.
- Selecting a globe location is a place-filter action, not a publication selection, so it clears the publication focus card as it does now.
- The card is an `aria-live="polite"` region. DOI has a descriptive accessible name and visible keyboard focus.

## Component boundaries and data flow

- `PublicationRow` remains responsible for compact list rendering and selecting one publication.
- `PublicationObservatory` remains the owner of publication and place selection. It renders a reusable publication focus card from `selectedPublication`, `publicationEdition`, and `publicationPlace`.
- `ConferenceGlobe` remains responsible for COBE, marker labels, collision grouping, and place selection. It receives no new publication-selection state beyond the existing active place.
- Collision detection is isolated in a small pure helper that accepts labeled rectangles and an optional active place ID, then returns stable groups. DOM measurement and throttling remain inside `ConferenceGlobe`.
- No new dependency is added.

## Responsive behavior

- Publication title metadata remains inline on desktop, tablet, and mobile; natural line wrapping is allowed between the title and whole tags.
- Globe label sizes do not shrink below the new 9px/8px scale. Collision merging absorbs the additional pressure on smaller viewports.
- The focus card uses the existing full-width journey-panel card on narrow layouts and must not cause horizontal overflow.

## Verification

- Model tests cover collision grouping, stable representatives, active-place exclusion, and unique publication counts.
- Rendered-source tests protect inline title flow, enlarged tag classes, the complete focus-card fields, and removal of the journal “no location” sentence.
- Browser verification covers publication-to-globe selection, collision badge expansion, keyboard focus, city filtering, DOI behavior, conference focus-card location, journal focus-card omission of location, and mobile-width overflow.
- The production build and lint must pass.
