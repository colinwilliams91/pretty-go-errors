import type { ParsedDiagnostic } from "../prettifyGoDiagnostic";
import type { GoplsAnalyzerParser } from "./types";

// SA9 - Dubious code (staticcheck).

// SA9001 - Defers in range loops may not run when you expect them to
//
// Source: staticcheck/sa9001/sa9001.go:71. The message is static; there is no
// dynamic part to extract.
const SA9001_PATTERN =
  /^defers in this range loop won't run unless the channel gets closed$/;

function parseSA9001(message: string): ParsedDiagnostic | null {
  const match = message.match(SA9001_PATTERN);
  if (!match) {
    return null;
  }

  return {
    family: "sa9001",
    title: "Defers in range loops may not run when you expect them to",
    summary:
      "Deferred calls in a range loop do not run at the end of each iteration, only when the enclosing function returns.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Defer inside a function called from the loop body so each iteration's cleanup runs, or close the channel and let the defers run when the enclosing function returns.",
      },
    ],
  };
}

// SA9002 - Using a non-octal `os.FileMode` that looks like it was meant to be
// in octal
//
// Source: staticcheck/sa9002/sa9002.go:61. The template is:
//   file mode '%s' evaluates to %#o; did you mean '0%s'?
// The analyzer only reports three-digit literals of octal digits 0-7 that do
// not start with 0, so the literal group is exactly three such digits and the
// suggested form is always `0` + literal. `%#o` renders the evaluated value
// with a legacy leading `0` (e.g. `01411`); tolerate an `0o` prefix in case a
// future Go toolchain changes the `%#o` rendering.
const SA9002_PATTERN =
  /^file mode '([0-7]{3})' evaluates to (0o?[0-7]+); did you mean '0\1'\?$/;

function parseSA9002(message: string): ParsedDiagnostic | null {
  const match = message.match(SA9002_PATTERN);
  if (!match) {
    return null;
  }

  const [, literal, evaluated] = match;
  return {
    family: "sa9002",
    title:
      "Using a non-octal `os.FileMode` that looks like it was meant to be in octal",
    summary:
      "The file mode literal is decimal, so it sets different permission bits than the octal value it appears to represent.",
    rawMessage: message,
    details: [
      { label: "Mode literal", kind: "code", value: literal, language: "text" },
      {
        label: "Evaluated mode",
        kind: "code",
        value: evaluated,
        language: "text",
      },
      {
        label: "Intended mode",
        kind: "code",
        value: `0${literal}`,
        language: "go",
      },
      {
        label: "Hint",
        kind: "text",
        value:
          "Write file modes with the 0o prefix (for example 0o644) or a leading 0 so the digits are interpreted as octal.",
      },
    ],
  };
}

export const sa9xxParsers: Record<string, GoplsAnalyzerParser> = {
  SA9001: parseSA9001,
  SA9002: parseSA9002,
};
