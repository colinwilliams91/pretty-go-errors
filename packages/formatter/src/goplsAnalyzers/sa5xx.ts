import type { GoplsAnalyzerParser } from "./types";
import type { ParsedDiagnostic } from "../prettifyGoDiagnostic";

// SA5 - Correctness issues (staticcheck).
//
// Message templates are grounded verbatim in
// docs/staticcheck-message-grounding.md, section "SA5 — Correctness issues",
// which was extracted from the analyzer sources
// (staticcheck/sa<nnnn>/sa<nnnn>.go, plus sa5008/jsonv2.go, sa5008/structtag.go).

// SA5000 - Assignment to nil map
//
// Template (sa5000.go:47): `assignment to nil map` (static).
const SA5000_PATTERN = /^assignment to nil map$/;

function parseSA5000(message: string): ParsedDiagnostic | null {
  if (!SA5000_PATTERN.test(message)) {
    return null;
  }

  return {
    family: "sa5000",
    title: "Assignment to nil map",
    summary: "Assigning a value into a nil map panics at runtime.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Initialize the map with `make` or a map literal before assigning entries; reading from a nil map is safe, writing is not.",
      },
    ],
  };
}

// SA5001 - Deferring `Close` before checking for a possible error
//
// Template (sa5001.go:98):
//   should check error returned from %s() before deferring %s
// The first %s is the acquiring call's Fun rendered WITHOUT parentheses (the
// template adds `()`); the second is the deferred call rendered WITH them.
const SA5001_PATTERN =
  /^should check error returned from (.+)\(\) before deferring (.+)$/;

function parseSA5001(message: string): ParsedDiagnostic | null {
  const match = message.match(SA5001_PATTERN);
  if (!match) {
    return null;
  }

  const [, acquiringFun, deferredCall] = match;

  return {
    family: "sa5001",
    title: "Deferring `Close` before checking for a possible error",
    summary:
      "The deferred Close call runs before the error from the call that acquired the resource has been checked.",
    rawMessage: message,
    details: [
      {
        label: "Acquiring call",
        kind: "code",
        value: `${acquiringFun}()`,
        language: "go",
      },
      {
        label: "Deferred call",
        kind: "code",
        value: deferredCall,
        language: "go",
      },
      {
        label: "Hint",
        kind: "text",
        value:
          "Check the error from the acquiring call (e.g. `if err != nil`) before registering the deferred `Close`; if the call failed, the resource may be nil and the deferred call would panic.",
      },
    ],
  };
}

// SA5002 - The empty for loop (`for {}`) spins and can block the scheduler
//
// Templates (sa5002.go:76-78):
// 1. `loop condition never changes or has a race condition`
// 2. `this loop will spin, using 100% CPU`
const SA5002_PATTERNS = [
  /^loop condition never changes or has a race condition$/,
  /^this loop will spin, using 100% CPU$/,
];

const SA5002_RACE_HINT =
  "A busy loop that only reads ordinary variables cannot safely wait for another goroutine to change them; wait on a channel receive or use a synchronization primitive (e.g. `sync.Cond`) instead.";
const SA5002_SPIN_HINT =
  "If the loop is meant to wait, receive from a channel instead; to block forever without consuming CPU, use `select {}` rather than an empty `for {}`.";

function parseSA5002(message: string): ParsedDiagnostic | null {
  let hint: string;
  if (SA5002_PATTERNS[0].test(message)) {
    hint = SA5002_RACE_HINT;
  } else if (SA5002_PATTERNS[1].test(message)) {
    hint = SA5002_SPIN_HINT;
  } else {
    return null;
  }

  return {
    family: "sa5002",
    title: "The empty for loop (`for {}`) spins and can block the scheduler",
    summary:
      "This empty for loop spins continuously, consuming a full CPU core and potentially blocking the Go scheduler.",
    rawMessage: message,
    details: [{ label: "Hint", kind: "text", value: hint }],
  };
}

// SA5003 - Defers in infinite loops will never execute
//
// Template (sa5003.go:69):
//   `defers in this infinite loop will never run` (static).
const SA5003_PATTERN = /^defers in this infinite loop will never run$/;

