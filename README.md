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

- `content/*.json`: canonical website identity, publications, conference editions, locations, topics, links, and travel content.
- `content/README.md`: editing workflow and copy-ready templates for every content file.
- `app/data/portfolio-schema.ts`: strict content validation and shared data types.
- `app/lib/conference-model.ts`: relationship lookups and globe-coordinate conversion.
- `app/components/publication-observatory.tsx`: filters, publication selection, and conference context.
- `app/components/conference-globe.tsx`: responsive COBE rendering and focus animation.
- `app/globals.css`: the responsive dark visual system.

For routine updates, edit only the JSON content and run:

```bash
npm run content:validate
```

The website content and `../tundergod-cv/main.tex` are independent sources; neither automatically overwrites the other.

## Hosting

Pushes to `main` are built and deployed by GitHub Actions to [tundergod.github.io](https://tundergod.github.io/). Run `npm run test:pages` to verify the static GitHub Pages artifact locally.
