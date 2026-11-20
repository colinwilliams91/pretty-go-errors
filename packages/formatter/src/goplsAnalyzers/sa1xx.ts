import type { GoplsAnalyzerParser } from "./types";
import type { ParsedDiagnostic } from "../prettifyGoDiagnostic";

// SA1 - Standard library misuse (staticcheck).
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

// SA1002 - Invalid format in `time.Parse`
//
// Gopls/Staticcheck forward the verbatim error from time.Parse, whose format
// (from time.ParseError.Error) has two shapes (verified against Go 1.27; the
// analyzer calls time.Parse(s, s) so the value doubles as the layout):
//   parsing time "<value>" as "<layout>": cannot parse "<valueElem>" as "<layoutElem>"
//   parsing time "<value>": <message>            (e.g. `extra text: "07:00"`)
// The trailing detail may itself contain quotes and colons, so it is captured
// greedily to the end of the message.
const SA1002_PARSE_PATTERN = /^parsing time "([^"]*)" as "([^"]*)": ([\s\S]+)$/;
const SA1002_MESSAGE_PATTERN = /^parsing time "([^"]*)": ([\s\S]+)$/;

const SA1002_SUMMARY =
  "The layout string cannot parse the value because its elements do not line up with Go's reference-time layout.";

// Actionable hints keyed by the leading phrase of the forwarded time.Parse
// error, with a general fallback for anything else.
const SA1002_DETAIL_HINTS: Record<string, string> = {
  "extra text":
    "The layout contains characters the value does not (e.g. a zone indicator like `Z07:00` glued onto it); every part of the layout must either be a reference-time element or appear verbatim in the value.",
  "cannot parse":
    "The value does not match the layout element shown; describe the value with reference-time elements such as `2006`, `01` and `02`.",
  "out of range":
    "The value contains a component (month, day, hour, ...) outside its valid range; fix the value rather than the layout.",
};

const SA1002_DEFAULT_HINT =
  "Go layouts must use the reference time `Mon Jan 2 15:04:05 MST 2006`; every layout element has to match the value exactly.";

function sa1002HintFor(detail: string): string {
  const key = detail.startsWith("extra text")
    ? "extra text"
    : detail.startsWith("cannot parse")
      ? "cannot parse"
      : / out of range\b/.test(detail)
        ? "out of range"
        : undefined;
  return (key !== undefined && SA1002_DETAIL_HINTS[key]) || SA1002_DEFAULT_HINT;
}

function parseSA1002(message: string): ParsedDiagnostic | null {
  const asParse = message.match(SA1002_PARSE_PATTERN);
  if (asParse) {
    const [, value, layout, detail] = asParse;
    return {
      family: "sa1002",
      title: "Invalid format in `time.Parse`",
      summary: SA1002_SUMMARY,
      rawMessage: message,
      details: [
        { label: "Value", kind: "code", value, language: "text" },
        { label: "Layout", kind: "code", value: layout, language: "text" },
        { label: "Parse error", kind: "text", value: detail },
        { label: "Hint", kind: "text", value: sa1002HintFor(detail) },
      ],
    };
  }

  const messageOnly = message.match(SA1002_MESSAGE_PATTERN);
  if (messageOnly) {
    const [, value, detail] = messageOnly;
    return {
      family: "sa1002",
      title: "Invalid format in `time.Parse`",
      summary: SA1002_SUMMARY,
      rawMessage: message,
      details: [
        { label: "Value", kind: "code", value, language: "text" },
        { label: "Parse error", kind: "text", value: detail },
        { label: "Hint", kind: "text", value: sa1002HintFor(detail) },
      ],
    };
  }

  return null;
}

// SA1004 - Suspiciously small untyped constant in `time.Sleep`
const SA1004_PATTERN =
  /^sleeping for (\d+) nanoseconds is probably a bug; be explicit if it isn't$/;

function parseSA1004(message: string): ParsedDiagnostic | null {
  const match = message.match(SA1004_PATTERN);
  if (!match) {
    return null;
  }

  const [, nanoseconds] = match;
  return {
    family: "sa1004",
    title: "Suspiciously small untyped constant in `time.Sleep`",
    summary:
      "A bare number sleeps for that many nanoseconds, which is almost never what was intended.",
    rawMessage: message,
    details: [
      {
        label: "Nanoseconds",
        kind: "code",
        value: nanoseconds,
        language: "go",
      },
      {
        label: "Hint",
        kind: "text",
        value:
          "Use a duration expression such as `5 * time.Second`, or write `5 * time.Nanosecond` if a nanosecond-scale sleep really was intended.",
      },
    ],
  };
}

