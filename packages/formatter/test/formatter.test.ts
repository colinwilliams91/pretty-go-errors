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

  it("falls back for unmatched diagnostics", () => {
    const parsed = parseGoDiagnostic("made up diagnostic");
    expect(parsed.family).toBe("fallback");
    expect(parsed.rawMessage).toBe("made up diagnostic");
  });
});
