import { compactLines } from "@pretty-go-errors/utils";

export type ParsedDetail =
  | {
      label: string;
      kind: "code";
      value: string;
      language?: "go" | "text";
    }
  | {
      label: string;
      kind: "text";
      value: string;
    }
  | {
      label: string;
      kind: "list";
      items: string[];
    };

export interface ParsedDiagnostic {
  family: string;
  title: string;
  summary: string;
  details: ParsedDetail[];
  rawMessage: string;
}

// Matches:
//  - too many arguments in call to foo
//    have (A, B)
//    want (A)
//  - not enough arguments in call to foo
//    have (A)
//    want (A, B)
const CALL_ARGUMENT_COUNT_PATTERN =
  /^(too many arguments in call to|not enough arguments in call to) ([^\n]+)\n\s*have \(([^\n]*)\)\n\s*want \(([^\n]*)\)$/;

// Matches:
//  - too many return values
//    have (A, B)
//    want (A)
//  - not enough return values
//    have (A)
//    want (A, B)
const RETURN_VALUE_COUNT_PATTERN =
  /^(too many return values|not enough return values)\n\s*have \(([^\n]*)\)\n\s*want \(([^\n]*)\)$/;

const CONVERSION_ARGUMENT_COUNT_PATTERN =
  /^(missing argument|too many arguments) in conversion to (.+)$/;

// Matches:
//  - assignment mismatch: 2 variables but 1 value
//  - assignment mismatch: 1 variable but two returns 2 values
const ASSIGNMENT_MISMATCH_PATTERN =
  /^assignment mismatch: (\d+) variables? but (?:(.+?) returns )?(\d+) values?$/;

export function parseGoDiagnostic(message: string): ParsedDiagnostic {
  const rawMessage = compactLines(message);

  return (
    parseCallArgumentCount(rawMessage) ??
    parseCannotUse(rawMessage) ??
    parseConversionArgumentCount(rawMessage) ??
    parseCannotConvert(rawMessage) ??
    parseNonLocalMethodDefinition(rawMessage) ??
    parseExpectedOperand(rawMessage) ??
    parseMissingComma(rawMessage) ??
    parseUndefined(rawMessage) ??
    parseUnknownField(rawMessage) ??
    parseMissingFieldOrMethod(rawMessage) ??
    parseMissingModule(rawMessage) ??
    parsePackageStd(rawMessage) ??
    parseNotAType(rawMessage) ??
    parseGenericWithoutInstantiation(rawMessage) ??
    parseMismatchedTypes(rawMessage) ??
    parseReturnValueCount(rawMessage) ??
    parseAssignmentMismatch(rawMessage) ??
    parseMissingReturn(rawMessage) ??
    parseUnusedImport(rawMessage) ??
    parseUnusedVariable(rawMessage) ??
    createFallbackDiagnostic(rawMessage)
  );
}

function parseCallArgumentCount(message: string): ParsedDiagnostic | null {
  const match = message.match(CALL_ARGUMENT_COUNT_PATTERN);

  if (!match) {
    return null;
  }

  const [, kind, call, have, want] = match;
  return {
    family: "call-arguments",
    title:
      kind === "too many arguments in call to"
        ? "Too many arguments"
        : "Not enough arguments",
    summary: `The call to ${call} does not match the function signature.`,
    rawMessage: message,
    details: [
      { label: "Call", kind: "code", value: call, language: "go" },
      { label: "Have", kind: "code", value: have, language: "go" },
      { label: "Want", kind: "code", value: want, language: "go" },
    ],
  };
}

function parseCannotUse(message: string): ParsedDiagnostic | null {
  const withContext = message.match(
    /^cannot use (.+?) \(value of type (.+?)\) as (.+?) value in (.+?)(?:: ([\s\S]+))?$/
  );
  if (withContext) {
    const [, value, actualType, expectedType, context, reason] = withContext;
    return createCannotUseDiagnostic(
      message,
      value,
      actualType,
      expectedType,
      context,
      reason
    );
  }

  const generic = message.match(
    /^cannot use (.+?) \(value of type (.+?)\) as (.+?)(?:: ([\s\S]+))?$/
  );
  if (!generic) {
    return null;
  }

  const [, value, actualType, expectedType, reason] = generic;
  return createCannotUseDiagnostic(
    message,
    value,
    actualType,
    expectedType,
    undefined,
    reason
  );
}