// SA1006 - `Printf` with dynamic first argument and no further arguments
const SA1006_PATTERN =
  /^printf-style function with dynamic format string and no further arguments should use print-style function instead$/;

function parseSA1006(message: string): ParsedDiagnostic | null {
  if (!SA1006_PATTERN.test(message)) {
    return null;
  }

  return {
    family: "sa1006",
    title: "`Printf` with dynamic first argument and no further arguments",
    summary:
      "A printf-style function is called with a dynamic format string and no further arguments, so verb sequences in the string would be interpreted as formatting directives.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          'Drop the trailing `f` from the function name (e.g. `fmt.Printf` becomes `fmt.Print`), or print the string as data with `fmt.Printf("%s", s)`; for `fmt.Errorf`, use `errors.New` instead.',
      },
    ],
  };
}

// SA1008 - Non-canonical key in `http.Header` map
const SA1008_PATTERN =
  /^keys in http\.Header are canonicalized, "([^"]*)" is not canonical; fix the constant or use http\.CanonicalHeaderKey$/;

// Mirrors net/textproto.CanonicalMIMEHeaderKey for well-formed header keys:
// uppercase the first letter and every letter after a `-`, lowercase the rest.
function canonicalizeHeaderKey(key: string): string {
  let canonical = "";
  let uppercaseNext = true;
  for (const char of key) {
    if (char === "-") {
      uppercaseNext = true;
      canonical += char;
      continue;
    }
    canonical += uppercaseNext ? char.toUpperCase() : char.toLowerCase();
    uppercaseNext = false;
  }
  return canonical;
}

function parseSA1008(message: string): ParsedDiagnostic | null {
  const match = message.match(SA1008_PATTERN);
  if (!match) {
    return null;
  }

  const [, key] = match;
  return {
    family: "sa1008",
    title: "Non-canonical key in `http.Header` map",
    summary:
      "This http.Header map is indexed with a key that is not in canonical form, so entries can be silently duplicated or missed.",
    rawMessage: message,
    details: [
      { label: "Header key", kind: "code", value: key, language: "text" },
      {
        label: "Canonical form",
        kind: "code",
        value: canonicalizeHeaderKey(key),
        language: "text",
      },
      {
        label: "Hint",
        kind: "text",
        value:
          "Wrap the key in `http.CanonicalHeaderKey`, or fix the constant to its canonical form so map lookups find the entry.",
      },
    ],
  };
}

// SA1012 - A nil `context.Context` is being passed to a function, consider
// using `context.TODO` instead
const SA1012_PATTERN =
  /^do not pass a nil Context, even if a function permits it; pass context\.TODO if you are unsure about which Context to use$/;

function parseSA1012(message: string): ParsedDiagnostic | null {
  if (!SA1012_PATTERN.test(message)) {
    return null;
  }

  return {
    family: "sa1012",
    title:
      "A nil `context.Context` is being passed to a function, consider using `context.TODO` instead",
    summary:
      "A nil context.Context is being passed to a function, which the context package forbids.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Replace the `nil` argument with `context.TODO` when unsure which context to use, or with `context.Background` for top-level code.",
      },
    ],
  };
}

// SA1015 - Using `time.Tick` in a way that will leak. Consider using
// `time.NewTicker`, and only use `time.Tick` in tests, commands and endless
// functions
const SA1015_PATTERN =
  /^using time\.Tick leaks the underlying ticker, consider using it only in endless functions, tests and the main package, and use time\.NewTicker here$/;

function parseSA1015(message: string): ParsedDiagnostic | null {
  if (!SA1015_PATTERN.test(message)) {
    return null;
  }

  return {
    family: "sa1015",
    title:
      "Using `time.Tick` in a way that will leak. Consider using `time.NewTicker`, and only use `time.Tick` in tests, commands and endless functions",
    summary:
      "time.Tick creates a ticker that cannot be stopped, so using it here leaks the underlying ticker before Go 1.23.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Create the ticker with `time.NewTicker` and call its `Stop` method when done, or keep `time.Tick` in tests, commands and endless functions only.",
      },
    ],
  };
}

