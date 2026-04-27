# pretty-go-errors

A VS Code extension that makes Go diagnostics easier to read in hovers.

## Scope for v0.1.0

This repository currently targets a hover-only MVP:

- listens for Go diagnostics
- rewrites supported messages into clearer hover content
- preserves the original diagnostic at the bottom of the hover
- uses a monorepo layout inspired by `pretty-ts-errors`

Sidebar functionality is intentionally deferred for now.

## Workspace layout

- `apps/vscode-extension`: VS Code extension entrypoint
- `packages/formatter`: Go diagnostic parsing and normalization
- `packages/vscode-formatter`: hover-focused markdown rendering for VS Code
- `packages/utils`: small shared helpers

## Commands

```bash
npm install
npm run format # will auto fix. npm run format:check will check without fixing
npm run lint
npm run build
npm run test
npm run package
```

## Versioning

The initial published target is `0.1.0`. Patch releases should be used for formatter fixes, while minor releases should be used when new diagnostic families or hover capabilities are added.
