import { describe, expect, it } from "vitest";
import { parseGoplsAnalyzerDiagnostic } from "../src";

describe("parseGoplsAnalyzerDiagnostic", () => {
  it("formats SA1000 diagnostics with a missing parenthesis", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1000",
      "error parsing regexp: missing closing ): `(`"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa1000");
    expect(parsed?.title).toBe("Invalid regular expression");
    expect(parsed?.summary).toBe(
      "This regular expression cannot be compiled by the regexp package."
    );
    expect(parsed?.rawMessage).toBe(
      "error parsing regexp: missing closing ): `(`"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Pattern", value: "(", kind: "code" }),
        expect.objectContaining({
          label: "Reason",
          value: "missing closing )",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value: "There is an unbalanced `(` with no matching `)`.",
        }),
      ])
    );
  });

  it("formats SA1000 diagnostics with an invalid escape sequence", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1000",
      "error parsing regexp: invalid escape sequence: `\\y`"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa1000");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Pattern", value: "\\y" }),
        expect.objectContaining({
          label: "Reason",
          value: "invalid escape sequence",
        }),
        expect.objectContaining({
          label: "Hint",
          value:
            "Use a valid escape (`\\d`, `\\w`, `\\s`, `\\b`, `\\A`, `\\z`, ...) or escape a literal backslash as `\\\\`.",
        }),
      ])
    );
  });

  it("omits the Hint detail when the reason has no mapped hint", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1000",
      "error parsing regexp: some made up reason: `x`"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.details.some((detail) => detail.label === "Hint")).toBe(
      false
    );
  });

  it("handles the internal error code whose reason itself contains a colon", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1000",
      "error parsing regexp: regexp/syntax: internal error: `(`"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa1000");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Reason",
          value: "regexp/syntax: internal error",
        }),
        expect.objectContaining({ label: "Pattern", value: "(" }),
      ])
    );
  });

  it("returns null for an unregistered analyzer code", () => {
    expect(parseGoplsAnalyzerDiagnostic("SA9999", "anything")).toBeNull();
  });

  it("returns null for a message that is not a regexp error even with the SA1000 code", () => {
    expect(
      parseGoplsAnalyzerDiagnostic("SA1000", "some unrelated message")
    ).toBeNull();
  });
});
