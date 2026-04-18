# Support

## Report an issue

Open issues at https://github.com/colinwilliams91/pretty-go-errors/issues.

## Include when possible

- the raw diagnostic text
- whether the source was `gopls`, `compiler`, `go list`, `go test`, or `syntax`
- what you expected the hover to say instead
- VS Code version and Go extension version if relevant

## Development
_First time setup:_
- clone the repo
- run `npm install` at the root to install dependencies for all packages
- make your changes
- run `npm run lint` to check for linting errors
- run `npm run format` to apply code formatting
  - if you get failures consider running `npm run format:fix` or `npx prettier --write` to apply automatic fixes
- run `npm run build` to compile the extension
- run `npm run test` to execute tests
- IF ALL PASS, you can publish a new version to the Marketplace:
  - update the version in `apps/vscode-extension/package.json` according to semver rules
  - commit and push your changes
- run `npm run package` to create a VSIX package for manual installation or Marketplace publishing