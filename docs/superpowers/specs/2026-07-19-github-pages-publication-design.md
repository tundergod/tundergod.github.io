# GitHub Pages Publication Design

## Goal

Publish the personal website at `https://tundergod.github.io/` using the free
GitHub Pages service while keeping the existing local and Sites-compatible
development path functional.

## Repository visibility and identity

- Rename the GitHub repository from `tundergod-website` to
  `tundergod.github.io`.
- Change the repository visibility from private to public because the account
  does not have GitHub Pro.
- Treat the full Git history and tracked design documents as intentionally
  public.
- Do not publish ignored environment files, credentials, build caches, or
  temporary deployment artifacts.

## Build architecture

The project will retain two explicit build targets:

1. The existing `npm run build` vinext target remains the local and
   Sites-compatible production build.
2. A new `npm run build:pages` target uses Next.js static export and writes the
   GitHub Pages artifact to `out/`.

The Pages build must not add a repository subpath because
`tundergod.github.io` is a user site served at the domain root. The website is
eligible for static export because its publication data is local and its COBE
globe, filters, hover states, focus states, and selections execute in the
browser. No database or server request is required for the published profile.

## Deployment workflow

A workflow in `.github/workflows/deploy-pages.yml` will:

1. Run for pushes to `main` and allow manual dispatch.
2. Check out the repository and install the locked Node dependencies.
3. Run the existing model and rendered checks plus the Pages-specific static
   build verification.
4. Upload `out/` with GitHub's Pages artifact action.
5. Deploy the artifact with GitHub's Pages deployment action.

The workflow will use the minimum GitHub permissions required for Pages and
will use the `github-pages` environment. It will not require a personal access
token or third-party deployment secret.

## Verification

Before publishing:

- The repository must have no tracked credentials or ignored environment
  files staged for commit.
- `npm run lint` must pass.
- The existing model tests and rendered HTML tests must pass.
- `npm run build:pages` must produce `out/index.html` and its referenced static
  assets without an incorrect repository base path.

After publishing:

- The repository must report `PUBLIC` visibility and default branch `main`.
- The Pages workflow must complete successfully from the pushed `main` head.
- `https://tundergod.github.io/` must return the deployed personal website.
- Publication selection, globe labels, filters, DOI navigation, and responsive
  layout remain browser-side behavior and must be preserved by the static
  build.

## Failure handling

- If static export exposes a server-only dependency, remove that dependency
  from the public route rather than adding a runtime service to Pages.
- If GitHub rejects the Pages configuration, stop and report the exact account
  or repository setting that blocks publication.
- The existing private Sites deployment remains unchanged; GitHub Pages is an
  independent public deployment.

