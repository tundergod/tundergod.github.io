import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const behaviorFiles = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/components/publication-observatory.tsx",
];

test("keeps personal and portfolio content outside behavior files", async () => {
  for (const file of behaviorFiles) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(
      source,
      /Wen Sheng Lim|tundergod1882|y_7M9psAAAAJ|0000-0002-2391-8127/,
    );
    assert.doesNotMatch(
      source,
      /Memory \/ Storage|CASES \/ EMSOFT \/ CODES|Long Beach/,
    );
  }
});