function parseSA5003(message: string): ParsedDiagnostic | null {
  if (!SA5003_PATTERN.test(message)) {
    return null;
  }

  return {
    family: "sa5003",
    title: "Defers in infinite loops will never execute",
    summary:
      "Deferred calls are scoped to the surrounding function, so inside a loop that never exits they never run.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Move the deferred work out of the loop, or restructure the loop so it can exit (e.g. via `break` or `return`) before the function ends.",
      },
    ],
  };
}

// SA5004 - `for { select { ...` with an empty default branch spins
//
// Template (sa5004.go:45):
//   should not have an empty default case in a for+select loop; the loop will spin (static).
const SA5004_PATTERN =
  /^should not have an empty default case in a for\+select loop; the loop will spin$/;

function parseSA5004(message: string): ParsedDiagnostic | null {
  if (!SA5004_PATTERN.test(message)) {
    return null;
  }

  return {
    family: "sa5004",
    title: "`for { select { ...` with an empty default branch spins",
    summary:
      "A select with an empty default branch does not block, so the surrounding for loop spins while consuming CPU.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Remove the empty `default` branch so the `select` blocks until one of its channel operations is ready.",
      },
    ],
  };
}

// SA5007 - Infinite recursive call
//
// Template (sa5007.go:56): `infinite recursive call` (static).
const SA5007_PATTERN = /^infinite recursive call$/;

function parseSA5007(message: string): ParsedDiagnostic | null {
  if (!SA5007_PATTERN.test(message)) {
    return null;
  }

  return {
    family: "sa5007",
    title: "Infinite recursive call",
    summary:
      "This recursive call has no exit condition, so it recurses until the process runs out of memory.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Add a base case that stops the recursion, or rewrite it as a loop; Go does not perform tail call optimization.",
      },
    ],
  };
}

// SA5008 - Invalid struct tag
//
// The most variant-rich check. Messages come from three sources: sa5008.go
// (tag syntax / duplicate keys / XML), sa5008/structtag.go (the unparseable
// tag's strconv.Unquote error) and sa5008/jsonv2.go (JSON tag validation).
// Families are tried in order, most specific first — e.g.
// "invalid XML tag: unknown option ..." must win over the generic
// "invalid XML tag: ...". Unmatched variants return null so the fallback
// hover still renders the raw message.

const SA5008_JSON_KEY_DETAIL: ParsedDiagnostic["details"][number] = {
  label: "Tag key",
  kind: "text",
  value: "json",
};

const SA5008_XML_KEY_DETAIL: ParsedDiagnostic["details"][number] = {
  label: "Tag key",
  kind: "text",
  value: "xml",
};

interface SA5008Family {
  pattern: RegExp;
  hint: string | null;
  details: (match: RegExpMatchArray) => ParsedDiagnostic["details"];
}

