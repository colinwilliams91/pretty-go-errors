# Gopls Analyzer Diagnostics — Implementation Plan

A repeatable, formulaic strategy for adding Gopls Analyzer diagnostic support
(e.g. Staticcheck SA/ST/S codes) to pretty-go-errors, with guardrails and a
TDD workflow. The first concrete check is **SA1000** as the validating seed.

---

## 1. Context

pretty-go-errors is a TypeScript VS Code extension that rewrites Go diagnostics
into clearer hover markdown. Today it supports 20 compiler/syntax diagnostic
families matched purely by **message-string regex**, plus a terminal fallback.
It has **zero awareness** of Gopls Analyzer diagnostics (Staticcheck SA/ST/S,
quickfix QF, etc.) — all such diagnostics currently fall through to the
`fallback` family and are shown verbatim.

Gopls analyzer diagnostics carry an authoritative **`code`** (e.g. `SA1000`)
that the existing pipeline already normalizes and passes through to the
formatter layer but never uses for dispatch. This plan adds a new,
code-keyed dispatch seam for analyzer diagnostics while leaving the existing
20-family message chain completely untouched.

---

## 2. Locked decisions

| Decision        | Choice                                                                                |
| --------------- | ------------------------------------------------------------------------------------- |
| Routing         | Code-keyed registry + new seam. Existing `parseGoDiagnostic` chain unchanged.         |
| Scope           | Framework + SA1000 seed.                                                              |
| Docs links      | None — hovers stay link-free.                                                         |
| `family` naming | Lowercased code (e.g. `sa1000`).                                                      |
| Structure       | Source-structured dispatch mirroring `SUPPORTED_GO_DIAGNOSTIC_SOURCES`.               |
| Exports         | Explicit named imports/exports (the repo recently moved away from barrel `export *`). |

---

## 3. Current architecture (reference)

```
vscode.Diagnostic { message, source?, code?, range, severity }
  |
  | apps/vscode-extension/src/diagnostics.ts
  |   - isSupportedDiagnostic: source in {compiler, gopls, go list, go test, syntax} or unset
  |   - normalizeCode: flattens {value} object form to primitive
  |   - LRU cache keyed by {source, code, message}
  v
vscode-formatter.prettifyDiagnosticForHover({message, source, code})
  |
  | - parseGoDiagnostic(message)  ->  ParsedDiagnostic
  |   (packages/formatter/src/prettifyGoDiagnostic.ts)
  |   compactLines(message) then ??-chain of 20 regex parsers + createFallbackDiagnostic
  |
  | - renderParsedDiagnosticForHover(parsed, {source, code})  ->  markdown string
  |   (packages/vscode-formatter/src/prettifyDiagnosticForHover.ts)
  |   ### title / summary / _Source · Code_ metadata / details[] / **Original diagnostic**
  v
MarkdownString (supportHtml=false)  ->  formattedDiagnosticsStore  ->  hover
```

### Key files

| File                                                          | Role                                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/vscode-extension/src/diagnostics.ts`                    | Ingestion, source filter, code normalization, LRU cache. Already admits `gopls` source and passes `code` through. **No changes needed.**               |
| `packages/formatter/src/prettifyGoDiagnostic.ts`              | `parseGoDiagnostic(message): ParsedDiagnostic` — the 20-family `??`-chain. Defines `ParsedDiagnostic` and `ParsedDetail` types. **No changes needed.** |
| `packages/formatter/src/index.ts`                             | Explicit named re-exports of `parseGoDiagnostic`, `ParsedDetail`, `ParsedDiagnostic`.                                                                  |
| `packages/vscode-formatter/src/prettifyDiagnosticForHover.ts` | `prettifyDiagnosticForHover` + `renderParsedDiagnosticForHover`. Family-agnostic renderer. **Seam added here.**                                        |
| `packages/vscode-formatter/src/index.ts`                      | Explicit named re-exports.                                                                                                                             |
| `packages/utils/src/index.ts`                                 | `compactLines`, `escapeMarkdownInlineCode`, `formatGoMethodChain`. Single-file module with direct `export function`.                                   |

### Core types (in `packages/formatter/src/prettifyGoDiagnostic.ts`)

```ts
export type ParsedDetail =
  | { label: string; kind: "code"; value: string; language?: "go" | "text" }
  | { label: string; kind: "text"; value: string }
  | { label: string; kind: "list"; items: string[] };

