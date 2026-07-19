import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../out/", import.meta.url);

test("exports the complete profile at the Pages domain root", async () => {
  await access(new URL("index.html", outputRoot));
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(
    html,
    /<title>Wen Sheng Lim — Computer Systems Research<\/title>/,
  );
  assert.match(html, /class="publications-section"/);
  assert.match(html, /Conference signal/);
  assert.doesNotMatch(html, /\/tundergod-website\//);

  const assetPaths = [
    ...html.matchAll(/(?:src|href)="(\/_next\/[^"?#]+)/g),
  ].map((match) => match[1]);
  assert.ok(assetPaths.length > 0);
  await Promise.all(
    assetPaths.map((path) => access(new URL(`.${path}`, outputRoot))),
  );
});

test("exports the SEO assets and CV alongside the profile", async () => {
  await access(new URL("robots.txt", outputRoot));
  await access(new URL("sitemap.xml", outputRoot));
  await access(new URL("tundergod_CV.pdf", outputRoot));

  const robots = await readFile(new URL("robots.txt", outputRoot), "utf8");
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/tundergod\.github\.io\/sitemap\.xml/);

  const sitemap = await readFile(new URL("sitemap.xml", outputRoot), "utf8");
  assert.match(sitemap, /<loc>https:\/\/tundergod\.github\.io\/<\/loc>/);

  const html = await readFile(new URL("index.html", outputRoot), "utf8");
  assert.match(html, /href="\/tundergod_CV\.pdf"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/tundergod\.github\.io\/?"/);
  assert.match(html, /<script type="application\/ld\+json">/);
});
