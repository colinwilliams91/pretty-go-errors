import { compactLines } from "../../../utils/src/index";
import type { ParsedDiagnostic } from "../prettifyGoDiagnostic";
import type { GoplsAnalyzerParser } from "./types";
import { sa1xxParsers } from "./sa1xx";
import { sa2xxParsers } from "./sa2xx";
import { sa3xxParsers } from "./sa3xx";
import { sa4xxParsers } from "./sa4xx";
import { sa5xxParsers } from "./sa5xx";
import { sa6xxParsers } from "./sa6xx";
import { sa9xxParsers } from "./sa9xx";

// Registry keyed by the Gopls analyzer Name (e.g. "SA1000"). Gopls sets
// `Diagnostic.source` to the analyzer's Name and `code` to "default" (or the
// analyzer's Category, which Staticcheck never sets), so routing is on
// `source`, NOT `code`. See docs/gopls-analyzer-diagnostics-plan.md.
// Add a new analyzer by: (1) adding a parser to the check's category file
// (e.g. sa1xx.ts) and registering it in that file's exported parsers map,
// (2) adding tests, (3) grounding the regex in a real message (see
// docs/staticcheck-message-grounding.md).
const goplsAnalyzerRegistry = new Map<string, GoplsAnalyzerParser>([
  ...Object.entries(sa1xxParsers),
  ...Object.entries(sa2xxParsers),
  ...Object.entries(sa3xxParsers),
  ...Object.entries(sa4xxParsers),
  ...Object.entries(sa5xxParsers),
  ...Object.entries(sa6xxParsers),
  ...Object.entries(sa9xxParsers),
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