export interface ParsedDiagnostic {
  family: string;
  title: string;
  summary: string;
  details: ParsedDetail[];
  rawMessage: string;
}
```

### Rendering conventions (family-agnostic, in `prettifyDiagnosticForHover.ts`)

- `### <Title Case title>` — one H3 per hover.
- `summary` — one prose sentence ending with a period.
- Metadata: italic `_Source: <src> . Code: <code>_` (only if source/code present).
- `kind: "code"` detail -> bold label + blank line + fenced block (`go or `text).
- `kind: "text"` detail -> inline bullet `- **Label:** value`.
- `kind: "list"` detail -> bold label + tight `- item` bullets.
- Footer: always `**Original diagnostic**` + ```text fence of `rawMessage`.
- No links, no codicons, no theme colors, no HTML (`supportHtml=false`).

---

## 4. Target architecture

```
vscode.Diagnostic { source: "SA1000", code: "default", message }
  |
  | apps/vscode-extension/src/diagnostics.ts
  |   - isSupportedDiagnostic: source in {compiler, gopls, go list, go test, syntax}
  |     OR unset OR a registered analyzer Name (isSupportedGoplsAnalyzerCode)
  |   - normalizeCode: flattens {value} object form to primitive
  |   - LRU cache keyed by {source, code, message}
  v
vscode-formatter.prettifyDiagnosticForHover({message, source, code})
  |
  | NEW seam in parseDiagnostic():
  |   if source && isSupportedGoplsAnalyzerCode(source):
  |     parseGoplsAnalyzerDiagnostic(source, message)  ->  ParsedDiagnostic | null
  |     if matched -> return it
  |   fall through to parseGoDiagnostic(message)     (existing 20-family chain)
  |
  | renderParsedDiagnosticForHover(parsed, {source, code})   (UNCHANGED except "default" code suppressed)
  v
markdown string
```

Properties:

- Extension app changes only to `isSupportedDiagnostic` (admits registered
  analyzer Names) — zero regression risk to ingestion/cache/hover.
- `parseGoDiagnostic(message)` signature and all 20 existing parsers unchanged.
- Renderer gains one small routing helper; `renderParsedDiagnosticForHover`
  unchanged; `formatMetadata` suppresses the meaningless `"default"` code that
  gopls assigns to analyzer diagnostics.
- Dispatch is source-keyed (mirrors `SUPPORTED_GO_DIAGNOSTIC_SOURCES`) so new
  analyzer ecosystems slot in via a new per-source branch later.

### How gopls tags analyzer diagnostics (verified from gopls source)

From `gopls/internal/cache/analysis.go:1229-1235` and `diagnostics.go:126-130`:
gopls sets `Diagnostic.source` to the **analyzer's Name** (e.g. `"SA1000"`)
and `Diagnostic.code` to `diag.Category` if non-empty, else **`"default"`**.
Staticcheck analyzers never set `Category`, so `code` is always `"default"`.
**Route on `source`, not `code`.** The meaningful identifier (the SA/ST/S code)
lives in `source`.

---

## 5. File-by-file changes

### 5a. `packages/utils/src/index.ts` — add one shared helper

Add a new `export function` directly in this single-file module (no barrel
re-export to change — utils uses direct `export function` declarations):

```ts
export function normalizeDiagnosticCode(
  code: string | number | { value: string | number } | undefined
): string | number | undefined {
  if (typeof code === "string" || typeof code === "number") return code;
  if (code && typeof code === "object" && "value" in code) return code.value;
  return undefined;
}
```

Add tests in `packages/utils/test/utils.test.ts` — a new top-level
`describe("normalizeDiagnosticCode", ...)` with inline cases covering: string,
number, `{ value }` object form, `undefined`, and `null`.

### 5b. `packages/formatter/src/goplsAnalyzers.ts` — NEW file (the registry)

```ts
import { compactLines } from "@pretty-go-errors/utils";
import type { ParsedDetail, ParsedDiagnostic } from "./prettifyGoDiagnostic";

