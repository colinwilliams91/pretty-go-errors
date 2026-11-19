import type { GoplsAnalyzerParser } from "./types";
import type { ParsedDiagnostic } from "../prettifyGoDiagnostic";

// SA4 - Code that isn't really doing anything (staticcheck).

// SA4000 - Binary operator has identical expressions on both sides
//
// Source: staticcheck/sa4000/sa4000.go:223. The %s is a raw token such as
// `==`, `&&` or `-`.
const SA4000_PATTERN =
  /^identical expressions on the left and right side of the '(.+)' operator$/;

function parseSA4000(message: string): ParsedDiagnostic | null {
  const match = message.match(SA4000_PATTERN);
  if (!match) {
    return null;
  }

  const [, operator] = match;
  return {
    family: "sa4000",
    title: "Binary operator has identical expressions on both sides",
    summary:
      "Both sides of this binary operation are the same expression, so the operation cannot compare or combine anything.",
    rawMessage: message,
    details: [
      { label: "Operator", kind: "code", value: operator, language: "text" },
      {
        label: "Hint",
        kind: "text",
        value:
          "Compare distinct values on each side — the two operands here are literally the same expression.",
      },
    ],
  };
}

// SA4001 - `&*x` gets simplified to `x`, it does not copy `x`
//
// Source: staticcheck/sa4001/sa4001.go:49-52. Two templates with the same
// shape; only the operator pair differs (`&*x ...` vs `*&x ...`), so one
// anchored pattern covers both:
//   &*x will be simplified to x. It will not copy x.
//   *&x will be simplified to x. It will not copy x.
const SA4001_PATTERN =
  /^([\s\S]+) will be simplified to ([\s\S]+)\. It will not copy ([\s\S]+)\.$/;

function parseSA4001(message: string): ParsedDiagnostic | null {
  const match = message.match(SA4001_PATTERN);
  if (!match) {
    return null;
  }

  const [, original, simplified] = match;
  return {
    family: "sa4001",
    title: "`&*x` gets simplified to `x`, it does not copy `x`",
    summary:
      "The address and dereference operations cancel each other out, so this expression does not make a copy.",
    rawMessage: message,
    details: [
      { label: "Original expression", kind: "code", value: original },
      { label: "Simplifies to", kind: "code", value: simplified },
      {
        label: "Hint",
        kind: "text",
        value:
          "Drop the redundant `&*`/`*&` pair and write the inner expression directly — the code already reads as if it copied the value.",
      },
    ],
  };
}

// SA4003 - Comparing unsigned values against negative values is pointless
//
// Source: staticcheck/sa4003/sa4003.go:83-218. Four templates. Each template
// fixes the comparison direction, so the hint is specific to the template:
//   no value of type uint is less than 0
//   every value of type uint8 is >= 0
//   no value of type uint8 is greater than 255
//   every value of type uint8 is <= 255
const SA4003_LESS_THAN_ZERO_PATTERN = /^no value of type (.+) is less than 0$/;
const SA4003_AT_LEAST_ZERO_PATTERN = /^every value of type (.+) is >= 0$/;
const SA4003_GREATER_THAN_BOUND_PATTERN =
  /^no value of type (.+) is greater than (.+)$/;
const SA4003_AT_MOST_BOUND_PATTERN = /^every value of type (.+) is <= (.+)$/;