const SA5008_FAMILIES: SA5008Family[] = [
  // duplicate struct tag %q
  {
    pattern: /^duplicate struct tag "(.*)"$/,
    hint: 'Merge the repeated entries into a single `key:"value"` pair; each key may appear only once in a struct tag. (github.com/jessevdk/go-flags is exempt for its `choice`, `optional-value` and `default` keys.)',
    details: (m) => [{ label: "Tag key", kind: "text", value: m[1] }],
  },
  // unparseable struct tag: %s (the strconv.Unquote error)
  {
    pattern: /^unparseable struct tag: ([\s\S]+)$/,
    hint: null,
    details: (m) => [{ label: "Tag syntax error", kind: "text", value: m[1] }],
  },
  // XML: invalid XML tag: unknown option %q (before the generic XML family)
  {
    pattern: /^invalid XML tag: unknown option "(.*)"$/,
    hint: "Supported `xml` options are `attr`, `chardata`, `cdata`, `innerxml`, `comment`, `omitempty` and `any`.",
    details: (m) => [
      SA5008_XML_KEY_DETAIL,
      { label: "Unknown option", kind: "text", value: m[1] },
    ],
  },
  // XML: invalid XML tag: duplicate option %q (before the generic XML family)
  {
    pattern: /^invalid XML tag: duplicate option "(.*)"$/,
    hint: "Each `xml` option may appear at most once; remove the repeated occurrence.",
    details: (m) => [
      SA5008_XML_KEY_DETAIL,
      { label: "Duplicate option", kind: "text", value: m[1] },
    ],
  },
  // XML: invalid XML tag: %s (free-form error from fakexml.StructFieldInfo)
  {
    pattern: /^invalid XML tag: ([\s\S]+)$/,
    hint: "Check the `xml` tag's name and options against the rules of `encoding/xml`.",
    details: (m) => [
      SA5008_XML_KEY_DETAIL,
      { label: "Tag error", kind: "text", value: m[1] },
    ],
  },
  // JSON: unexported struct field cannot have non-ignored `json:%q` tag
  {
    pattern:
      /^unexported struct field cannot have non-ignored `json:"(.*)"` tag$/,
    hint: 'Export the field, or ignore it with `json:"-"`; reflection cannot set the value of an unexported field.',
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Tag value", kind: "text", value: m[1] },
    ],
  },
  // JSON: invalid UTF-8 in JSON object name %q
  {
    pattern: /^invalid UTF-8 in JSON object name "(.*)"$/,
    hint: "JSON object names must be valid UTF-8; fix or remove the invalid bytes in the name.",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Object name", kind: "text", value: m[1] },
    ],
  },
  // JSON: the long "-" question message
  {
    pattern:
      /^should encoding\/json ignore this field or name it "-"\? Either use `json:"-"` to ignore the field or use `json:"'-'([\s\S]*)` to specify "(.*)" as the name$/,
    hint: 'Use `json:"-"` to ignore the field, or write the name single-quoted (e.g. `json:"\'-name\'"`) so it is not mistaken for the ignore marker.',
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Object name", kind: "text", value: m[2] },
    ],
  },
  // JSON: `format` tag option was not specified last
  {
    pattern: /^`format` tag option was not specified last$/,
    hint: "Move the `format` option to the end of the `json` tag, after all other options.",
    details: () => [SA5008_JSON_KEY_DETAIL],
  },
  // JSON: missing value for `format` tag option
  {
    pattern: /^missing value for `format` tag option$/,
    hint: 'Give the `format` option a value, e.g. `json:"created,format:2006-01-02"`.',
    details: () => [SA5008_JSON_KEY_DETAIL],
  },
  // JSON: missing value for `case` tag option
  {
    pattern:
      /^missing value for `case` tag option; specify `case:ignore` or `case:strict` instead$/,
    hint: "Add a value after the option: `case:ignore` or `case:strict`.",
    details: () => [SA5008_JSON_KEY_DETAIL],
  },
  // JSON: malformed value for `case` tag option: %v
  {
    pattern: /^malformed value for `case` tag option: ([\s\S]+)$/,
    hint: "The value after `case:` must be an identifier or a single-quoted string, e.g. `case:ignore`.",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Tag error", kind: "text", value: m[1] },
    ],
  },
  // JSON: malformed value for `format` tag option: %v
  {
    pattern: /^malformed value for `format` tag option: ([\s\S]+)$/,
    hint: "The value after `format:` must be an identifier or a single-quoted string, e.g. `format:RFC3339`.",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Tag error", kind: "text", value: m[1] },
    ],
  },
  // JSON: invalid appearance of unknown `case:%s` tag value
  {
    pattern: /^invalid appearance of unknown `case:(.*)` tag value$/,
    hint: "Valid `case` values are `ignore` and `strict`.",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Case value", kind: "text", value: m[1] },
    ],
  },
  // JSON: invalid appearance of `string` tag option (fixed message)
  {
    pattern:
      /^invalid appearance of `string` tag option; it is only intended for fields of numeric types or pointers to those$/,
    hint: "Remove the `string` option; it only applies to fields of numeric types (or pointers to those).",
    details: () => [SA5008_JSON_KEY_DETAIL],
  },
  // JSON: unnecessarily quoted appearance of `case:%s` tag option; specify `case:%s` instead
  {
    pattern:
      /^unnecessarily quoted appearance of `case:(.*)` tag option; specify `case:(.*)` instead$/,
    hint: "Write the value without single quotes.",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Specified as", kind: "text", value: m[1] },
      { label: "Use instead", kind: "text", value: m[2] },
    ],
  },
  // JSON: unnecessarily quoted appearance of `%s` tag option; specify `%s` instead
  {
    pattern:
      /^unnecessarily quoted appearance of `(.*)` tag option; specify `(.*)` instead$/,
    hint: "Write the option without single quotes.",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Specified as", kind: "text", value: m[1] },
      { label: "Use instead", kind: "text", value: m[2] },
    ],
  },
  // JSON: invalid appearance of `%s` tag option; specify `%s` instead (mutants like omitEmpty)
  {
    pattern:
      /^invalid appearance of `(.*)` tag option; specify `(.*)` instead$/,
    hint: "Use the canonical option spelling.",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Invalid option", kind: "text", value: m[1] },
      { label: "Use instead", kind: "text", value: m[2] },
    ],
  },
  // JSON: invalid appearance of unknown `%s` tag option
  {
    pattern: /^invalid appearance of unknown `(.*)` tag option$/,
    hint: "Remove the unknown option or use one that `encoding/json` supports (`case`, `embed`, `format`, `inline`, `omitzero`, `omitempty`, `string`, `unknown`).",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Unknown option", kind: "text", value: m[1] },
    ],
  },
  // JSON: duplicate appearance of `%s` tag option
  {
    pattern: /^duplicate appearance of `(.*)` tag option$/,
    hint: "Each option may appear at most once in the `json` tag; remove the duplicate.",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Duplicate option", kind: "text", value: m[1] },
    ],
  },
  // JSON: malformed `json` tag: %v (generic; also covers the fixed sub-forms
  // `invalid character %q before next option (expecting ',')` and
  // `invalid trailing ',' character` and the consumeTagOption errors)
  {
    pattern: /^malformed `json` tag: ([\s\S]+)$/,
    hint: "Check the `json` tag value for unescaped quotes or unterminated single-quoted names; it must parse as a name followed by comma-separated options.",
    details: (m) => [
      SA5008_JSON_KEY_DETAIL,
      { label: "Tag error", kind: "text", value: m[1] },
    ],
  },
  // JSON: field cannot have both `inline` and `unknown` specified
  {
    pattern: /^field cannot have both `inline` and `unknown` specified$/,
    hint: "Choose either `inline` or `unknown` for this field, not both.",
    details: () => [SA5008_JSON_KEY_DETAIL],
  },
];

