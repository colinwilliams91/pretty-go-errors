# Changelog

## 0.7.0

_The SA1000 items originally drafted for this section shipped with the 0.6.4
Marketplace release (PR #17); the changes below are new since 0.6.4._

- Add hover formatting for 42 more Gopls Staticcheck analyzer diagnostics (Tier-1 catalog):
  - SA1 standard-library misuse: SA1002, SA1004, SA1006, SA1008, SA1012, SA1015, SA1017, SA1019, SA1029, SA1032
  - SA2 concurrency: SA2000, SA2001, SA2002, SA2003
  - SA3 testing: SA3000
  - SA4 dead code: SA4000, SA4001, SA4003, SA4004, SA4005, SA4006, SA4008, SA4009, SA4010, SA4011, SA4017, SA4023, SA4031
  - SA5 correctness: SA5000, SA5001, SA5002, SA5003, SA5004, SA5007, SA5008, SA5009, SA5010
  - SA6 performance: SA6000, SA6002, SA6005
  - SA9 dubious code: SA9001, SA9002
- Split the analyzer registry into per-category modules (`goplsAnalyzers/sa1xx.ts` … `sa9xx.ts`) with per-category test files; registry and public API unchanged
- Ground every analyzer regex in verbatim message templates extracted from the Staticcheck analyzer sources (`docs/staticcheck-message-grounding.md`)
- Add the maintainer release playbook (`RELEASE.md`) with end-user gopls Staticcheck setup documented in the extension README

## 0.6.4

_The SA1000 seed shipped here (PR #17, "pre-release-v6.4") although it was
drafted under the 0.7.0 heading:_

- Add hover formatting for the first Gopls Staticcheck analyzer diagnostic: SA1000 (Invalid regular expression)
- Add a code-keyed registry and dispatch seam for Gopls analyzer diagnostics, laying the groundwork for the SA/ST/S check families
- Extract a shared `normalizeDiagnosticCode` helper so diagnostic `code` normalization is consistent across the renderer and the new analyzer seam
- Document before/after via gifs embedded in vsix README

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
