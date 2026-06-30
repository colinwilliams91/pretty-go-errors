import { describe, expect, it } from "vitest";
import { parseGoDiagnostic } from "../src";

describe("parseGoDiagnostic", () => {
  it("formats cannot use diagnostics with interface details", () => {
    const parsed = parseGoDiagnostic(
      "cannot use value (value of type *bytes.Buffer) as io.Reader value in assignment: *bytes.Buffer does not implement io.Reader (missing method Read)"
    );

    expect(parsed.family).toBe("cannot-use");
    expect(parsed.title).toBe("Type mismatch");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Actual type",
          value: "*bytes.Buffer",
        }),
        expect.objectContaining({ label: "Expected type", value: "io.Reader" }),
        expect.objectContaining({ label: "Missing method", value: "Read" }),
      ])
    );
  });

  it("formats cannot use diagnostics with a variable of type phrase", () => {
    const parsed = parseGoDiagnostic(
      "cannot use v.Middle.Inner.Value (variable of type int) as string value in assignment"
    );

    expect(parsed.family).toBe("cannot-use");
    expect(parsed.title).toBe("Type mismatch");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Value",
          value: "v.Middle.Inner.Value",
        }),
        expect.objectContaining({ label: "Actual type", value: "int" }),
        expect.objectContaining({
          label: "Expected type",
          value: "string",
        }),
        expect.objectContaining({
          label: "Context",
          value: "assignment",
        }),
      ])
    );
  });

  it("formats cannot use diagnostics with a constant of type phrase", () => {
    const parsed = parseGoDiagnostic(
      "cannot use untyped constant (constant of type int) as string value in assignment"
    );

    expect(parsed.family).toBe("cannot-use");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Value",
          value: "untyped constant",
        }),
        expect.objectContaining({ label: "Actual type", value: "int" }),
        expect.objectContaining({
          label: "Expected type",
          value: "string",
        }),
        expect.objectContaining({
          label: "Context",
          value: "assignment",
        }),
      ])
    );
  });

  it("formats undefined diagnostics", () => {
    const parsed = parseGoDiagnostic("undefined: fmt.Prinln");
    expect(parsed.family).toBe("undefined");
    expect(parsed.details[0]).toEqual(
      expect.objectContaining({ label: "Identifier", value: "fmt.Prinln" })
    );
  });

  it("formats argument count diagnostics", () => {
    const parsed = parseGoDiagnostic(
      "too many arguments in call to greet\n\thave (string, string)\n\twant (string)"
    );

    expect(parsed.family).toBe("call-arguments");
    expect(parsed.title).toBe("Too many arguments");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Have", value: "string, string" }),
        expect.objectContaining({ label: "Want", value: "string" }),
      ])
    );
  });

  it("formats missing field or method diagnostics", () => {
    const parsed = parseGoDiagnostic(
      "config.Theme undefined (type *Config has no field or method Theme)"
    );

    expect(parsed.family).toBe("missing-field-or-method");
    expect(parsed.title).toBe("Missing field or method");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Expression",
          value: "config.Theme",
        }),
        expect.objectContaining({
          label: "Receiver type",
          value: "*Config",
        }),
        expect.objectContaining({
          label: "Missing member",
          value: "Theme",
        }),
      ])
    );
  });

  it("formats missing conversion argument diagnostics", () => {
    const parsed = parseGoDiagnostic(
      "missing argument in conversion to CustomType"
    );

    expect(parsed.family).toBe("conversion-arguments");
    expect(parsed.title).toBe("Missing conversion argument");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Target type",
          value: "CustomType",
        }),
      ])
    );
  });

  it("formats non-local method receiver diagnostics", () => {
    const parsed = parseGoDiagnostic(
      "cannot define new methods on non-local type uint32"
    );

    expect(parsed.family).toBe("non-local-method-definition");
    expect(parsed.title).toBe("Invalid method receiver");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Receiver type",
          value: "uint32",
        }),
      ])
    );
  });

  it("formats expected operand diagnostics", () => {
    const parsed = parseGoDiagnostic("expected operand, found '{'");

    expect(parsed.family).toBe("expected-operand");
    expect(parsed.title).toBe("Expected operand");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Found token",
          value: "'{'",
        }),
      ])
    );
  });

  it("formats missing comma diagnostics", () => {
    const parsed = parseGoDiagnostic("missing ',' in argument list");

    expect(parsed.family).toBe("missing-comma");
    expect(parsed.title).toBe("Missing comma");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Context",
          value: "argument list",
        }),
        expect.objectContaining({
          label: "Expected token",
          value: ",",
        }),
      ])
    );
  });

  it("formats mismatched types diagnostics", () => {
    const parsed = parseGoDiagnostic(
      'invalid operation: 1 + "a" (mismatched types untyped int and untyped string)'
    );

    expect(parsed.family).toBe("mismatched-types");
    expect(parsed.title).toBe("Mismatched types");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Operation", value: '1 + "a"' }),
        expect.objectContaining({ label: "Left type", value: "untyped int" }),
        expect.objectContaining({
          label: "Right type",
          value: "untyped string",
        }),
      ])
    );
  });

  it("formats return value count diagnostics", () => {
    const parsed = parseGoDiagnostic(
      "too many return values\n\thave (number, number)\n\twant (int)"
    );

    expect(parsed.family).toBe("return-values");
    expect(parsed.title).toBe("Too many return values");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Have", value: "number, number" }),
        expect.objectContaining({ label: "Want", value: "int" }),
      ])
    );
  });

  it("formats return value count diagnostics when the function declares no return values", () => {
    const parsed = parseGoDiagnostic(
      "too many return values\n\thave (bool)\n\twant ()"
    );

    expect(parsed.family).toBe("return-values");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Have", value: "bool" }),
        expect.objectContaining({
          label: "Want",
          value: "// no return values",
        }),
      ])
    );
  });

  it("formats assignment mismatch diagnostics with a returning function", () => {
    const parsed = parseGoDiagnostic(
      "assignment mismatch: 1 variable but two returns 2 values"
    );

    expect(parsed.family).toBe("assignment-mismatch");
    expect(parsed.title).toBe("Assignment mismatch");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Variables on the left",
          value: "1",
        }),
        expect.objectContaining({ label: "Values on the right", value: "2" }),
        expect.objectContaining({ label: "Returning function", value: "two" }),
      ])
    );
  });

  it("formats assignment mismatch diagnostics without a function", () => {
    const parsed = parseGoDiagnostic(
      "assignment mismatch: 2 variables but 1 value"
    );

    expect(parsed.family).toBe("assignment-mismatch");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Variables on the left",
          value: "2",
        }),
        expect.objectContaining({ label: "Values on the right", value: "1" }),
      ])
    );
    expect(
      parsed.details.some((detail) => detail.label === "Returning function")
    ).toBe(false);
  });

  it("formats missing return diagnostics", () => {
    const parsed = parseGoDiagnostic("missing return");

    expect(parsed.family).toBe("missing-return");
    expect(parsed.title).toBe("Missing return");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Expected statement",
          value: "return",
        }),
      ])
    );
  });

  it("formats unused import diagnostics", () => {
    const parsed = parseGoDiagnostic('"fmt" imported and not used');

    expect(parsed.family).toBe("unused-import");
    expect(parsed.title).toBe("Unused import");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Package", value: "fmt" }),
      ])
    );
  });

  it("formats aliased unused import diagnostics", () => {
    const parsed = parseGoDiagnostic('"math/rand" imported as r and not used');

    expect(parsed.family).toBe("unused-import");
    expect(parsed.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Package", value: "math/rand" }),
        expect.objectContaining({ label: "Imported as", value: "r" }),
      ])
    );
  });

  it("formats unused variable diagnostics", () => {
    const parsed = parseGoDiagnostic("declared and not used: count");

    expect(parsed.family).toBe("unused-variable");
    expect(parsed.title).toBe("Unused variable");
    expect(parsed.details[0]).toEqual(
      expect.objectContaining({ label: "Variable", value: "count" })
    );
  });

  it("falls back for unmatched diagnostics", () => {
    const parsed = parseGoDiagnostic("made up diagnostic");
    expect(parsed.family).toBe("fallback");
    expect(parsed.rawMessage).toBe("made up diagnostic");
  });
});
