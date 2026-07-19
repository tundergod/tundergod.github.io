import assert from "node:assert/strict";
import test from "node:test";

import {
  groupOverlappingLabels,
  isCobeMarkerVisible,
  rectanglesOverlap,
} from "../app/lib/globe-label-collisions.ts";

const rect = (id, left, top, visible = true) => ({
  id,
  left,
  top,
  right: left + 60,
  bottom: top + 24,
  visible,
});

test("rectangles overlap across the configured safety gap", () => {
  assert.equal(rectanglesOverlap(rect("a", 0, 0), rect("b", 66, 0), 8), true);
  assert.equal(rectanglesOverlap(rect("a", 0, 0), rect("b", 70, 0), 8), false);
});

test("collision groups are transitive and preserve data order", () => {
  assert.deepEqual(
    groupOverlappingLabels([
      rect("san-francisco", 0, 0),
      rect("san-jose", 55, 0),
      rect("long-beach", 110, 0),
      rect("antwerp", 260, 0),
    ]),
    [
      {
        representativeId: "san-francisco",
        placeIds: ["san-francisco", "san-jose", "long-beach"],
      },
      { representativeId: "antwerp", placeIds: ["antwerp"] },
    ],
  );
});

test("the active place stays independent from an overlapping group", () => {
  assert.deepEqual(
    groupOverlappingLabels([
      rect("san-francisco", 0, 0),
      rect("long-beach", 20, 0),
      rect("san-jose", 40, 0),
    ], "long-beach"),
    [
      {
        representativeId: "san-francisco",
        placeIds: ["san-francisco", "san-jose"],
      },
      { representativeId: "long-beach", placeIds: ["long-beach"] },
    ],
  );
});

test("back-facing labels remain stable singletons", () => {
  assert.deepEqual(
    groupOverlappingLabels([
      rect("barcelona", 0, 0, false),
      rect("antwerp", 0, 0),
    ]),
    [
      { representativeId: "barcelona", placeIds: ["barcelona"] },
      { representativeId: "antwerp", placeIds: ["antwerp"] },
    ],
  );
});

test("COBE exposes visible markers with its non-empty CSS token", () => {
  assert.equal(isCobeMarkerVisible("N"), true);
  assert.equal(isCobeMarkerVisible(""), false);
  assert.equal(isCobeMarkerVisible("  "), false);
});
