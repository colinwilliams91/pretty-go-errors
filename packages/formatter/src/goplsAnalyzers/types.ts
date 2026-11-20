import type { ParsedDiagnostic } from "../prettifyGoDiagnostic";

export type GoplsAnalyzerParser = (message: string) => ParsedDiagnostic | null;
