# Bio and Publication Actions Design

## Goal

Add a short factual career-stage bio, correct WinHD to CASES, and make publication actions explicit and legally safe through DOI landing pages.

## Bio

Place one compact paragraph between the site header and publication observatory. It states the PhD program and institution, research scope, and expected January 2027 graduation. It is factual, has no slogan, and does not add a hero section. Add a visually hidden `h1` for document structure without introducing a visible title the user rejected.

## WinHD

Represent WinHD once as a CASES conference publication. Its publication chip is `CASES`, its type is `conference`, and it remains linked to the Barcelona `CASES / EMSOFT / CODES` event for map filtering.

## DOI Data

Add an optional `doi` field to publication records. Populate it only when the Crossref result title exactly matches the publication title. Records without a confirmed exact match have no DOI action.

Confirmed DOI records:

- Timing-Constrained Composable Inference: `10.1145/3814956`
- STAR: `10.23919/DATE69613.2026.11539515`
- Volunteer Computing: `10.1145/3748522.3779848`
- ReCross: `10.1145/3748522.3779854`
- SARA: `10.1109/ASP-DAC66049.2026.11420662`
- iSAFE: `10.1109/TCAD.2024.3522211`
- Flash-Memory Survey: `10.1145/3723167`
- TRAIN: `10.1109/ICCAD57390.2023.10323634`
- Data Freshness: `10.23919/DATE56975.2023.10136912`
- iCheck: `10.1109/TCAD.2020.3046571`

## Publication Interaction

Publication rows are no longer full-width buttons. Each row is a semantic article with explicit actions:

- `DOI ↗` opens `https://doi.org/{doi}` in a new tab when a confirmed DOI exists.
- `Show on map` focuses the linked conference without opening an external page.

Remove the ambiguous row-level arrow. Preserve selected-row styling after `Show on map` is activated.

## Verification

Tests cover the bio, WinHD venue/type, exact DOI records, absence of guessed DOI values, DOI links, explicit map actions, and removal of the ambiguous publication-row button behavior.