function parseSA4003(message: string): ParsedDiagnostic | null {
  const lessThanZero = message.match(SA4003_LESS_THAN_ZERO_PATTERN);
  if (lessThanZero) {
    const [, typeName] = lessThanZero;
    return sa4003Diagnostic(message, typeName, undefined, [
      {
        label: "Hint",
        kind: "text",
        value:
          "Unsigned values are never negative, so this comparison can never be true; drop the check or use a signed type.",
      },
    ]);
  }

  const atLeastZero = message.match(SA4003_AT_LEAST_ZERO_PATTERN);
  if (atLeastZero) {
    const [, typeName] = atLeastZero;
    return sa4003Diagnostic(message, typeName, undefined, [
      {
        label: "Hint",
        kind: "text",
        value:
          "Unsigned values are never negative, so this comparison is always true; drop the redundant check.",
      },
    ]);
  }

  const greaterThanBound = message.match(SA4003_GREATER_THAN_BOUND_PATTERN);
  if (greaterThanBound) {
    const [, typeName, bound] = greaterThanBound;
    return sa4003Diagnostic(message, typeName, bound, [
      {
        label: "Hint",
        kind: "text",
        value:
          "Every value of this unsigned type fits within the bound, so this comparison is always false; drop the check.",
      },
    ]);
  }

  const atMostBound = message.match(SA4003_AT_MOST_BOUND_PATTERN);
  if (atMostBound) {
    const [, typeName, bound] = atMostBound;
    return sa4003Diagnostic(message, typeName, bound, [
      {
        label: "Hint",
        kind: "text",
        value:
          "Every value of this unsigned type fits within the bound, so this comparison is always true; drop the redundant check.",
      },
    ]);
  }

  return null;
}

function sa4003Diagnostic(
  message: string,
  typeName: string,
  bound: string | undefined,
  hint: ParsedDiagnostic["details"]
): ParsedDiagnostic {
  const details: ParsedDiagnostic["details"] = [
    { label: "Type", kind: "code", value: typeName },
  ];
  if (bound !== undefined) {
    details.push({ label: "Bound", kind: "code", value: bound });
  }
  details.push(...hint);

  return {
    family: "sa4003",
    title: "Comparing unsigned values against negative values is pointless",
    summary:
      "The outcome of this comparison is fixed by the unsigned type involved, so the check is pointless.",
    rawMessage: message,
    details,
  };
}

// SA4004 - The loop exits unconditionally after one iteration
//
// Source: staticcheck/sa4004/sa4004.go:157. Static message.
const SA4004_PATTERN = /^the surrounding loop is unconditionally terminated$/;

function parseSA4004(message: string): ParsedDiagnostic | null {
  if (!message.match(SA4004_PATTERN)) {
    return null;
  }

  return {
    family: "sa4004",
    title: "The loop exits unconditionally after one iteration",
    summary:
      "The loop body terminates unconditionally on its first iteration, so the loop can never run more than once.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Remove the unconditional break/continue/return (or the redundant wrapping loop) if more than one iteration is intended.",
      },
    ],
  };
}

// SA4005 - Field assignment that will never be observed. Did you mean to use
// a pointer receiver?
//
// Source: staticcheck/sa4005/sa4005.go:134. The first %s is the struct type
// (e.g. User) and the second is the field name (e.g. Name).
const SA4005_PATTERN = /^ineffective assignment to field (.+)\.(.+)$/;

function parseSA4005(message: string): ParsedDiagnostic | null {
  const match = message.match(SA4005_PATTERN);
  if (!match) {
    return null;
  }

  const [, typeName, field] = match;
  return {
    family: "sa4005",
    title:
      "Field assignment that will never be observed. Did you mean to use a pointer receiver?",
    summary:
      "The method's receiver is a value, so this assignment modifies a copy that is discarded when the method returns.",
    rawMessage: message,
    details: [
      { label: "Type", kind: "code", value: typeName },
      { label: "Field", kind: "code", value: field },
      {
        label: "Hint",
        kind: "text",
        value:
          "Give the method a pointer receiver (`func (u *User) ...`) or return the modified value so the change is observed.",
      },
    ],
  };
}

// SA4006 - A value assigned to a variable is never read before being
// overwritten. Forgotten error check or dead code?
//
// Source: staticcheck/sa4006/sa4006.go:111,142,167. The %s is an identifier
// or selector expression, e.g. `err` or `x.y`.
const SA4006_PATTERN = /^this value of (.+) is never used$/;

function parseSA4006(message: string): ParsedDiagnostic | null {
  const match = message.match(SA4006_PATTERN);
  if (!match) {
    return null;
  }

  const [, variable] = match;
  return {
    family: "sa4006",
    title:
      "A value assigned to a variable is never read before being overwritten. Forgotten error check or dead code?",
    summary: "This value is overwritten before it is ever read.",
    rawMessage: message,
    details: [
      { label: "Variable", kind: "code", value: variable },
      {
        label: "Hint",
        kind: "text",
        value:
          "This is often a forgotten `if err != nil` check or dead code — inspect the value being overwritten here.",
      },
    ],
  };
}

