import { describe, expect, it } from "vitest";
import { parseGoplsAnalyzerDiagnostic } from "../src";

describe("parseGoplsAnalyzerDiagnostic", () => {
  it("formats SA3000 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA3000",
      "TestMain should call os.Exit to set exit code"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa3000");
    expect(parsed?.title).toBe(
      "`TestMain` doesn't call `os.Exit`, hiding test failures"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Suggested pattern",
          kind: "code",
          value: "func TestMain(m *testing.M) {\n\tos.Exit(m.Run())\n}",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value:
            "End TestMain with `os.Exit(m.Run())` so the test binary exits with the code reported by the tests.",
        }),
      ])
    );
  });

  it("returns null for an SA3xx message that does not match the known template", () => {
    expect(
      parseGoplsAnalyzerDiagnostic(
        "SA3000",
        "TestMain is missing something unrelated"
      )
    ).toBeNull();
  });
});
