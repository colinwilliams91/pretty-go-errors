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

export function parseGoDiagnostic(message: string): ParsedDiagnostic {
  const rawMessage = compactLines(message);

  return (
    parseCallArgumentCount(rawMessage) ??
    parseCannotUse(rawMessage) ??
    parseCannotConvert(rawMessage) ??
    parseUndefined(rawMessage) ??
    parseUnknownField(rawMessage) ??
    parseMissingModule(rawMessage) ??
    parsePackageStd(rawMessage) ??
    parseNotAType(rawMessage) ??
    parseGenericWithoutInstantiation(rawMessage) ??
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