type GoplsAnalyzerParser = (message: string) => ParsedDiagnostic | null;

// Registry keyed by the exact gopls diagnostic `code` (e.g. "SA1000").
const goplsAnalyzerRegistry = new Map<string, GoplsAnalyzerParser>([
  ["SA1000", parseSA1000],
]);

export function parseGoplsAnalyzerDiagnostic(
  code: string,
  message: string
): ParsedDiagnostic | null {
  const parser = goplsAnalyzerRegistry.get(code);
  return parser ? parser(compactLines(message)) : null;
}

export function isSupportedGoplsAnalyzerCode(code: string): boolean {
  return goplsAnalyzerRegistry.has(code);
}

// SA1000 - Invalid regular expression
const SA1000_PATTERN = /^...$/; // MUST be grounded in a real gopls message

function parseSA1000(message: string): ParsedDiagnostic | null {
  const match = message.match(SA1000_PATTERN);
  if (!match) return null;
  const [, pattern, reason] = match;
  return {
    family: "sa1000",
    title: "Invalid regular expression",
    summary:
      "This regular expression cannot be compiled by the regexp package.",
    rawMessage: message,
    details: [
      { label: "Pattern", kind: "code", value: pattern, language: "go" },
      { label: "Reason", kind: "text", value: reason },
    ],
  };
}
```

### 5c. `packages/formatter/src/index.ts` — add explicit named exports

The repo uses **explicit named exports** (not barrel `export *`). Add a second
explicit `export { ... } from "./goplsAnalyzers"` block alongside the existing
one:

```ts
export {
  parseGoDiagnostic,
  type ParsedDetail,
  type ParsedDiagnostic,
} from "./prettifyGoDiagnostic";

export {
  parseGoplsAnalyzerDiagnostic,
  isSupportedGoplsAnalyzerCode,
} from "./goplsAnalyzers";
```

### 5d. `packages/vscode-formatter/src/prettifyDiagnosticForHover.ts` — the seam

Add `isSupportedGoplsAnalyzerCode` to the existing explicit import from the
formatter's `goplsAnalyzers` module, alongside `parseGoplsAnalyzerDiagnostic`.
Then add the routing helper:

```ts
import {
  isSupportedGoplsAnalyzerCode,
  parseGoplsAnalyzerDiagnostic,
} from "../../formatter/src/goplsAnalyzers";

export function prettifyDiagnosticForHover(
  diagnostic: HoverDiagnosticLike
): string {
  const parsed = parseDiagnostic(diagnostic);
  return renderParsedDiagnosticForHover(parsed, diagnostic);
}

