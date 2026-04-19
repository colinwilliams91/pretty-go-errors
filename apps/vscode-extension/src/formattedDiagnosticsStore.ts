import type { MarkdownString, Range } from "vscode";

export interface FormattedDiagnostic {
  range: Range;
  contents: MarkdownString[];
}

export const formattedDiagnosticsStore = new Map<
  string,
  FormattedDiagnostic[]
>();