// SA1017 - Channels used with `os/signal.Notify` should be buffered
const SA1017_PATTERN =
  /^the channel used with signal\.Notify should be buffered$/;

function parseSA1017(message: string): ParsedDiagnostic | null {
  if (!SA1017_PATTERN.test(message)) {
    return null;
  }

  return {
    family: "sa1017",
    title: "Channels used with `os/signal.Notify` should be buffered",
    summary:
      "The channel passed to signal.Notify is unbuffered, so signals can be dropped when no receiver is ready.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Create the channel with a buffer, e.g. `signals := make(chan os.Signal, 1)`, so delivered signals are not dropped.",
      },
    ],
  };
}

// SA1019 - Using a deprecated function, variable, constant or field
//
// The four report formats alias-match each other (a template-1 message also
// matches the template-2 pattern with the reason clause swallowed by the
// version group, and a template-3 message matches it with the alternative
// clause swallowed), so the patterns are tried most-specific first:
// never-use, alternative-available, plain-since, plain.
const SA1019_NEVER_USE_PATTERN =
  /^([\s\S]+?) has been deprecated since (.+?) because it shouldn't be used: ([\s\S]+)$/;
const SA1019_ALTERNATIVE_PATTERN =
  /^([\s\S]+?) has been deprecated since (.+?) and an alternative has been available since (.+?): ([\s\S]+)$/;
const SA1019_SINCE_PATTERN =
  /^([\s\S]+?) has been deprecated since (.+?): ([\s\S]+)$/;
const SA1019_PLAIN_PATTERN = /^([\s\S]+?) is deprecated: ([\s\S]+)$/;

const SA1019_SUMMARY =
  "This code references an API that is marked as deprecated.";

function parseSA1019(message: string): ParsedDiagnostic | null {
  const build = (
    api: string,
    notice: string,
    base: ParsedDiagnostic["details"]
  ): ParsedDiagnostic => {
    const details: ParsedDiagnostic["details"] = [
      { label: "API", kind: "code", value: api, language: "go" },
      ...base,
      { label: "Deprecation notice", kind: "text", value: notice },
    ];

    const replacement = notice.match(/\bUse (.+?) instead\b/);
    if (replacement) {
      details.push({
        label: "Hint",
        kind: "text",
        value: `Use ${replacement[1].trim()} instead of ${api}.`,
      });
    }

    return {
      family: "sa1019",
      title: "Using a deprecated function, variable, constant or field",
      summary: SA1019_SUMMARY,
      rawMessage: message,
      details,
    };
  };

  const neverUse = message.match(SA1019_NEVER_USE_PATTERN);
  if (neverUse) {
    const [, api, since, notice] = neverUse;
    return build(api, notice, [
      { label: "Deprecated since", kind: "text", value: since },
    ]);
  }

  const alternative = message.match(SA1019_ALTERNATIVE_PATTERN);
  if (alternative) {
    const [, api, since, alternativeSince, notice] = alternative;
    return build(api, notice, [
      { label: "Deprecated since", kind: "text", value: since },
      {
        label: "Alternative available since",
        kind: "text",
        value: alternativeSince,
      },
    ]);
  }

  const since = message.match(SA1019_SINCE_PATTERN);
  if (since) {
    const [, api, deprecatedSince, notice] = since;
    return build(api, notice, [
      { label: "Deprecated since", kind: "text", value: deprecatedSince },
    ]);
  }

  const plain = message.match(SA1019_PLAIN_PATTERN);
  if (plain) {
    const [, api, notice] = plain;
    return build(api, notice, []);
  }

  return null;
}

// SA1029 - Inappropriate key in call to `context.WithValue`
//
// The alias variant is tried before the plain built-in variant: its message
// would otherwise match the plain pattern with the alias clause swallowed by
// the type group.
const SA1029_ALIAS_PATTERN =
  /^should not use built-in type (.+?) \(via alias (.+?)\) as key for value; define your own type to avoid collisions$/;
const SA1029_BUILTIN_PATTERN =
  /^should not use built-in type (.+?) as key for value; define your own type to avoid collisions$/;
