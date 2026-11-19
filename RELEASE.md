# Release process

This document is the **maintainer's release playbook**. It is the companion to
[apps/vscode-extension/SUPPORT.md](./apps/vscode-extension/SUPPORT.md), which
covers the contributor perspective (reporting issues, first-time setup, the
development loop). The two describe the same pipeline at different points:

| Document                           | Perspective  | Covers                                                                        |
| ---------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `apps/vscode-extension/SUPPORT.md` | Contributors | Setup, dev loop, versioning expectations, what happens after merge            |
| `RELEASE.md` (this file)           | Maintainers  | The full release: gate → bump → changelog → merge → package → install/publish |

There are no git tags in this repository. A release is identified by the
version in `apps/vscode-extension/package.json` and the matching section in
`apps/vscode-extension/CHANGELOG.md`.

---

## 1. Gate the release

From the repo root:

```bash
npm run ready
```

This runs the full check suite: `test`, `lint`, `format:check`, and `build`
across all workspaces, then prints a reminder that the tree is ready to bump.
Everything must be green before continuing.

## 2. Choose the version

Semver rules (same guidance as the root README's "Versioning" section):

- **patch** — formatter fixes (bug fixes, hover corrections, no new diagnostics)
- **minor** — new diagnostic families or hover capabilities (e.g. new SA checks)
- **major** — breaking behavior or interface changes

## 3. Bump the version

From the repo root:

```bash
npm run bump -- <major|minor|patch>
```

This runs `npm version <level>` in the `apps/vscode-extension` workspace, so it
updates the version there and — with a clean git tree, per `npm version`
defaults — also creates a version commit and a `vX.Y.Z` git tag. (No tags
exist in the repo today because previous bumps were run against dirty trees;
the first clean-tree bump will produce the first tag. Delete it with
`git tag -d vX.Y.Z` if you don't want it, or embrace it and push tags going
forward.) It is exactly equivalent to `SUPPORT.md`'s alternative approach of
running `npm version <major|minor|patch>` inside `apps/vscode-extension` —
prefer the root command so you never need to `cd`.

## 4. Update the CHANGELOG

Edit `apps/vscode-extension/CHANGELOG.md`:

- move any `## Unreleased` bullet points under a `## <new-version>` heading
  (create the heading if it doesn't exist)
- keep one section per released version, newest first

Commit the bump + changelog together with your feature work (or as a dedicated
release commit) and get it merged to `main` via PR, following the cadence in
`SUPPORT.md`.

## 5. Package the VSIX

**Important (from `SUPPORT.md`):** run the package step _after_ your changes
have merged, on the merged `main`, so the VSIX manifest carries the released
version number. VSIX files are git-ignored (`*.vsix` in `.gitignore`) and are
never checked in.

```bash
npm run package -w apps/vscode-extension
```

This compiles the extension with esbuild and produces:

```
apps/vscode-extension/pretty-go-errors-<version>.vsix
```

## 6a. Install locally for manual testing

```bash
code --install-extension apps/vscode-extension/pretty-go-errors-<version>.vsix
```

Or from the VS Code GUI: **Extensions** panel → `⋯` → **Install from VSIX…**.
Reload the window when prompted (`Ctrl/Cmd+Shift+P` → _Developer: Reload
Window_).

For Gopls Staticcheck analyzer diagnostics (SA-series) to appear at all, the
workspace under test must have Staticcheck enabled — see the end-user note in
[apps/vscode-extension/README.md](./apps/vscode-extension/README.md):

```jsonc
{
  "gopls": { "staticcheck": true },
}
```

## 6b. Publish to the Marketplace

Publishing is manual (no CI step does it). Either:

```bash
npx vsce publish
```

(run from `apps/vscode-extension`; requires a publisher Personal Access
Token), or upload the generated `.vsix` through the
[Visual Studio Marketplace publisher portal](https://marketplace.visualstudio.com/manage).

---

## Quick reference

```bash
npm install                              # first-time setup
npm run ready                            # full gate
npm run bump -- <major|minor|patch>      # bump apps/vscode-extension version
npm run package -w apps/vscode-extension # build .vsix (run on merged main)
code --install-extension apps/vscode-extension/pretty-go-errors-<version>.vsix
npx vsce publish                         # manual Marketplace publish
```
