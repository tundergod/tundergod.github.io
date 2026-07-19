import assert from "node:assert/strict";
import test from "node:test";

import { loadContent } from "../scripts/load-content.ts";

const data = await loadContent();

test("migrates the complete current portfolio", () => {
  assert.equal(data.publications.length, 15);
  assert.equal(data.conferences.length, 8);
  assert.equal(data.locations.length, 8);
  assert.deepEqual(
    data.researchTopics.map(({ id }) => id),
    ["memory-storage", "architecture", "embedded", "robotics"],
  );
});

test("preserves publication ordering and exact DOI ownership", () => {
  assert.deepEqual(
    data.publications.slice(0, 4).map(({ id }) => id),
    [
      "graphisc-tcad-2026",
      "timing-composable-tecs-2026",
      "progress-gambit-iccad-2026",
      "winhd-cases-2026",
    ],
  );
  assert.equal(
    data.publications.find(({ id }) => id === "isafe-tcad-2025")?.doi,
    "10.1109/TCAD.2024.3522211",
  );
});

test("preserves GraphISC and WinHD shared-edition semantics", () => {
  const graphisc = data.publications.find(
    ({ id }) => id === "graphisc-tcad-2026",
  );
  const winhd = data.publications.find(
    ({ id }) => id === "winhd-cases-2026",
  );
  assert.deepEqual(graphisc?.venueTags, ["TCAD", "CASES"]);
  assert.equal(graphisc?.type, "journal");
  assert.equal(graphisc?.conferenceEditionId, "esweek-2026");
  assert.deepEqual(winhd?.venueTags, ["CASES"]);
  assert.equal(winhd?.conferenceEditionId, "esweek-2026");
});

test("preserves reusable edition and place relationships", () => {
  const dacPapers = data.publications.filter(
    ({ conferenceEditionId }) => conferenceEditionId === "dac-2026",
  );
  assert.deepEqual(
    dacPapers.map(({ id }) => id),
    ["rememtier-dac-2026", "flashhd-dac-2026"],
  );
  assert.equal(
    data.conferences.find(({ id }) => id === "dac-2026")?.placeId,
    "long-beach",
  );
  assert.equal(
    data.locations.find(({ id }) => id === "long-beach")?.city,
    "Long Beach",
  );
});