const SA1029_EMPTY_STRUCT_PATTERN =
  /^should not use empty anonymous struct as key for value; define your own type to avoid collisions$/;
const SA1029_NOT_COMPARABLE_PATTERN =
  /^keys used with context\.WithValue must be comparable, but type (.+) is not comparable$/;

const SA1029_SUMMARY =
  "The key passed to context.WithValue has an unsuitable type and can collide with keys from other packages.";

const SA1029_ALIAS_HINT =
  "Define your own named type for the key (e.g. `type contextKey struct{}`) rather than aliasing a built-in type, so keys cannot collide between packages.";
const SA1029_BUILTIN_HINT =
  "Define your own named type for the key, e.g. `type contextKey struct{}`, so keys from different packages cannot collide.";
const SA1029_EMPTY_STRUCT_HINT =
  "Use a named type for the key (often `type contextKey struct{}`) or an exported variable whose type is a pointer, so keys cannot collide.";
const SA1029_NOT_COMPARABLE_HINT =
  "Context keys must be comparable; use a type without slices, maps or functions (a named struct or pointer works well).";

function parseSA1029(message: string): ParsedDiagnostic | null {
  const alias = message.match(SA1029_ALIAS_PATTERN);
  if (alias) {
    const [, keyType, aliasType] = alias;
    return {
      family: "sa1029",
      title: "Inappropriate key in call to `context.WithValue`",
      summary: SA1029_SUMMARY,
      rawMessage: message,
      details: [
        { label: "Key type", kind: "code", value: keyType, language: "go" },
        { label: "Alias type", kind: "code", value: aliasType, language: "go" },
        { label: "Hint", kind: "text", value: SA1029_ALIAS_HINT },
      ],
    };
  }

  const builtin = message.match(SA1029_BUILTIN_PATTERN);
  if (builtin) {
    const [, keyType] = builtin;
    return {
      family: "sa1029",
      title: "Inappropriate key in call to `context.WithValue`",
      summary: SA1029_SUMMARY,
      rawMessage: message,
      details: [
        { label: "Key type", kind: "code", value: keyType, language: "go" },
        { label: "Hint", kind: "text", value: SA1029_BUILTIN_HINT },
      ],
    };
  }

  if (SA1029_EMPTY_STRUCT_PATTERN.test(message)) {
    return {
      family: "sa1029",
      title: "Inappropriate key in call to `context.WithValue`",
      summary: SA1029_SUMMARY,
      rawMessage: message,
      details: [
        { label: "Key type", kind: "code", value: "struct{}", language: "go" },
        { label: "Hint", kind: "text", value: SA1029_EMPTY_STRUCT_HINT },
      ],
    };
  }

  const notComparable = message.match(SA1029_NOT_COMPARABLE_PATTERN);
  if (notComparable) {
    const [, keyType] = notComparable;
    return {
      family: "sa1029",
      title: "Inappropriate key in call to `context.WithValue`",
      summary: SA1029_SUMMARY,
      rawMessage: message,
      details: [
        { label: "Key type", kind: "code", value: keyType, language: "go" },
        { label: "Hint", kind: "text", value: SA1029_NOT_COMPARABLE_HINT },
      ],
    };
  }

  return null;
}

// SA1032 - Wrong order of arguments to `errors.Is`
const SA1032_PATTERN = /^arguments have the wrong order$/;

function parseSA1032(message: string): ParsedDiagnostic | null {
  if (!SA1032_PATTERN.test(message)) {
    return null;
  }

  return {
    family: "sa1032",
    title: "Wrong order of arguments to `errors.Is`",
    summary:
      "The two arguments passed to errors.Is appear to be in the wrong order.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Call `errors.Is(err, sentinel)` with the error you have first and the sentinel error second, e.g. `errors.Is(err, io.EOF)`.",
      },
    ],
  };
}

export const sa1xxParsers: Record<string, GoplsAnalyzerParser> = {
  SA1000: parseSA1000,
  SA1002: parseSA1002,
  SA1004: parseSA1004,
  SA1006: parseSA1006,
  SA1008: parseSA1008,
  SA1012: parseSA1012,
  SA1015: parseSA1015,
  SA1017: parseSA1017,
  SA1019: parseSA1019,
  SA1029: parseSA1029,
  SA1032: parseSA1032,
};
