import { describe, expect, it } from "vitest";
import { parseGoplsAnalyzerDiagnostic } from "../src";

describe("parseGoplsAnalyzerDiagnostic", () => {
  it("formats SA5000 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5000",
      "assignment to nil map"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5000");
    expect(parsed?.title).toBe("Assignment to nil map");
    expect(parsed?.rawMessage).toBe("assignment to nil map");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value: expect.stringContaining("Initialize the map"),
        }),
      ])
    );
  });

  it("formats SA5001 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5001",
      "should check error returned from resp.Body.Close() before deferring resp.Body.Close()"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5001");
    expect(parsed?.title).toBe(
      "Deferring `Close` before checking for a possible error"
    );
    expect(parsed?.rawMessage).toBe(
      "should check error returned from resp.Body.Close() before deferring resp.Body.Close()"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Acquiring call",
          kind: "code",
          value: "resp.Body.Close()",
          language: "go",
        }),
        expect.objectContaining({
          label: "Deferred call",
          kind: "code",
          value: "resp.Body.Close()",
          language: "go",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA5002 diagnostics", () => {
    const race = parseGoplsAnalyzerDiagnostic(
      "SA5002",
      "loop condition never changes or has a race condition"
    );

    expect(race).not.toBeNull();
    expect(race?.family).toBe("sa5002");
    expect(race?.title).toBe(
      "The empty for loop (`for {}`) spins and can block the scheduler"
    );
    expect(race?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value: expect.stringContaining("channel receive"),
        }),
      ])
    );

    const spin = parseGoplsAnalyzerDiagnostic(
      "SA5002",
      "this loop will spin, using 100% CPU"
    );

    expect(spin).not.toBeNull();
    expect(spin?.family).toBe("sa5002");
    expect(spin?.title).toBe(
      "The empty for loop (`for {}`) spins and can block the scheduler"
    );
    expect(spin?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value: expect.stringContaining("`select {}`"),
        }),
      ])
    );
  });

  it("formats SA5003 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5003",
      "defers in this infinite loop will never run"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5003");
    expect(parsed?.title).toBe("Defers in infinite loops will never execute");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA5004 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5004",
      "should not have an empty default case in a for+select loop; the loop will spin"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5004");
    expect(parsed?.title).toBe(
      "`for { select { ...` with an empty default branch spins"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value: expect.stringContaining("Remove the empty `default` branch"),
        }),
      ])
    );
  });

  it("formats SA5007 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5007",
      "infinite recursive call"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5007");
    expect(parsed?.title).toBe("Infinite recursive call");
    expect(parsed?.rawMessage).toBe("infinite recursive call");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA5008 diagnostics with a duplicate tag key", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5008",
      'duplicate struct tag "json"'
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5008");
    expect(parsed?.title).toBe("Invalid struct tag");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Tag key",
          value: "json",
          kind: "text",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA5008 diagnostics for an unexported JSON field without a hint-mapped family", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5008",
      "unparseable struct tag: invalid syntax"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5008");
    expect(parsed?.title).toBe("Invalid struct tag");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Tag syntax error",
          value: "invalid syntax",
          kind: "text",
        }),
      ])
    );
    expect(parsed?.details.some((detail) => detail.label === "Hint")).toBe(
      false
    );
  });

  it("formats SA5008 diagnostics for an unknown XML option", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5008",
      'invalid XML tag: unknown option "omitEmpty"'
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5008");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Tag key",
          value: "xml",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Unknown option",
          value: "omitEmpty",
          kind: "text",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA5008 diagnostics for a non-ignored JSON tag on an unexported field", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5008",
      'unexported struct field cannot have non-ignored `json:"name"` tag'
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Tag key",
          value: "json",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Tag value",
          value: "name",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value: expect.stringContaining('`json:"-"`'),
        }),
      ])
    );
  });

  it("formats SA5008 diagnostics for a malformed JSON tag", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5008",
      "malformed `json` tag: invalid character 'x' before next option (expecting ',')"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Tag error",
          value: "invalid character 'x' before next option (expecting ',')",
          kind: "text",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA5008 diagnostics for the ignored-or-quoted-name question", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5008",
      'should encoding/json ignore this field or name it "-"? Either use `json:"-"` to ignore the field or use `json:"\'-\',"` to specify "-" as the name'
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Tag key",
          value: "json",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Object name",
          value: "-",
          kind: "text",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA5008 diagnostics for the format tag option ordering", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5008",
      "`format` tag option was not specified last"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Tag key",
          value: "json",
          kind: "text",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("returns null for an unmatched SA5008 variant", () => {
    expect(
      parseGoplsAnalyzerDiagnostic("SA5008", "invalid struct tag value")
    ).toBeNull();
  });

  it("formats SA5009 diagnostics when the format cannot be parsed", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5009",
      "couldn't parse format string"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5009");
    expect(parsed?.title).toBe("Invalid Printf call");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA5009 diagnostics when the call has too few arguments", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5009",
      "Printf format %d reads arg #2, but call has only 1 args"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5009");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Verb", value: "%d", kind: "text" }),
        expect.objectContaining({
          label: "Reads argument",
          value: "#2",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Arguments provided",
          value: "1",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value: expect.stringContaining("1-based"),
        }),
      ])
    );
  });

  it("formats SA5009 diagnostics when the argument type is wrong", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5009",
      "Printf format %d has arg #1 of wrong type string"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Verb", value: "%d", kind: "text" }),
        expect.objectContaining({
          label: "Argument",
          value: "#1",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Argument type",
          value: "string",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value: expect.stringContaining("`%v`"),
        }),
      ])
    );
  });

  it("formats SA5009 diagnostics when the argument count does not match", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA5009",
      "Printf call needs 1 args but has 2 args"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Arguments needed",
          value: "1",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Arguments provided",
          value: "2",
          kind: "text",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA5010 diagnostics with multiple method conflicts", () => {
    const message = [
      "impossible type assertion; io.ReadCloser and interface{Read([]byte) (int, error, error); Close() (error, bool)} contradict each other:",
      "\twrong type for Read method",
      "\t\thave func([]byte) (int, error)",
      "\t\twant func([]byte) (int, error, error)",
      "\twrong type for Close method",
      "\t\thave func() error",
      "\t\twant func() (error, bool)",
    ].join("\n");
    const parsed = parseGoplsAnalyzerDiagnostic("SA5010", message);

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa5010");
    expect(parsed?.title).toBe("Impossible type assertion");
    expect(parsed?.rawMessage).toBe(message);
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Asserted from",
          value: "io.ReadCloser",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Asserted to",
          value:
            "interface{Read([]byte) (int, error, error); Close() (error, bool)}",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Method signature conflicts",
          kind: "list",
          items: [
            "Read method: have func([]byte) (int, error), want func([]byte) (int, error, error)",
            "Close method: have func() error, want func() (error, bool)",
          ],
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("returns null for a message that is not a recognized SA5xx diagnostic", () => {
    expect(
      parseGoplsAnalyzerDiagnostic("SA5007", "some unrelated message")
    ).toBeNull();
  });
});
