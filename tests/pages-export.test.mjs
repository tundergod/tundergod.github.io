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
