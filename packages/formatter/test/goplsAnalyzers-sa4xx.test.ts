import { describe, expect, it } from "vitest";
import { parseGoplsAnalyzerDiagnostic } from "../src";

describe("parseGoplsAnalyzerDiagnostic", () => {
  it("formats SA4000 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4000",
      "identical expressions on the left and right side of the '==' operator"
    );

    expect(parsed?.family).toBe("sa4000");
    expect(parsed?.title).toBe(
      "Binary operator has identical expressions on both sides"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Operator", value: "==" }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4001 diagnostics with an address-then-dereference expression", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4001",
      "&*x will be simplified to x. It will not copy x."
    );

    expect(parsed?.family).toBe("sa4001");
    expect(parsed?.title).toBe(
      "`&*x` gets simplified to `x`, it does not copy `x`"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Original expression",
          value: "&*x",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Simplifies to",
          value: "x",
          kind: "code",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4001 diagnostics with a dereference-then-address expression", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4001",
      "*&x will be simplified to x. It will not copy x."
    );

    expect(parsed?.family).toBe("sa4001");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Original expression",
          value: "*&x",
        }),
        expect.objectContaining({ label: "Simplifies to", value: "x" }),
      ])
    );
  });

  it("formats SA4003 diagnostics for a comparison against zero", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4003",
      "no value of type uint is less than 0"
    );

    expect(parsed?.family).toBe("sa4003");
    expect(parsed?.title).toBe(
      "Comparing unsigned values against negative values is pointless"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Type", value: "uint", kind: "code" }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4003 diagnostics for the other zero comparison", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4003",
      "every value of type uint8 is >= 0"
    );

    expect(parsed?.family).toBe("sa4003");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Type", value: "uint8" }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4003 diagnostics for a comparison against a nonzero bound", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4003",
      "no value of type uint8 is greater than 255"
    );

    expect(parsed?.family).toBe("sa4003");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Type", value: "uint8" }),
        expect.objectContaining({ label: "Bound", value: "255" }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4003 diagnostics for the other nonzero-bound comparison", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4003",
      "every value of type uint8 is <= 255"
    );

    expect(parsed?.family).toBe("sa4003");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Type", value: "uint8" }),
        expect.objectContaining({ label: "Bound", value: "255" }),
      ])
    );
  });

  it("formats SA4004 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4004",
      "the surrounding loop is unconditionally terminated"
    );

    expect(parsed?.family).toBe("sa4004");
    expect(parsed?.title).toBe(
      "The loop exits unconditionally after one iteration"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Hint" })])
    );
  });

  it("formats SA4005 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4005",
      "ineffective assignment to field User.Name"
    );

    expect(parsed?.family).toBe("sa4005");
    expect(parsed?.title).toBe(
      "Field assignment that will never be observed. Did you mean to use a pointer receiver?"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Type", value: "User", kind: "code" }),
        expect.objectContaining({
          label: "Field",
          value: "Name",
          kind: "code",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4006 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4006",
      "this value of err is never used"
    );

    expect(parsed?.family).toBe("sa4006");
    expect(parsed?.title).toBe(
      "A value assigned to a variable is never read before being overwritten. Forgotten error check or dead code?"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Variable",
          value: "err",
          kind: "code",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4008 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4008",
      "variable in loop condition never changes"
    );

    expect(parsed?.family).toBe("sa4008");
    expect(parsed?.title).toBe(
      "The variable in the loop condition never changes, are you incrementing the wrong variable?"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Hint" })])
    );
  });

  it("formats SA4009 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4009",
      "argument x is overwritten before first use"
    );

    expect(parsed?.family).toBe("sa4009");
    expect(parsed?.title).toBe(
      "A function argument is overwritten before its first use"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Argument",
          value: "x",
          kind: "code",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4010 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4010",
      "this result of append is never used, except maybe in other appends"
    );

    expect(parsed?.family).toBe("sa4010");
    expect(parsed?.title).toBe(
      "The result of `append` will never be observed anywhere"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Hint" })])
    );
  });

  it("formats SA4011 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4011",
      "ineffective break statement. Did you mean to break out of the outer loop?"
    );

    expect(parsed?.family).toBe("sa4011");
    expect(parsed?.title).toBe(
      "Break statement with no effect. Did you mean to break out of an outer loop?"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Hint" })])
    );
  });

  it("formats SA4017 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4017",
      "Replace doesn't have side effects and its return value is ignored"
    );

    expect(parsed?.family).toBe("sa4017");
    expect(parsed?.title).toBe(
      "Discarding the return values of a function without side effects, making the call pointless"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Function",
          value: "Replace",
          kind: "code",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4023 diagnostics for a plain interface nil comparison", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4023",
      "this comparison is always true"
    );

    expect(parsed?.family).toBe("sa4023");
    expect(parsed?.title).toBe(
      "Impossible comparison of interface value with untyped nil"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Outcome", value: "always" }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4023 diagnostics for a concretely typed lhs", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4023",
      "this comparison is never true; the lhs of the comparison has been assigned a concretely typed value"
    );

    expect(parsed?.family).toBe("sa4023");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Outcome", value: "never" }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA4031 diagnostics for a variable holding a function", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4031",
      "the checked variable contains a function and is never nil; did you mean to call it?"
    );

    expect(parsed?.family).toBe("sa4031");
    expect(parsed?.title).toBe("Checking never-nil value against nil");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          value: "Call the function first and check its result for nil.",
        }),
      ])
    );
  });

  it("formats SA4031 diagnostics for a function-valued check", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4031",
      "functions are never nil; did you mean to call it?"
    );

    expect(parsed?.family).toBe("sa4031");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          value: "Call the function first and check its result for nil.",
        }),
      ])
    );
  });

  it("formats SA4031 diagnostics for a fixed-outcome nil check", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA4031",
      "this nil check is never true"
    );

    expect(parsed?.family).toBe("sa4031");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Outcome", value: "never" }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("returns null for an unmatched message with a valid analyzer code", () => {
    expect(
      parseGoplsAnalyzerDiagnostic("SA4000", "some unrelated message")
    ).toBeNull();
    expect(
      parseGoplsAnalyzerDiagnostic("SA4006", "the value of x is never used")
    ).toBeNull();
  });
});
