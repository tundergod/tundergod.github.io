import assert from "node:assert/strict";
import { access } from "node:fs/promises";
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
  assert.match(html, /PhD candidate · National Taiwan University \(NTU\), Taiwan/);
  assert.match(html, /Memory \/ Storage/);
  assert.match(html, /Embedded/);
  assert.match(html, /Filter publications by type/);
  assert.match(html, /Progress Gambit/);
  assert.match(html, /GraphISC/);
  assert.match(html, /iCheck/);
  assert.match(html, /Conference signal/);
  assert.match(html, /Browse all conferences/);
  assert.match(html, /globe-conference-button/);
  assert.doesNotMatch(html, /class="globe-origin"/);
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

test("removes the disposable starter preview", async () => {
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
