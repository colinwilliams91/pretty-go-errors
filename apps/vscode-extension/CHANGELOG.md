# Changelog

## 0.6.0

- Add hover formatting for more common Go diagnostics: unused variables and imports, mismatched types in operations, assignment mismatches, too many/not enough return values, and missing return
- Add hover formatting for missing field or method access, conversion argument mismatches, and methods defined on non-local types
- Add syntax-error hovers for "expected operand" and "missing comma in argument list"
- Broaden Marketplace keywords and tags to improve install discoverability
- Document the custom `ready`/`bump`/`package` release scripts and add `.gitattributes` to keep formatting consistent across platforms and CI

## 0.5.0

- Fix broken image on marketplace listing
- Add "ready for publishing" script that runs all checks and builds the extension, then prints
- Remove broken Go.mod shield since there is no actual Go code in the repo (it was just misleading)

## 0.4.0

- Establish FOSS onboarding docs (still needs some work)
- Fix workspace symlinks issues in CI pipelines
- Add 3x GH Issues in lieu of legitimate Roadmap (temp.)

## 0.3.0

- Update extension metadata like keywords and categories
- Check in dependency lockfiles for better reproducible builds

## 0.2.0

- Add extension logo asset
- Add badges to README
- Pass manual E2E testing of hover formatting in VS Code

## 0.1.0

- Initial Marketplace "release".
- Format supported Go diagnostics into clearer hover content.
- Preserve the original diagnostic text in the hover.
- Fix some TypeScript v5 -> v6 compatibility issues.
