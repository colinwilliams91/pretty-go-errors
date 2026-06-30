import { compactLines } from "../../utils/src/index";
import type { ParsedDiagnostic } from "./prettifyGoDiagnostic";

type GoplsAnalyzerParser = (message: string) => ParsedDiagnostic | null;

// Registry keyed by the Gopls analyzer Name (e.g. "SA1000"). Gopls sets
// `Diagnostic.source` to the analyzer's Name and `code` to "default" (or the
// analyzer's Category, which Staticcheck never sets), so routing is on
// `source`, NOT `code`. See docs/gopls-analyzer-diagnostics-plan.md.
// Add a new analyzer by: (1) writing a parse<Code> function below,
// (2) registering it here, (3) adding tests.
const goplsAnalyzerRegistry = new Map<string, GoplsAnalyzerParser>([
  ["SA1000", parseSA1000],
]);

export function parseGoplsAnalyzerDiagnostic(
  analyzerName: string,
  message: string
): ParsedDiagnostic | null {
  const parser = goplsAnalyzerRegistry.get(analyzerName);
  return parser ? parser(compactLines(message)) : null;
}

export function isSupportedGoplsAnalyzerCode(analyzerName: string): boolean {
  return goplsAnalyzerRegistry.has(analyzerName);
}

// SA1000 - Invalid regular expression
//
// Gopls/Staticcheck forward the verbatim error from regexp.Compile, whose
// format (from regexp/syntax.Error.Error) is:
//   error parsing regexp: <reason>: `<pattern>`
// The <reason> is a regexp/syntax error code string and may itself contain a
// colon (e.g. "regexp/syntax: internal error"), so the reason group is greedy
// and anchored on the trailing `: `<pattern>` suffix.
const SA1000_PATTERN = /^error parsing regexp: ([^\n]+): `([\s\S]+)`$/;

// Plain-English, actionable hints for each regexp/syntax error code. The set
// is closed (see regexp/syntax.ErrorCode in the Go standard library), so a
// small map turns the terse compiler phrasing into something a reader can act
// on without leaving the hover.
const SA1000_REASON_HINTS: Record<string, string> = {
  "regexp/syntax: internal error":
    "This is a bug in the regexp engine, not your code. Try simplifying the pattern.",
  "invalid character class":
    "Character classes `[...]` must contain valid members.",
  "invalid character class range":
    "In a range like `a-z`, the start code point must be <= the end.",
  "invalid escape sequence":
    "Use a valid escape (`\\d`, `\\w`, `\\s`, `\\b`, `\\A`, `\\z`, ...) or escape a literal backslash as `\\\\`.",
  "invalid named capture":
    "Named captures use the syntax `(?P<name>...)` (or `(?<name>...)`).",
  "invalid or unsupported Perl syntax":
    "Go's regexp engine (RE2) does not support backreferences or lookaround. See the regexp syntax documentation.",
  "invalid nested repetition operator":
    "A repeat operator (`*`, `+`, `?`, `{...}`) cannot immediately follow another repeat operator.",
  "invalid repeat count":
    "In a repeat like `{n,m}`, the counts must be non-negative and `n` must be <= `m`.",
  "invalid UTF-8": "The pattern contains invalid UTF-8 bytes.",
  "missing closing ]": "The character class `[` has no matching `]`.",
  "missing closing )": "There is an unbalanced `(` with no matching `)`.",
  "missing argument to repetition operator":
    "A repeat operator (`*`, `+`, `?`, `{...}`) needs something to repeat.",
  "trailing backslash at end of expression":
    "The pattern ends with a lone `\\`; escape it as `\\\\` or remove it.",
  "unexpected )": "There is a `)` with no matching `(`.",
  "expression nests too deeply":
    "The pattern is too deeply nested; simplify it so the engine can compile it.",
  "expression too large":
    "The pattern is too long or complex for the engine to compile; simplify it.",
};

function parseSA1000(message: string): ParsedDiagnostic | null {
  const match = message.match(SA1000_PATTERN);
  if (!match) {
    return null;
  }

  const [, reason, pattern] = match;
  const details: ParsedDiagnostic["details"] = [
    { label: "Pattern", kind: "code", value: pattern, language: "text" },
    { label: "Reason", kind: "text", value: reason },
  ];

  const hint = SA1000_REASON_HINTS[reason];
  if (hint) {
    details.push({ label: "Hint", kind: "text", value: hint });
  }

  return {
    family: "sa1000",
    title: "Invalid regular expression",
    summary:
      "This regular expression cannot be compiled by the regexp package.",
    rawMessage: message,
    details,
  };
}