function parseSA5008(message: string): ParsedDiagnostic | null {
  for (const family of SA5008_FAMILIES) {
    const match = message.match(family.pattern);
    if (!match) {
      continue;
    }

    const details = family.details(match);
    if (family.hint) {
      details.push({ label: "Hint", kind: "text", value: family.hint });
    }

    return {
      family: "sa5008",
      title: "Invalid struct tag",
      summary:
        "This struct tag is malformed or uses options that the package reading it cannot interpret.",
      rawMessage: message,
      details,
    };
  }

  return null;
}

// SA5009 - Invalid Printf call
//
// Six templates (sa5009.go:327-413). The first `%s` in templates 2-5 is the
// raw verb (e.g. `%d`, `%[0]d`, `%*d`).
const SA5009_PATTERNS = [
  /^couldn't parse format string$/,
  /^Printf format (.+) reads invalid arg 0; indices are 1-based$/,
  /^Printf format (.+) reads arg #(\d+), but call has only (\d+) args$/,
  /^Printf format (.+) reads non-int arg #(\d+) as argument of \*$/,
  /^Printf format (.+) has arg #(\d+) of wrong type (.+)$/,
  /^Printf call needs (\d+) args but has (\d+) args$/,
];

function parseSA5009(message: string): ParsedDiagnostic | null {
  for (const [index, pattern] of SA5009_PATTERNS.entries()) {
    const match = message.match(pattern);
    if (!match) {
      continue;
    }

    let details: ParsedDiagnostic["details"];
    switch (index) {
      case 0:
        details = [
          {
            label: "Hint",
            kind: "text",
            value:
              "Check the format string for syntax errors: escape a literal percent sign as `%%`, and make sure every verb is complete (width, precision and `[...]` index).",
          },
        ];
        break;
      case 1:
        details = [
          { label: "Verb", kind: "text", value: match[1] },
          {
            label: "Hint",
            kind: "text",
            value:
              "Printf argument indices are 1-based; the first argument is #1. Select one explicitly with `%[n]v` instead of index 0.",
          },
        ];
        break;
      case 2:
        details = [
          { label: "Verb", kind: "text", value: match[1] },
          { label: "Reads argument", kind: "text", value: `#${match[2]}` },
          { label: "Arguments provided", kind: "text", value: match[3] },
          {
            label: "Hint",
            kind: "text",
            value:
              "The format string consumes more arguments than the call provides; add the missing argument or fix the verb's index (indices are 1-based, e.g. `%[2]v`).",
          },
        ];
        break;
      case 3:
        details = [
          { label: "Verb", kind: "text", value: match[1] },
          { label: "Reads argument", kind: "text", value: `#${match[2]}` },
          {
            label: "Hint",
            kind: "text",
            value:
              "A `*` width or precision consumes an int argument; pass an integer for that argument or replace the `*` with an explicit value.",
          },
        ];
        break;
      case 4:
        details = [
          { label: "Verb", kind: "text", value: match[1] },
          { label: "Argument", kind: "text", value: `#${match[2]}` },
          { label: "Argument type", kind: "text", value: match[3] },
          {
            label: "Hint",
            kind: "text",
            value:
              "Match the verb to the argument's type (e.g. `%v` or `%s` print any value), or change the argument to fit the verb.",
          },
        ];
        break;
      default:
        details = [
          { label: "Arguments needed", kind: "text", value: match[1] },
          { label: "Arguments provided", kind: "text", value: match[2] },
          {
            label: "Hint",
            kind: "text",
            value:
              "Match the number of arguments to the format string's verbs; remember that `%%` consumes none and `%[n]v` jumps to argument n.",
          },
        ];
        break;
    }

    return {
      family: "sa5009",
      title: "Invalid Printf call",
      summary:
        "This Printf-family call's format string does not agree with the arguments it is given.",
      rawMessage: message,
      details,
    };
  }

  return null;
}

