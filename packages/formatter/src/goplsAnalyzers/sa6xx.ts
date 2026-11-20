import type { ParsedDiagnostic } from "../prettifyGoDiagnostic";
import type { GoplsAnalyzerParser } from "./types";

// SA6 - Performance issues (staticcheck).

// SA6000 - Using `regexp.Match` or related in a loop, should use `regexp.Compile`
//
// Source: staticcheck/sa6000/sa6000.go (`call.Invalid`). The only dynamic part
// is the called function, which is always one of regexp.Match,
// regexp.MatchReader, or regexp.MatchString.
const SA6000_PATTERN =
  /^calling (regexp\.Match(?:Reader|String)?) in a loop has poor performance, consider using regexp\.Compile$/;

function parseSA6000(message: string): ParsedDiagnostic | null {
  const match = message.match(SA6000_PATTERN);
  if (!match) {
    return null;
  }

  const [, function_] = match;
  return {
    family: "sa6000",
    title:
      "Using `regexp.Match` or related in a loop, should use `regexp.Compile`",
    summary:
      "The regular expression is recompiled on every iteration of the loop.",
    rawMessage: message,
    details: [
      { label: "Function", kind: "code", value: function_, language: "go" },
      {
        label: "Hint",
        kind: "text",
        value:
          "Compile the regular expression once outside the loop with regexp.Compile and reuse the returned *regexp.Regexp.",
      },
    ],
  };
}

// SA6002 - Storing non-pointer values in `sync.Pool` allocates memory
//
// Source: staticcheck/sa6002/sa6002.go (`arg.Invalid`). The message is
// static; there is no dynamic part to extract.
const SA6002_PATTERN = /^argument should be pointer-like to avoid allocations$/;

function parseSA6002(message: string): ParsedDiagnostic | null {
  const match = message.match(SA6002_PATTERN);
  if (!match) {
    return null;
  }

  return {
    family: "sa6002",
    title: "Storing non-pointer values in `sync.Pool` allocates memory",
    summary:
      "Passing a non-pointer value to a sync.Pool forces an allocation that the pool was meant to avoid.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Store a pointer (for example &myStruct or &slice[0]) in the pool instead of the value itself.",
      },
    ],
  };
}

// SA6005 - Inefficient string comparison with `strings.ToLower` or `strings.ToUpper`
//
// Source: staticcheck/sa6005/sa6005.go:73. The suggested replacement is always
// strings.EqualFold, prefixed with `!` when the original comparison was `!=`.
const SA6005_PATTERN = /^should use (!?strings\.EqualFold) instead$/;

function parseSA6005(message: string): ParsedDiagnostic | null {
  const match = message.match(SA6005_PATTERN);
  if (!match) {
    return null;
  }

  const [, replacement] = match;
  return {
    family: "sa6005",
    title:
      "Inefficient string comparison with `strings.ToLower` or `strings.ToUpper`",
    summary:
      "Lowercasing or uppercasing both strings to compare them allocates and is slower than a case-insensitive comparison.",
    rawMessage: message,
    details: [
      {
        label: "Replacement",
        kind: "code",
        value: replacement,
        language: "go",
      },
      {
        label: "Hint",
        kind: "text",
        value:
          "Compare the strings case-insensitively with strings.EqualFold instead of converting both sides with strings.ToLower or strings.ToUpper.",
      },
    ],
  };
}

export const sa6xxParsers: Record<string, GoplsAnalyzerParser> = {
  SA6000: parseSA6000,
  SA6002: parseSA6002,
  SA6005: parseSA6005,
};
