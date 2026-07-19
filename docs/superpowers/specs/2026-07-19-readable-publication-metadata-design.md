# Readable Publication Metadata Design

## Goal

Make publication metadata, filters, utility labels, and globe labels legible at
normal desktop, tablet, and phone viewing sizes while preserving the dark
academic-observatory identity and the complete publication list.

## Scope

This pass changes typography and publication metadata flow only. The existing
globe collision-group behavior remains intact; replacing merged globe clusters
with a different interaction model is explicitly deferred to the next design
round.

## Publication information flow

Each publication row will use two textual lines:

1. The title line contains the publication title followed by venue, type,
   research-topic, and DOI tags in that order. Tags remain inline with the
   title and wrap naturally when the available width is exhausted.
2. The secondary line contains authors only. Research-topic tags no longer
   appear beside the author list.

The full publication row remains the selection target. A DOI click continues
to select the publication and open the DOI in a new tab.

## Type scale

- Publication title: `18px` on desktop and tablet, with a `16px` minimum on
  phones.
- Venue, publication type, research topic, and DOI tags: `14px` minimum on all
  supported widths. Their padding and minimum height increase proportionally.
- Publication authors: `13px` on desktop and tablet, with a `12px` minimum on
  phones.
- Filter buttons: `14px`.
- `TOPIC` and `TYPE` filter-group labels: `12px`.
- Publication year: `14px`; publication count: `12px`.
- Conference signal, browse action, header role, and comparable utility text:
  `12px` minimum.
- Globe city labels: `11px`.
- Globe hover and focus details: `12px`.
- Globe cluster count and cluster-menu text: `12px`.

No responsive breakpoint may reduce a metadata tag below `14px`, an author
line below `12px`, or a utility label below `12px`. Smaller screens absorb the
larger type through wrapping and increased row height rather than shrinking.

## Visual system

The existing palette and font roles remain unchanged:

- Near-black surfaces continue to carry the publication record.
- Ice text remains the primary reading color.
- Blue continues to identify research topics and active academic signals.
- Orange continues to identify DOI actions, selection, and journey focus.
- Geist remains the reading face; Geist Mono remains the metadata and utility
  face.

The intentional visual change is scale, not ornament. Larger metadata becomes
part of the publication title rhythm instead of behaving like footnotes.

## Responsive behavior

- Desktop retains the publication-and-globe two-column structure.
- Tablet and phone layouts preserve the current stacking behavior.
- Inline metadata wraps after the title when required without creating a
  separate tag rail.
- Author text may wrap on phones and must not be clipped solely to preserve row
  density.
- Globe labels remain within the existing responsive frame and use the larger
  city/detail sizes at every breakpoint.

## Interaction and accessibility

- Existing publication selection, DOI navigation, place filtering, hover,
  focus, and keyboard interactions remain unchanged.
- Tag enlargement must not create new pointer targets that intercept the
  publication row.
- Existing visible focus styles remain present.
- Reduced-motion behavior remains unchanged.

## Verification

- A rendered publication row contains research-topic tags inside
  `.publication-title-line` and not inside `.publication-secondary-line`.
- CSS tests verify the approved minimum sizes for tags, authors, utility text,
  filters, and globe labels.
- Existing publication, filtering, globe, DOI, vinext, static-export, and Pages
  workflow tests continue to pass.
- Visual QA covers desktop, tablet, and phone widths, checking tag wrapping,
  author wrapping, globe-label readability, and absence of horizontal page
  overflow.

