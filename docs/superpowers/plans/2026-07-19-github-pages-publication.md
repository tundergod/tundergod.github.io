# GitHub Pages Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the existing personal website at `https://tundergod.github.io/` from a public GitHub repository without breaking its vinext/Sites build.

**Architecture:** Keep the current vinext build as the default and add an opt-in Next.js static-export build for GitHub Pages. A GitHub Actions workflow validates both build paths, uploads `out/`, and deploys it through GitHub Pages from `main`.

**Tech Stack:** Next.js 16 static export, vinext, Node.js 22, Node test runner, GitHub Actions, GitHub Pages

## Global Constraints

- The published URL is exactly `https://tundergod.github.io/`; do not configure a repository subpath.
- The GitHub repository becomes public and is renamed to `tundergod.github.io`.
- Keep `npm run build` as the existing vinext/Sites-compatible build.
- Do not add a deployment dependency or personal access token.
- Keep ignored environment files, credentials, caches, and generated artifacts out of Git.
- Preserve the current COBE globe, publication filters, DOI links, focus interactions, and responsive layout.

---

### Task 1: Specify the Pages artifact contract

**Files:**
- Create: `tests/pages-export.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: the static artifact directory `out/` produced by `npm run build:pages`.
- Produces: `npm run verify:pages`, which verifies the root HTML, metadata, static assets, and root-relative URLs.

- [ ] **Step 1: Write the failing artifact test**

```js
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../out/", import.meta.url);

