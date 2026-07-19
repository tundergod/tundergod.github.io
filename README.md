# Wen Sheng Lim — Personal Website

A dark academic profile connecting the complete publication record to conference editions and locations through a lightweight COBE globe.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm test
```

`npm test` validates the publication/conference/place relationship model, creates a production vinext build, and checks the server-rendered academic profile.

## Content structure

- `app/data/portfolio.ts`: publications, conference editions, places, and research areas derived from the CV.
- `app/lib/conference-model.ts`: relationship lookups and globe-coordinate conversion.
- `app/components/publication-observatory.tsx`: filters, publication selection, and conference context.
- `app/components/conference-globe.tsx`: responsive COBE rendering and focus animation.
- `app/globals.css`: the responsive dark visual system.

The CV remains the canonical source. Update the structured portfolio data when the CV changes; do not add website code to the CV project.

## Hosting

The project is Sites-compatible through `.openai/hosting.json`, but a production site is not created or deployed automatically. Deployment should happen only after the local preview is approved.
