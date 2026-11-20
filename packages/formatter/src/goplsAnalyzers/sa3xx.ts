import type { ParsedDiagnostic } from "../prettifyGoDiagnostic";
import type { GoplsAnalyzerParser } from "./types";

// SA3 - Testing issues (staticcheck).

// SA3000 - `TestMain` doesn't call `os.Exit`, hiding test failures.
//
// Source: staticcheck/sa3000/sa3000.go:50. Static message.
const SA3000_PATTERN = /^TestMain should call os\.Exit to set exit code$/;

function parseSA3000(message: string): ParsedDiagnostic | null {
  const match = message.match(SA3000_PATTERN);
  if (!match) {
    return null;
  }

  return {
    family: "sa3000",
    title: "`TestMain` doesn't call `os.Exit`, hiding test failures",
    summary:
      "Without a final os.Exit, TestMain can return before the tests' exit code is propagated, hiding failures.",
    rawMessage: message,
    details: [
      {
        label: "Suggested pattern",
        kind: "code",
        value: "func TestMain(m *testing.M) {\n\tos.Exit(m.Run())\n}",
        language: "go",
      },
      {
        label: "Hint",
        kind: "text",
        value:
          "End TestMain with `os.Exit(m.Run())` so the test binary exits with the code reported by the tests.",
      },
    ],
  };
}

export const sa3xxParsers: Record<string, GoplsAnalyzerParser> = {
  SA3000: parseSA3000,
};
