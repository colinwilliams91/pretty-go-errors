import { describe, expect, it } from "vitest";
import { parseGoplsAnalyzerDiagnostic } from "../src";

describe("parseGoplsAnalyzerDiagnostic", () => {
  it("formats SA6000 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA6000",
      "calling regexp.MatchString in a loop has poor performance, consider using regexp.Compile"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa6000");
    expect(parsed?.title).toBe(
      "Using `regexp.Match` or related in a loop, should use `regexp.Compile`"
    );
    expect(parsed?.rawMessage).toBe(
      "calling regexp.MatchString in a loop has poor performance, consider using regexp.Compile"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Function",
          value: "regexp.MatchString",
          kind: "code",
          language: "go",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value:
            "Compile the regular expression once outside the loop with regexp.Compile and reuse the returned *regexp.Regexp.",
        }),
      ])
    );
  });

  it("formats SA6000 diagnostics for the other regexp.Match variants", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA6000",
      "calling regexp.Match in a loop has poor performance, consider using regexp.Compile"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa6000");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Function",
          value: "regexp.Match",
        }),
      ])
    );
  });

  it("formats SA6002 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA6002",
      "argument should be pointer-like to avoid allocations"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa6002");
    expect(parsed?.title).toBe(
      "Storing non-pointer values in `sync.Pool` allocates memory"
    );
    expect(parsed?.rawMessage).toBe(
      "argument should be pointer-like to avoid allocations"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value:
            "Store a pointer (for example &myStruct or &slice[0]) in the pool instead of the value itself.",
        }),
      ])
    );
  });

  it("formats SA6005 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA6005",
      "should use strings.EqualFold instead"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa6005");
    expect(parsed?.title).toBe(
      "Inefficient string comparison with `strings.ToLower` or `strings.ToUpper`"
    );
    expect(parsed?.rawMessage).toBe("should use strings.EqualFold instead");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Replacement",
          value: "strings.EqualFold",
          kind: "code",
          language: "go",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value:
            "Compare the strings case-insensitively with strings.EqualFold instead of converting both sides with strings.ToLower or strings.ToUpper.",
        }),
      ])
    );
  });

  it("returns null for an unmatched message with a valid SA6xx code", () => {
    expect(
      parseGoplsAnalyzerDiagnostic("SA6000", "some unrelated message")
    ).toBeNull();
    expect(
      parseGoplsAnalyzerDiagnostic("SA6002", "some unrelated message")
    ).toBeNull();
    expect(
      parseGoplsAnalyzerDiagnostic("SA6005", "some unrelated message")
    ).toBeNull();
  });
});