// SA4008 - The variable in the loop condition never changes, are you
// incrementing the wrong variable?
//
// Source: staticcheck/sa4008/sa4008.go:91. Static message.
const SA4008_PATTERN = /^variable in loop condition never changes$/;

function parseSA4008(message: string): ParsedDiagnostic | null {
  if (!message.match(SA4008_PATTERN)) {
    return null;
  }

  return {
    family: "sa4008",
    title:
      "The variable in the loop condition never changes, are you incrementing the wrong variable?",
    summary:
      "The variable the loop condition tests never changes, so the loop cannot terminate.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Check which variable the loop increments or mutates — it is likely not the one the condition tests.",
      },
    ],
  };
}

// SA4009 - A function argument is overwritten before its first use
//
// Source: staticcheck/sa4009/sa4009.go:98. The %s is the parameter name,
// e.g. `x`.
const SA4009_PATTERN = /^argument (.+) is overwritten before first use$/;

function parseSA4009(message: string): ParsedDiagnostic | null {
  const match = message.match(SA4009_PATTERN);
  if (!match) {
    return null;
  }

  const [, argument] = match;
  return {
    family: "sa4009",
    title: "A function argument is overwritten before its first use",
    summary: "This function argument is overwritten before it is ever used.",
    rawMessage: message,
    details: [
      { label: "Argument", kind: "code", value: argument },
      {
        label: "Hint",
        kind: "text",
        value:
          "Assign the new value to a separate variable so the argument's original value stays available.",
      },
    ],
  };
}

// SA4010 - The result of `append` will never be observed anywhere
//
// Source: staticcheck/sa4010/sa4010.go:204. Static message.
const SA4010_PATTERN =
  /^this result of append is never used, except maybe in other appends$/;

function parseSA4010(message: string): ParsedDiagnostic | null {
  if (!message.match(SA4010_PATTERN)) {
    return null;
  }

  return {
    family: "sa4010",
    title: "The result of `append` will never be observed anywhere",
    summary:
      "The result of this append call is discarded, so the call has no effect.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "append may return a new slice — store the result (e.g. `s = append(s, ...)`) or remove the call.",
      },
    ],
  };
}

// SA4011 - Break statement with no effect. Did you mean to break out of an
// outer loop?
//
// Source: staticcheck/sa4011/sa4011.go:86. Static message.
const SA4011_PATTERN =
  /^ineffective break statement. Did you mean to break out of the outer loop\?$/;

function parseSA4011(message: string): ParsedDiagnostic | null {
  if (!message.match(SA4011_PATTERN)) {
    return null;
  }

  return {
    family: "sa4011",
    title:
      "Break statement with no effect. Did you mean to break out of an outer loop?",
    summary:
      "This break only exits the innermost construct, which was already ending, so it has no effect.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Label the outer loop (e.g. `outer:` before `for`) and break out of it with `break outer`.",
      },
    ],
  };
}

// SA4017 - Discarding the return values of a function without side effects,
// making the call pointless
//
// Source: staticcheck/sa4017/sa4017.go:84. The %s is the short function
// name, e.g. `Replace`.
const SA4017_PATTERN =
  /^(.+) doesn't have side effects and its return value is ignored$/;

function parseSA4017(message: string): ParsedDiagnostic | null {
  const match = message.match(SA4017_PATTERN);
  if (!match) {
    return null;
  }

  const [, fn] = match;
  return {
    family: "sa4017",
    title:
      "Discarding the return values of a function without side effects, making the call pointless",
    summary:
      "This function has no side effects, so discarding its return value makes the call pointless.",
    rawMessage: message,
    details: [
      { label: "Function", kind: "code", value: fn },
      {
        label: "Hint",
        kind: "text",
        value: "Assign the return value to a variable or drop the call.",
      },
    ],
  };
}