test("exports the complete profile at the Pages domain root", async () => {
  await access(new URL("index.html", outputRoot));
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /<title>Wen Sheng Lim — Computer Systems Research<\/title>/);
  assert.match(html, /class="publications-section"/);
  assert.match(html, /Conference signal/);
  assert.doesNotMatch(html, /\/tundergod-website\//);

  const assetPaths = [...html.matchAll(/(?:src|href)="(\/_next\/[^"?#]+)/g)]
    .map((match) => match[1]);
  assert.ok(assetPaths.length > 0);
  await Promise.all(
    assetPaths.map((path) => access(new URL(`.${path}`, outputRoot))),
  );
});
```

- [ ] **Step 2: Add only the verification script**

Add to `package.json`:

```json
"verify:pages": "node --test tests/pages-export.test.mjs"
```

- [ ] **Step 3: Run the contract and verify RED**

Run: `npm run verify:pages`

Expected: FAIL because `out/index.html` does not exist.

- [ ] **Step 4: Commit the failing contract**

```bash
git add package.json tests/pages-export.test.mjs
git commit -m "test: define GitHub Pages artifact"
```

### Task 2: Add the static export target

**Files:**
- Modify: `next.config.ts`
- Modify: `package.json`
- Test: `tests/pages-export.test.mjs`

**Interfaces:**
- Consumes: `GITHUB_PAGES=true` from the Pages build script.
- Produces: a Next.js export at `out/index.html` while leaving the default vinext build configuration unchanged.

- [ ] **Step 1: Configure static export only for Pages**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
```

- [ ] **Step 2: Add the Pages build and test scripts**

Add to `package.json`:

```json
"build:pages": "GITHUB_PAGES=true next build",
"test:pages": "npm run build:pages && npm run verify:pages"
```

- [ ] **Step 3: Run the Pages build and verify GREEN**

Run: `npm run test:pages`

Expected: PASS with `out/index.html` and root-relative `_next` assets present.

- [ ] **Step 4: Re-run the existing build path**

Run: `npm test`

Expected: all 14 model tests, vinext build, and all 8 rendered tests pass.

- [ ] **Step 5: Commit the static build target**

```bash
git add next.config.ts package.json tests/pages-export.test.mjs
git commit -m "feat: add GitHub Pages static export"
```

### Task 3: Add the GitHub Pages workflow

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `tests/pages-workflow.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `main`, the package lock, `npm test`, and `npm run test:pages`.
- Produces: a `github-pages` deployment from the uploaded `out/` artifact.

- [ ] **Step 1: Write the failing workflow contract**

Create `tests/pages-workflow.test.mjs` to read the workflow and assert that it:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("deploys the validated static artifact through GitHub Pages", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/deploy-pages.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run test:pages/);
  assert.match(workflow, /path:\s*\.\/out/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});
```

- [ ] **Step 2: Run the workflow contract and verify RED**

Run: `node --test tests/pages-workflow.test.mjs`

Expected: FAIL because `.github/workflows/deploy-pages.yml` does not exist.

- [ ] **Step 3: Create the least-privilege Pages workflow**

Create `.github/workflows/deploy-pages.yml` with checkout, Node 22 setup,
`npm ci`, `npm run lint`, `npm test`, `npm run test:pages`,
`actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` using
`./out`, and `actions/deploy-pages@v4`. Grant only `contents: read`,
`pages: write`, and `id-token: write`; use the `github-pages` environment and
concurrency group `pages`.

- [ ] **Step 4: Include the workflow contract in the Pages verification**

Change `verify:pages` to:

```json
"verify:pages": "node --test tests/pages-export.test.mjs tests/pages-workflow.test.mjs"
```

- [ ] **Step 5: Run the workflow contract and verify GREEN**

Run: `npm run verify:pages`

Expected: both Pages tests pass.

- [ ] **Step 6: Commit the workflow**

```bash
git add .github/workflows/deploy-pages.yml package.json tests/pages-workflow.test.mjs
git commit -m "ci: deploy website with GitHub Pages"
```

### Task 4: Publish and verify the public site

**Files:**
- Modify remotely: GitHub repository identity, visibility, and Pages settings

**Interfaces:**
- Consumes: the verified local `main` branch and GitHub authentication.
- Produces: the public repository `tundergod/tundergod.github.io` and public URL `https://tundergod.github.io/`.

- [ ] **Step 1: Run the complete local release gate**

Run:

```bash
npm run lint
npm test
npm run test:pages
git diff --check
git status --short --branch
```

Expected: all commands pass and only the planned commits are ahead of `origin/main`.

- [ ] **Step 2: Scan tracked source for credentials**

Run:

```bash
git grep -n -E '(API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE KEY|BEGIN [A-Z ]+ KEY)' -- .
git ls-files '.env*' '*.pem'
```

Expected: no credentials or environment files are reported; workflow permission names are the only acceptable generic token-related matches.

- [ ] **Step 3: Rename the GitHub repository and make it public**

Run:

```bash
gh repo rename tundergod.github.io --repo tundergod/tundergod-website --yes
gh repo edit tundergod/tundergod.github.io --visibility public --accept-visibility-change-consequences
```

Expected: repository reports `PUBLIC` and default branch `main`.

- [ ] **Step 4: Push the verified `main` branch**

Run: `git push origin main`

Expected: the remote redirects to `tundergod/tundergod.github.io` and receives the verified head.

- [ ] **Step 5: Enable GitHub Pages with the workflow source**

Run:

```bash
gh api --method POST repos/tundergod/tundergod.github.io/pages -f build_type=workflow
```

If Pages already exists, use:

```bash
gh api --method PUT repos/tundergod/tundergod.github.io/pages -f build_type=workflow
```

Expected: Pages configuration uses the Actions workflow source.

- [ ] **Step 6: Watch the deployment workflow**

Run: `gh run watch --repo tundergod/tundergod.github.io --exit-status`

Expected: build and deploy jobs succeed.

- [ ] **Step 7: Verify the public endpoint and repository state**

Run:

```bash
gh repo view tundergod/tundergod.github.io --json visibility,defaultBranchRef,url
gh api repos/tundergod/tundergod.github.io/pages
curl --fail --location https://tundergod.github.io/
```

Expected: repository is public, Pages reports the root URL, and the endpoint returns the website HTML.