// Routes on `source` (the analyzer Name gopls assigns), NOT `code`.
function parseDiagnostic(diagnostic: HoverDiagnosticLike): ParsedDiagnostic {
  if (diagnostic.source && isSupportedGoplsAnalyzerCode(diagnostic.source)) {
    const analyzer = parseGoplsAnalyzerDiagnostic(
      diagnostic.source,
      diagnostic.message
    );
    if (analyzer) return analyzer;
  }
  return parseGoDiagnostic(diagnostic.message);
}
```

Also suppress the meaningless `"default"` code in `formatMetadata`:

```ts
if (code !== undefined && code !== "default") {
  items.push(`Code: ${escapeMarkdownInlineCode(String(code))}`);
}
```

`renderParsedDiagnosticForHover`, `renderDetail`, and `codeBlock` are
**unchanged**.

### 5e. `packages/vscode-formatter/src/index.ts` — re-export the filter helper

Add an explicit re-export so the extension can import it from one package:

```ts
export { isSupportedGoplsAnalyzerCode } from "../../formatter/src/goplsAnalyzers";
```

### 5f. `apps/vscode-extension/src/diagnostics.ts` — admit analyzer sources

Import `isSupportedGoplsAnalyzerCode` from `@pretty-go-errors/vscode-formatter`
and update `isSupportedDiagnostic`:

```ts
function isSupportedDiagnostic(diagnostic: Diagnostic): boolean {
  if (!diagnostic.source) return true;
  if (SUPPORTED_GO_DIAGNOSTIC_SOURCES.has(diagnostic.source)) return true;
  return isSupportedGoplsAnalyzerCode(diagnostic.source);
}
```

Also dedupe the filtered diagnostics in `refreshDiagnosticsForUri` before
formatting, because gopls/VS Code can surface the same diagnostic through more
than one collection and the hover provider would otherwise render each copy as a
separate (identical) hover entry. Keep the first occurrence of each
`{source, code, message, range}` tuple:

```ts
function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  const unique: Diagnostic[] = [];
  for (const diagnostic of diagnostics) {
    const key = diagnosticIdentityKey(diagnostic);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(diagnostic);
  }
  return unique;
}
```

These are the only extension changes (both were made for the SA1000 seed; future
analyzer checks need no further extension changes). Ingestion, cache, and hover
wiring are otherwise unchanged.

### 5g. Tests

**NEW** `packages/formatter/test/goplsAnalyzers.test.ts` — dedicated file for
analyzer parsers (keeps the compiler-chain test file stable as the analyzer
catalog grows):

```ts
import { describe, expect, it } from "vitest";
import { parseGoplsAnalyzerDiagnostic } from "../src";

describe("parseGoplsAnalyzerDiagnostic", () => {
  it("formats SA1000 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1000",
      "<REAL gopls SA1000 message>"
    );
    expect(parsed?.family).toBe("sa1000");
    expect(parsed?.title).toBe("Invalid regular expression");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Pattern", value: "<pattern>" }),
        expect.objectContaining({ label: "Reason", value: "<reason>" }),
      ])
    );
  });

  it("returns null for an unregistered analyzer code", () => {
    expect(parseGoplsAnalyzerDiagnostic("SA9999", "anything")).toBeNull();
  });
});
```

**APPEND** to `packages/vscode-formatter/test/vscode-formatter.test.ts`
(existing single file; one `it` per check):

```ts
it("renders SA1000 diagnostics", () => {
  // Gopls sets source = analyzer Name, code = "default".
  const markdown = prettifyDiagnosticForHover({
    source: "SA1000",
    code: "default",
    message: "<REAL gopls SA1000 message>",
  });
  expect(markdown).toContain("### Invalid regular expression");
  expect(markdown).toContain("Source: SA1000");
  expect(markdown).not.toContain("Code:"); // "default" is suppressed
  expect(markdown).toContain("**Pattern**");
  expect(markdown).toContain("**Original diagnostic**");
});

it("falls back cleanly when a gopls analyzer source is unregistered", () => {
  const markdown = prettifyDiagnosticForHover({
    source: "SA9999",
    message: "mystery analyzer message",
  });
  expect(markdown).toContain("### Go diagnostic");
  expect(markdown).toContain("mystery analyzer message");
});
```

Plus a **seam-integrity test**: a compiler-style message (e.g.
`cannot use value (value of type int) as string value in assignment`) with
`source: "compiler"` must still render as `### Type mismatch` — proving the
seam doesn't regress passthrough compiler diagnostics.

**APPEND** to `packages/utils/test/utils.test.ts` — cases for
`normalizeDiagnosticCode`.

---

## 6. The repeatable recipe (parameterized by `{ID}`, `{title}`)

