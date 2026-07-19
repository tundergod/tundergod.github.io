import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the academic profile and complete publication observatory", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Wen Sheng Lim — Computer Systems Research<\/title>/i);
  assert.match(html, /class="publications-section"/);
  assert.match(html, /class="profile-intro"/);
  assert.match(html, /Wen Sheng Lim is a PhD candidate in Computer Science and Information Engineering/);
  assert.match(html, /expects to graduate in January 2027/);
  assert.match(html, /PhD candidate · National Taiwan University \(NTU\), Taiwan/);
  assert.match(html, /Memory \/ Storage/);
  assert.match(html, /Embedded/);
  assert.match(html, /Filter publications by type/);
  assert.match(html, /Progress Gambit/);
  assert.match(html, /href="https:\/\/doi.org\/10.1145\/3814956"/);
  assert.match(html, /class="publication-row-hit-area"/);
  assert.match(html, /class="publication-title-line"/);
  assert.match(html, /class="publication-topic-tag"[^>]*>Memory \/ Storage</);
  assert.match(html, /class="publication-type-tag"[^>]*>Conference</);
  assert.doesNotMatch(html, /Show on map/);
  assert.match(html, /<article class="publication-row/);
  assert.doesNotMatch(html, /<button class="publication-row"/);
  assert.match(html, /GraphISC/);
  assert.match(html, /iCheck/);
  assert.match(html, /Conference signal/);
  assert.match(html, /Browse all conferences/);
  assert.match(html, /globe-place-button/);
  assert.match(html, /class="globe-label-city"[^>]*>Long Beach</);
  assert.match(html, /class="globe-label-editions"[^>]*>DAC&#x27;26</);
  assert.match(html, /class="globe-label-count"[^>]*>2<!-- --> <!-- -->publications</);
  assert.doesNotMatch(html, /class="globe-origin"/);
  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  assert.match(visibleText, /Long Beach DAC&#x27;26 2 publications USA/);
  assert.match(html, /Travel field notes/);
  assert.doesNotMatch(html, />Accepted</);
  assert.doesNotMatch(html, /Map linked/);
  assert.doesNotMatch(html, /Focused location/);
  assert.doesNotMatch(html, /Building systems that keep/);
  assert.doesNotMatch(html, /One systems practice/);
  assert.doesNotMatch(html, /The work, mapped in motion/);
  assert.doesNotMatch(html, /Let’s make constrained/);
  assert.doesNotMatch(html, /class="hero"|class="research-section"/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/);
});

test("keeps place controls inside a globe with no routes", async () => {
  const globeSource = await readFile(
    new URL("../app/components/conference-globe.tsx", import.meta.url),
    "utf8",
  );
  const frameStart = globeSource.indexOf('className="globe-frame"');
  const frameEnd = globeSource.indexOf("\n      </div>", frameStart);
  const fallbackStart = globeSource.indexOf(
    '<div className="conference-index-fallback"',
  );
  const placeDetailsStart = globeSource.indexOf(
    'className="globe-place-details"',
    fallbackStart,
  );
  const observatorySource = await readFile(
    new URL("../app/components/publication-observatory.tsx", import.meta.url),
    "utf8",
  );

  assert.match(globeSource, /arcs:\s*\[\]/);
  assert.doesNotMatch(globeSource, /topicRouteArcs|buildArcs/);
  assert.ok(frameStart >= 0);
  assert.ok(fallbackStart > frameStart && fallbackStart < frameEnd);
  assert.ok(placeDetailsStart > frameStart && placeDetailsStart < frameEnd);
  assert.doesNotMatch(observatorySource, /Focused location|related-block/);
});

test("portals interactive place labels into the COBE anchor host", async () => {
  const globeSource = await readFile(
    new URL("../app/components/conference-globe.tsx", import.meta.url),
    "utf8",
  );
  const globalStyles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(globeSource, /createPortal/);
  assert.match(globeSource, /canvas\.parentElement/);
  assert.match(globeSource, /className="globe-label-layer"/);
  assert.match(globeSource, /createPortal\(labelLayer, labelHost\)/);
  assert.match(globalStyles, /\.globe-label-layer\s*{[^}]*display:\s*contents;/s);
  assert.match(globalStyles, /\.globe-label-stack:has\(\.globe-place-button\.is-active\)[^{]*{[^}]*z-index:\s*2;/s);
});

test("keeps enlarged bibliographic tags in the title text flow", async () => {
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(styles, /\.publication-title-line\s*{[^}]*display:\s*block;/s);
  assert.match(
    styles,
    /\.venue-chip,[\s\S]*\.publication-doi\s*{[^}]*min-height:\s*23px;[^}]*font-size:\s*9px;/s,
  );
  assert.match(
    styles,
    /\.publication-topic-tag\s*{[^}]*font-size:\s*8px;/s,
  );
});

test("renders one complete focus card for every selected publication", async () => {
  const source = await readFile(
    new URL("../app/components/publication-observatory.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /function PublicationFocusCard/);
  assert.match(source, /selectedPublication \? \(/);
  assert.match(source, /publication-focus-authors/);
  assert.match(source, /publication-focus-topics/);
  assert.match(source, /publication-focus-location/);
  assert.match(source, /publication-focus-doi/);
  assert.doesNotMatch(source, /has no conference location attached/);
  assert.doesNotMatch(source, /!publicationEdition && selectedPublication/);
});

test("renders expandable collision groups from COBE marker anchors", async () => {
  const source = await readFile(
    new URL("../app/components/conference-globe.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /groupOverlappingLabels/);
  assert.match(source, /globe-cluster-button/);
  assert.match(source, /globe-cluster-menu/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /onPointerEnter/);
  assert.match(source, /onFocus/);
  assert.match(source, /onClick=\{\(\) => setExpandedGroupId\(groupKey\)\}/);
  assert.match(source, /onSelectPlace\(details\.place\.id\)/);
});

test("lets globe callouts extend beyond the circular frame", async () => {
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(styles, /\.globe-frame\s*{[^}]*overflow:\s*visible;/s);
});

test("removes the disposable starter preview", async () => {
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
