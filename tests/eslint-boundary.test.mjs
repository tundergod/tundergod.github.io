import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("lint excludes isolated worktrees and their generated artifacts", async () => {
  const config = await readFile(
    new URL("../eslint.config.mjs", import.meta.url),
    "utf8",
  );

  assert.match(config, /"\.worktrees\/\*\*"/);
});