// SA4023 - Impossible comparison of interface value with untyped nil
//
// Source: staticcheck/sa4023/sa4023.go:166-206. The qualifier is always or
// never. Two templates; try the more specific concretely-typed-lhs one first.
const SA4023_CONCRETE_LHS_PATTERN =
  /^this comparison is (always|never) true; the lhs of the comparison has been assigned a concretely typed value$/;
const SA4023_PATTERN = /^this comparison is (always|never) true$/;

function parseSA4023(message: string): ParsedDiagnostic | null {
  const concreteLhs = message.match(SA4023_CONCRETE_LHS_PATTERN);
  if (concreteLhs) {
    const [, qualifier] = concreteLhs;
    return sa4023Diagnostic(message, qualifier);
  }

  const plain = message.match(SA4023_PATTERN);
  if (plain) {
    const [, qualifier] = plain;
    return sa4023Diagnostic(message, qualifier);
  }

  return null;
}

function sa4023Diagnostic(
  message: string,
  qualifier: string
): ParsedDiagnostic {
  return {
    family: "sa4023",
    title: "Impossible comparison of interface value with untyped nil",
    summary:
      "This interface comparison against untyped nil has a fixed outcome, so the check is pointless.",
    rawMessage: message,
    details: [
      { label: "Outcome", kind: "text", value: qualifier },
      {
        label: "Hint",
        kind: "text",
        value:
          "A nil `*T` stored in an interface (e.g. `error`) is still non-nil — return an explicit `nil` instead of a typed nil pointer.",
      },
    ],
  };
}

// SA4031 - Checking never-nil value against nil
//
// Source: staticcheck/sa4031/sa4031.go:125-159. Three templates; the
// function-specific ones are tried before the generic qualifier form.
const SA4031_FUNCTION_VARIABLE_PATTERN =
  /^the checked variable contains a function and is never nil; did you mean to call it\?$/;
const SA4031_FUNCTIONS_PATTERN =
  /^functions are never nil; did you mean to call it\?$/;
const SA4031_QUALIFIER_PATTERN = /^this nil check is (always|never) true$/;

function parseSA4031(message: string): ParsedDiagnostic | null {
  if (message.match(SA4031_FUNCTION_VARIABLE_PATTERN)) {
    return {
      family: "sa4031",
      title: "Checking never-nil value against nil",
      summary:
        "The checked value is a function, which is never nil, so this check is pointless.",
      rawMessage: message,
      details: [
        {
          label: "Hint",
          kind: "text",
          value: "Call the function first and check its result for nil.",
        },
      ],
    };
  }

  if (message.match(SA4031_FUNCTIONS_PATTERN)) {
    return {
      family: "sa4031",
      title: "Checking never-nil value against nil",
      summary:
        "Functions are never nil, so this check against nil is pointless.",
      rawMessage: message,
      details: [
        {
          label: "Hint",
          kind: "text",
          value: "Call the function first and check its result for nil.",
        },
      ],
    };
  }

  const qualifierMatch = message.match(SA4031_QUALIFIER_PATTERN);
  if (qualifierMatch) {
    const [, qualifier] = qualifierMatch;
    return {
      family: "sa4031",
      title: "Checking never-nil value against nil",
      summary:
        "The outcome of this nil check is fixed by the types involved, so the check is pointless.",
      rawMessage: message,
      details: [
        { label: "Outcome", kind: "text", value: qualifier },
        {
          label: "Hint",
          kind: "text",
          value:
            "Call the function and check its result — or simplify the check, since its outcome is already determined.",
        },
      ],
    };
  }

  return null;
}

export const sa4xxParsers: Record<string, GoplsAnalyzerParser> = {
  SA4000: parseSA4000,
  SA4001: parseSA4001,
  SA4003: parseSA4003,
  SA4004: parseSA4004,
  SA4005: parseSA4005,
  SA4006: parseSA4006,
  SA4008: parseSA4008,
  SA4009: parseSA4009,
  SA4010: parseSA4010,
  SA4011: parseSA4011,
  SA4017: parseSA4017,
  SA4023: parseSA4023,
  SA4031: parseSA4031,
};