function createCannotUseDiagnostic(
  rawMessage: string,
  value: string,
  actualType: string,
  expectedType: string,
  context?: string,
  reason?: string
): ParsedDiagnostic {
  const details: ParsedDetail[] = [
    { label: "Value", kind: "code", value, language: "go" },
    { label: "Actual type", kind: "code", value: actualType, language: "go" },
    {
      label: "Expected type",
      kind: "code",
      value: expectedType,
      language: "go",
    },
  ];

  if (context) {
    details.push({ label: "Context", kind: "text", value: context });
  }

  if (reason) {
    details.push({ label: "Why it fails", kind: "text", value: reason });
    const missingMethodMatch = reason.match(
      /(.+?) does not implement (.+?) \(missing method (.+?)\)$/
    );
    if (missingMethodMatch) {
      const [, actual, expected, missingMethod] = missingMethodMatch;
      details.push({
        label: "Interface type",
        kind: "code",
        value: expected,
        language: "go",
      });
      details.push({
        label: "Concrete type",
        kind: "code",
        value: actual,
        language: "go",
      });
      details.push({
        label: "Missing method",
        kind: "code",
        value: missingMethod,
        language: "go",
      });
    }
  }

  return {
    family: "cannot-use",
    title: "Type mismatch",
    summary: "A value is being used where Go expects a different type.",
    rawMessage,
    details,
  };
}

function parseConversionArgumentCount(
  message: string
): ParsedDiagnostic | null {
  const match = message.match(CONVERSION_ARGUMENT_COUNT_PATTERN);
  if (!match) {
    return null;
  }

  const [, kind, targetType] = match;
  return {
    family: "conversion-arguments",
    title:
      kind === "missing argument"
        ? "Missing conversion argument"
        : "Too many conversion arguments",
    summary:
      "Go conversions must provide exactly one value to convert to the target type.",
    rawMessage: message,
    details: [
      {
        label: "Target type",
        kind: "code",
        value: targetType,
        language: "go",
      },
    ],
  };
}

function parseCannotConvert(message: string): ParsedDiagnostic | null {
  const match = message.match(
    /^cannot convert (.+?) \(value of type (.+?)\) to type (.+)$/
  );
  if (!match) {
    return null;
  }

  const [, value, actualType, targetType] = match;
  return {
    family: "cannot-convert",
    title: "Invalid conversion",
    summary: "Go cannot convert this value to the target type.",
    rawMessage: message,
    details: [
      { label: "Value", kind: "code", value, language: "go" },
      { label: "Actual type", kind: "code", value: actualType, language: "go" },
      { label: "Target type", kind: "code", value: targetType, language: "go" },
    ],
  };
}

function parseNonLocalMethodDefinition(
  message: string
): ParsedDiagnostic | null {
  const match = message.match(
    /^cannot define new methods on non-local type (.+)$/
  );
  if (!match) {
    return null;
  }

  return {
    family: "non-local-method-definition",
    title: "Invalid method receiver",
    summary:
      "Go only allows new methods on types declared in the current package.",
    rawMessage: message,
    details: [
      {
        label: "Receiver type",
        kind: "code",
        value: match[1],
        language: "go",
      },
    ],
  };
}

function parseExpectedOperand(message: string): ParsedDiagnostic | null {
  const match = message.match(/^expected operand, found (.+)$/);
  if (!match) {
    return null;
  }

  return {
    family: "expected-operand",
    title: "Expected operand",
    summary:
      "Go expected an expression here, but found a token that cannot start one.",
    rawMessage: message,
    details: [
      {
        label: "Found token",
        kind: "code",
        value: match[1],
        language: "text",
      },
    ],
  };
}