1. **Verify the identity.** Fetch `https://staticcheck.dev/docs/checks/#{ID}`.
   Use the page's title (not the passed-in `{title}`) — correct it if they
   differ. (Example: "Invalid standard library usage" is the SA1 _group_ label,
   not SA1000's title, which is "Invalid regular expression".)

2. **Capture the real gopls message.** Reproduce in VS Code with gopls, or read
   the analyzer source in `github.com/dominikh/go-tools`
   (`staticcheck/{lower-id}`). Record 1-2 representative messages verbatim and
   cite the source. **Never guess message text.**

3. **Add the parser** in `packages/formatter/src/goplsAnalyzers.ts`:
   - Hoisted regex `const {ID}_PATTERN = /^...$/` (UPPER_SNAKE `_PATTERN`)
     anchored to the real message.
   - `function parse{ID}(message): ParsedDiagnostic | null` returning `null`
     on no match.
   - `family: "{id-lowercased}"`, Title-Case `title`, one-sentence `summary`
     ending in a period, `rawMessage: message`, `details[]` using existing
     `code`/`text`/`list` kinds with `language: "go" | "text"`.
   - **Add an actionable Hint where possible.** Beyond decomposing the message
     into labeled fields, include an optional `kind: "text"` detail labeled
     `Hint` that gives plain-English, actionable guidance the reader can apply
     without leaving the hover. When the analyzer has a closed set of sub-causes
     (e.g. SA1000 maps each `regexp/syntax` error code to a fix), use a small
     `<ID>_<CAUSE>_HINTS` `Record<string, string>` map keyed by the sub-cause
     and only push the `Hint` detail when a mapping exists. Add a test asserting
     the hint for a mapped cause AND a test asserting the hint is omitted for an
     unmapped one. This is the difference between "the original message, relabeled"
     and a diagnostic that actually teaches the reader.

4. **Register**: add `["{ID}", parse{ID}]` to `goplsAnalyzerRegistry`. The key
   is the analyzer Name, which gopls assigns to `Diagnostic.source`.

5. **Tests (Red first)**: one `it("formats {ID} diagnostics", ...)` in
   `goplsAnalyzers.test.ts`; one `it("renders {ID} diagnostics", ...)` in
   `vscode-formatter.test.ts`. Use the real message literal,
   `source: "{ID}"`, `code: "default"` (and assert `not.toContain("Code:")`
   since "default" is suppressed).

6. **Green**: implement; run the two package test scripts.

7. **Refactor**: check naming, hoist regex if shared, run lint + format.

8. **Docs**: bump the README "diagnostics and counting" count; add a CHANGELOG
   entry.

9. **Gate**: `npm run ready` (test + lint + format:check + build) must be green.

---

## 7. TDD Red/Green/Refactor workflow

**Red** — write tests first:

- `packages/formatter/test/goplsAnalyzers.test.ts`: the `formats SA1000` test
  - the `returns null for unregistered code` test.
- `packages/vscode-formatter/test/vscode-formatter.test.ts`: the `renders SA1000`
  test + the `falls back cleanly when unregistered` test + the seam-integrity
  test (gopls compiler-style passthrough still works).
- `packages/utils/test/utils.test.ts`: `normalizeDiagnosticCode` cases.
- Run `npm test -w @pretty-go-errors/formatter` and
  `npm test -w @pretty-go-errors/vscode-formatter` — all new SA1000 tests fail
  (no parser/registry/seam). The negative/seam-integrity tests pass trivially
  and later guard against regressions.

**Green** — implement:

- Add `normalizeDiagnosticCode` to `packages/utils/src/index.ts`.
- Create `packages/formatter/src/goplsAnalyzers.ts` (parser + registry).
- Update `packages/formatter/src/index.ts` with explicit named exports.
- Add the `parseDiagnostic` seam + import updates in
  `packages/vscode-formatter/src/prettifyDiagnosticForHover.ts`.
- Tests pass.

**Refactor**:

- Ensure `normalizeDiagnosticCode` is used in both the seam and
  `formatMetadata` (no duplicated normalization logic).
- Confirm naming conventions, regex hoisting.
- Run `npm run ready`.

---

## 8. SA1000 seed (grounding)

- **Identity**: SA1000 = "Invalid regular expression" — flags unparseable
  regexes passed to `regexp.Compile`/`MustCompile`/`regexp.CompilePOSIX` etc.
  Available since staticcheck 2017.1.
- **gopls fields**: `source = "SA1000"` (analyzer Name), `code = "default"`,
  `message` = the verbatim `regexp/syntax.Error.Error()` output:
  `error parsing regexp: <reason>: \`<pattern>\``(e.g.`error parsing regexp: missing closing ): \`(\``). The "Invalid regular
  expression" phrase is the analyzer _title_ and does NOT appear in the message.
- **`details`**: `Pattern` (code/text) + `Reason` (text).
- **`family`**: `"sa1000"`.
- **`title`**: `"Invalid regular expression"`.
- **`summary`**: `"This regular expression cannot be compiled by the regexp
package."`
- This seed validates the entire recipe end-to-end (registry + seam + filter +
  tests + docs).

---

## 9. Scout prompt template (copy-paste, parameterized)

```
You are implementing support for ONE Gopls analyzer diagnostic in the
pretty-go-errors repo (TS VS Code extension, Vitest).
ID: {ID}. Provisional title: {title}.

STEP 1 - VERIFY IDENTITY
- Fetch https://staticcheck.dev/docs/checks/#{ID}. Use the title printed
  there; ignore the provisional title if it differs. Note the one-line
  description.

STEP 2 - CAPTURE THE REAL gopls MESSAGE (do not skip, do not guess)
- Either reproduce the diagnostic in VS Code with gopls and copy the exact
  `message` text, or read the analyzer source in
  github.com/dominikh/go-tools (staticcheck/{lower-id}). Record 1-2
  representative messages VERBATIM and cite the source URL/file. The regex
  must match these.
- NOTE: gopls sets Diagnostic.source = analyzer Name ("{ID}") and
  Diagnostic.code = "default". The analyzer title does NOT appear in the
  message. Route on `source`, never on `code`.

STEP 3 - IMPLEMENT following the established pattern
- File: packages/formatter/src/goplsAnalyzers.ts
  - Add `const {ID}_PATTERN = /^...$/` anchored to the real message(s).
  - Add `function parse{ID}(message: string): ParsedDiagnostic | null`
    returning null on no match.
    family: "{id-lowercased}"; title: the verified title; summary: one
    sentence ending in a period; rawMessage: message; details[] using kind
    "code" (language "go"|"text") / "text" / "list".
  - Register: add ["{ID}", parse{ID}] to goplsAnalyzerRegistry. The key is
    the analyzer Name (gopls assigns it to `source`); NO other wiring is
    needed — the seam and extension filter dispatch on `source` via
    isSupportedGoplsAnalyzerCode automatically.
- Update packages/formatter/src/index.ts with explicit named exports for the
  new symbols (do NOT use barrel `export *`).
- Do NOT touch packages/formatter/src/prettifyGoDiagnostic.ts.
- Do NOT touch apps/vscode-extension (the filter already admits any
  registered analyzer Name via isSupportedGoplsAnalyzerCode).
- Do NOT touch the renderer seam (it already routes on `source`).

STEP 4 - TESTS (Red first, then Green)
- packages/formatter/test/goplsAnalyzers.test.ts: add
  `it("formats {ID} diagnostics", ...)` asserting family/title/details via
  arrayContaining/objectContaining, using the real message.
- packages/vscode-formatter/test/vscode-formatter.test.ts: add
  `it("renders {ID} diagnostics", ...)` with source: "{ID}", code: "default",
  asserting ### title, Source: {ID}, NOT toContain("Code:"), a detail label,
  and **Original diagnostic** (toContain).
- Inline message literals only. No fixtures, snapshots, .go files,
  beforeEach, or describe.each.

STEP 5 - GUARDRAILS (hard)
- family = lowercased code. No links, no codicons, no colors, no HTML.
  Preserve rawMessage.
- Use only existing ParsedDetail kinds. New files only in
  goplsAnalyzers.ts / goplsAnalyzers.test.ts.
- Ground the regex in the cited real message.
- Use explicit named exports in index.ts (not barrel export *).
- Route on `source` (analyzer Name). Never assume `source === "gopls"` or
  that the analyzer code is in `code` (it is "default").

STEP 6 - VERIFY & REPORT
- Run: npm test -w @pretty-go-errors/formatter;
  npm test -w @pretty-go-errors/vscode-formatter;
  npm run lint; npm run format:check; npm run build (or npm run ready).
- Bump README "diagnostics and counting" count; add a CHANGELOG line.
- Report: verified title, the real message(s) + source citation, files
  changed, and test output.
```

---

## 10. Guardrails

**DO**

- Match on `source` (the analyzer Name gopls assigns, e.g. "SA1000") via
  `goplsAnalyzerRegistry`; ground every regex in a cited real gopls message.
- `family` = lowercased code (`sa1000`); Title-Case `title`; one-sentence
  `summary` with period.
- Keep `rawMessage` = original (post-`compactLines`) so the
  `**Original diagnostic**` footer works.
- Use existing `ParsedDetail` kinds (`code`/`text`/`list`), `language:
"go" | "text"`.
- Naming: `parse{ID}`, `{ID}_PATTERN`, registry entry `["{ID}", parse{ID}]`.
- Tests: inline literals; `arrayContaining`/`objectContaining` (formatter),
  `toContain` (renderer).
- Add a fallback test (unregistered code) + a seam-integrity test (gopls
  compiler-style passthrough).
- Use explicit named exports in `index.ts` files (not barrel `export *`).
- Run `npm run ready` before declaring done; bump README count + CHANGELOG.

**DON'T**

- Don't pattern-match analyzer messages inside the compiler `??`-chain.
- Don't change `parseGoDiagnostic`'s signature or the 20 existing
  parsers/tests.
- Don't modify `apps/vscode-extension` for new analyzer checks — the filter
  (`isSupportedDiagnostic`) already admits any registered analyzer Name via
  `isSupportedGoplsAnalyzerCode`, so adding a registry entry is sufficient.
  (The SA1000 seed made the one-time filter change; future checks need none.)
- Don't add links, codicons, theme colors, or rely on HTML
  (`supportHtml=false`).
- Don't add new `ParsedDetail` kinds/languages, fixtures, snapshots, `.go`
  files, `beforeEach`, or `describe.each`.
- Don't guess message text or titles — always verify against staticcheck docs
  - real gopls output.
- Don't use barrel `export *` — follow the explicit named export convention.

---

## 11. Verification commands

```bash
npm test -w @pretty-go-errors/formatter
npm test -w @pretty-go-errors/vscode-formatter
npm test -w @pretty-go-errors/utils
npm run lint            # tsc --noEmit across workspaces
npm run format:check
npm run build
npm run ready           # full gate: test + lint + format:check + build
```

---

## 12. Documentation sync

- `apps/vscode-extension/README.md:51` — update "21 error diagnostics and
  counting" and add a line for Gopls analyzer (SA-series) support at `:52`.
- `apps/vscode-extension/CHANGELOG.md` — add entry under the next version.
- `SUPPORT.md:10` — no change (gopls already listed as a source).
- Root `README.md` scope section — optionally note analyzer support as a new
  capability.

---

## 13. Future extension path (per-source generalization)

The dispatch is source-keyed to mirror `SUPPORTED_GO_DIAGNOSTIC_SOURCES`.
Adding a new analyzer ecosystem that arrives via a not-yet-admitted source
(e.g. `go vet`) requires, in order:

1. Add the source string to `SUPPORTED_GO_DIAGNOSTIC_SOURCES`
   (`apps/vscode-extension/src/diagnostics.ts:14`).
2. Add a per-source registry module (e.g. `goVetAnalyzers.ts`) +
   `parseGoVetAnalyzerDiagnostic(code, message)`.
3. Add one branch in the renderer's `parseDiagnostic` for that source.
   (If a third source appears, refactor `parseDiagnostic` into a
   `parseGoDiagnosticForSource(source, code, message)` living in the
   formatter, so all routing centralizes there — optional now, recommended
   then.)

---

## 14. Out of scope for this milestone

- Docs/"Learn more" links, codicons, theme colors, HTML.
- `range`/location-carrying related-information on `ParsedDetail`.
- Non-staticcheck gopls analyzers (ST/S/QF series) — same recipe applies
  later via new registry entries.
- Consolidating the extension's private `normalizeCode` into the shared utils
  helper (optional follow-up).
- Sidebar/webview functionality (deferred per root README).