// SA5010 - Impossible type assertion
//
// Multi-line message (sa5010.go:99-109):
//   impossible type assertion; <left> and <right> contradict each other:
//   \twrong type for <Method> method
//   \t\thave <type>
//   \t\twant <type>
// The method block repeats per mismatched method. compactLines keeps the
// newlines, so the pattern spans lines with [\s\S]-style alternation.
const SA5010_PATTERN =
  /^impossible type assertion; (.+) and (.+) contradict each other:((?:\n\twrong type for .+\n\t\thave .+\n\t\twant .+)+)$/;
const SA5010_METHOD_BLOCK =
  /\n\twrong type for (.+) method\n\t\thave (.+)\n\t\twant (.+)/g;

function parseSA5010(message: string): ParsedDiagnostic | null {
  const match = message.match(SA5010_PATTERN);
  if (!match) {
    return null;
  }

  const [, leftType, rightType, methodBlocks] = match;
  const items: string[] = [];
  for (const block of methodBlocks.matchAll(SA5010_METHOD_BLOCK)) {
    items.push(`${block[1]} method: have ${block[2]}, want ${block[3]}`);
  }

  return {
    family: "sa5010",
    title: "Impossible type assertion",
    summary:
      "The method sets of the two interface types conflict, so this type assertion can never succeed.",
    rawMessage: message,
    details: [
      { label: "Asserted from", kind: "text", value: leftType },
      { label: "Asserted to", kind: "text", value: rightType },
      { label: "Method signature conflicts", kind: "list", items },
      {
        label: "Hint",
        kind: "text",
        value:
          "Both interfaces declare the same methods with different signatures, so no concrete type can satisfy both; align the method signatures or assert through a compatible interface.",
      },
    ],
  };
}

export const sa5xxParsers: Record<string, GoplsAnalyzerParser> = {
  SA5000: parseSA5000,
  SA5001: parseSA5001,
  SA5002: parseSA5002,
  SA5003: parseSA5003,
  SA5004: parseSA5004,
  SA5007: parseSA5007,
  SA5008: parseSA5008,
  SA5009: parseSA5009,
  SA5010: parseSA5010,
};