function parseMissingComma(message: string): ParsedDiagnostic | null {
  const match = message.match(/^missing ',' in (.+)$/);
  if (!match) {
    return null;
  }

  return {
    family: "missing-comma",
    title: "Missing comma",
    summary:
      "Go expected a comma separator here before the syntax could continue.",
    rawMessage: message,
    details: [
      {
        label: "Context",
        kind: "text",
        value: match[1],
      },
      {
        label: "Expected token",
        kind: "code",
        value: ",",
        language: "text",
      },
    ],
  };
}

function parseUndefined(message: string): ParsedDiagnostic | null {
  const match = message.match(/^undefined: (.+)$/);
  if (!match) {
    return null;
  }

  return {
    family: "undefined",
    title: "Undefined identifier",
    summary: "Go cannot find a declaration for this name in the current scope.",
    rawMessage: message,
    details: [
      { label: "Identifier", kind: "code", value: match[1], language: "go" },
    ],
  };
}

function parseUnknownField(message: string): ParsedDiagnostic | null {
  const match = message.match(
    /^unknown field (.+?) in struct literal of type (.+)$/
  );
  if (!match) {
    return null;
  }

  const [, field, targetType] = match;
  return {
    family: "unknown-field",
    title: "Unknown struct field",
    summary:
      "The struct literal uses a field that does not exist on the target type.",
    rawMessage: message,
    details: [
      { label: "Field", kind: "code", value: field, language: "go" },
      { label: "Struct type", kind: "code", value: targetType, language: "go" },
    ],
  };
}

function parseMissingFieldOrMethod(message: string): ParsedDiagnostic | null {
  const match = message.match(
    /^(.+) undefined \(type (.+?) has no field or method (.+?)\)$/
  );
  if (!match) {
    return null;
  }

  const [, expression, targetType, member] = match;
  return {
    family: "missing-field-or-method",
    title: "Missing field or method",
    summary:
      "This type does not define the referenced field or method on the selected value.",
    rawMessage: message,
    details: [
      {
        label: "Expression",
        kind: "code",
        value: expression,
        language: "go",
      },
      {
        label: "Receiver type",
        kind: "code",
        value: targetType,
        language: "go",
      },
      {
        label: "Missing member",
        kind: "code",
        value: member,
        language: "go",
      },
    ],
  };
}

function parseMissingModule(message: string): ParsedDiagnostic | null {
  const match = message.match(
    /^no required module provides package (.+?); to add it:\n\s*go get (.+)$/
  );
  if (!match) {
    return null;
  }

  const [, pkg, command] = match;
  return {
    family: "module-resolution",
    title: "Missing module dependency",
    summary:
      "The package is not provided by any required module in the current workspace.",
    rawMessage: message,
    details: [
      { label: "Package", kind: "code", value: pkg, language: "go" },
      {
        label: "Suggested command",
        kind: "code",
        value: command,
        language: "go",
      },
    ],
  };
}

function parsePackageStd(message: string): ParsedDiagnostic | null {
  const match = message.match(/^package (.+?) is not in std \((.+)\)$/);
  if (!match) {
    return null;
  }

  const [, pkg, location] = match;
  return {
    family: "package-resolution",
    title: "Package not found",
    summary:
      "Go treated this import as a standard library package but could not resolve it.",
    rawMessage: message,
    details: [
      { label: "Package", kind: "code", value: pkg, language: "go" },
      { label: "Lookup path", kind: "text", value: location },
    ],
  };
}

function parseNotAType(message: string): ParsedDiagnostic | null {
  const match = message.match(/^(.+?) is not a type$/);
  if (!match) {
    return null;
  }

  return {
    family: "not-a-type",
    title: "Expected a type",
    summary:
      "This position expects a type name, but the referenced symbol is something else.",
    rawMessage: message,
    details: [
      { label: "Symbol", kind: "code", value: match[1], language: "go" },
    ],
  };
}

function parseGenericWithoutInstantiation(
  message: string
): ParsedDiagnostic | null {
  const match = message.match(
    /^cannot use generic type (.+?) without instantiation$/
  );
  if (!match) {
    return null;
  }

  return {
    family: "generic-instantiation",
    title: "Missing generic instantiation",
    summary:
      "The generic type needs concrete type arguments before it can be used here.",
    rawMessage: message,
    details: [
      { label: "Generic type", kind: "code", value: match[1], language: "go" },
    ],
  };
}

