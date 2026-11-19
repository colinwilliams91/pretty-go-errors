import { describe, expect, it } from "vitest";
import { parseGoplsAnalyzerDiagnostic } from "../src";

describe("parseGoplsAnalyzerDiagnostic", () => {
  it("formats SA9001 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA9001",
      "defers in this range loop won't run unless the channel gets closed"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa9001");
    expect(parsed?.title).toBe(
      "Defers in range loops may not run when you expect them to"
    );
    expect(parsed?.rawMessage).toBe(
      "defers in this range loop won't run unless the channel gets closed"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value:
            "Defer inside a function called from the loop body so each iteration's cleanup runs, or close the channel and let the defers run when the enclosing function returns.",
        }),
      ])
    );
  });

  it("formats SA9002 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA9002",
      "file mode '777' evaluates to 01411; did you mean '0777'?"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa9002");
    expect(parsed?.title).toBe(
      "Using a non-octal `os.FileMode` that looks like it was meant to be in octal"
    );
    expect(parsed?.rawMessage).toBe(
      "file mode '777' evaluates to 01411; did you mean '0777'?"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Mode literal",
          value: "777",
          kind: "code",
          language: "text",
        }),
        expect.objectContaining({
          label: "Evaluated mode",
          value: "01411",
          kind: "code",
          language: "text",
        }),
        expect.objectContaining({
          label: "Intended mode",
          value: "0777",
          kind: "code",
          language: "go",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value:
            "Write file modes with the 0o prefix (for example 0o644) or a leading 0 so the digits are interpreted as octal.",
        }),
      ])
    );
  });

  it("returns null for an unmatched message with a valid SA9xx code", () => {
    expect(
      parseGoplsAnalyzerDiagnostic("SA9001", "some unrelated message")
    ).toBeNull();
    expect(
      parseGoplsAnalyzerDiagnostic("SA9002", "some unrelated message")
    ).toBeNull();
  });
});
