# Personal Website V1 — Implementation Plan

## 1. Lock the relationship model with tests

- Add a failing Node test for publication → edition → place lookup, multiple papers per edition, and several editions per place.
- Run it and confirm the expected missing-module failure.
- Implement typed portfolio data and pure relationship helpers.
- Run the model test until green.

## 2. Replace the starter with the academic site

- Add COBE and remove the starter-only loading dependency.
- Build the client-side Publication Observatory, including filters, selected publication state, conference context, and globe focus animation.
- Replace the starter page, metadata, and CSS with the approved dark Split Observatory design.
- Remove the disposable `_sites-preview` directory and development preview metadata.

## 3. Verify behavior and deployment readiness

- Replace the starter rendered-HTML assertions with product assertions.
- Run the model tests, lint, production build, and rendered-HTML test.
- Keep the local site open in the in-app browser for review.
- Do not create or deploy a production Sites version until the user approves the preview.