function parseMismatchedTypes(message: string): ParsedDiagnostic | null {
  const match = message.match(
    /^invalid operation: (.+?) \(mismatched types (.+?) and (.+?)\)$/
  );
  if (!match) {
    return null;
  }

  const [, operation, leftType, rightType] = match;
  return {
    family: "mismatched-types",
    title: "Mismatched types",
    summary:
      "The operands of this operation have types that Go will not combine without an explicit conversion.",
    rawMessage: message,
    details: [
      { label: "Operation", kind: "code", value: operation, language: "go" },
      { label: "Left type", kind: "code", value: leftType, language: "go" },
      { label: "Right type", kind: "code", value: rightType, language: "go" },
    ],
  };
}

function parseReturnValueCount(message: string): ParsedDiagnostic | null {
  const match = message.match(RETURN_VALUE_COUNT_PATTERN);
  if (!match) {
    return null;
  }

  const [, kind, have, want] = match;
  return {
    family: "return-values",
    title:
      kind === "too many return values"
        ? "Too many return values"
        : "Not enough return values",
    summary:
      "The return statement does not match the result list in the function signature.",
    rawMessage: message,
    details: [
      { label: "Have", kind: "code", value: have, language: "go" },
      { label: "Want", kind: "code", value: want, language: "go" },
    ],
  };
}

function parseAssignmentMismatch(message: string): ParsedDiagnostic | null {
  const match = message.match(ASSIGNMENT_MISMATCH_PATTERN);
  if (!match) {
    return null;
  }

  const [, variables, source, values] = match;
  const details: ParsedDetail[] = [
    { label: "Variables on the left", kind: "text", value: variables },
    { label: "Values on the right", kind: "text", value: values },
  ];

  if (source) {
    details.push({
      label: "Returning function",
      kind: "code",
      value: source,
      language: "go",
    });
  }

  return {
    family: "assignment-mismatch",
    title: "Assignment mismatch",
    summary:
      "The number of variables on the left does not match the number of values on the right.",
    rawMessage: message,
    details,
  };
}

function parseMissingReturn(message: string): ParsedDiagnostic | null {
  if (message !== "missing return") {
    return null;
  }

  return {
    family: "missing-return",
    title: "Missing return",
    summary:
      "A function that declares result parameters must end in a return or other terminating statement.",
    rawMessage: message,
    details: [
      {
        label: "Expected statement",
        kind: "code",
        value: "return",
        language: "go",
      },
    ],
  };
}

function parseUnusedImport(message: string): ParsedDiagnostic | null {
  const match = message.match(/^"(.+?)" imported(?: as (.+?))? and not used$/);
  if (!match) {
    return null;
  }

  const [, packagePath, alias] = match;
  const details: ParsedDetail[] = [
    { label: "Package", kind: "code", value: packagePath, language: "go" },
  ];

  if (alias) {
    details.push({
      label: "Imported as",
      kind: "code",
      value: alias,
      language: "go",
    });
  }

  return {
    family: "unused-import",
    title: "Unused import",
    summary: "Go does not allow imported packages to go unused.",
    rawMessage: message,
    details,
  };
}

function parseUnusedVariable(message: string): ParsedDiagnostic | null {
  const match = message.match(/^declared and not used: (.+)$/);
  if (!match) {
    return null;
  }

  return {
    family: "unused-variable",
    title: "Unused variable",
    summary: "Go does not allow declared local variables to go unused.",
    rawMessage: message,
    details: [
      { label: "Variable", kind: "code", value: match[1], language: "go" },
    ],
  };
}

function createFallbackDiagnostic(message: string): ParsedDiagnostic {
  return {
    family: "fallback",
    title: "Go diagnostic",
    summary:
      "This diagnostic is preserved as-is because it does not match a specialized formatter rule yet.",
    rawMessage: message,
    details: [
      { label: "Message", kind: "code", value: message, language: "text" },
    ],
  };
}
