import { describe, expect, it } from "vitest";
import { parseGoplsAnalyzerDiagnostic } from "../src";

describe("parseGoplsAnalyzerDiagnostic", () => {
  it("formats SA1002 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1002",
      'parsing time "Mon Jan _2 15:04:05 2006" as "Mon Jan _2 15:04:05 2006": cannot parse "_2 15:04:05 2006" as "_2"'
    );

    expect(parsed?.family).toBe("sa1002");
    expect(parsed?.title).toBe("Invalid format in `time.Parse`");
    expect(parsed?.summary).toBe(
      "The layout string cannot parse the value because its elements do not line up with Go's reference-time layout."
    );
    expect(parsed?.rawMessage).toBe(
      'parsing time "Mon Jan _2 15:04:05 2006" as "Mon Jan _2 15:04:05 2006": cannot parse "_2 15:04:05 2006" as "_2"'
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Value",
          value: "Mon Jan _2 15:04:05 2006",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Layout",
          value: "Mon Jan _2 15:04:05 2006",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Parse error",
          value: 'cannot parse "_2 15:04:05 2006" as "_2"',
          kind: "text",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA1002 diagnostics that only carry a message", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1002",
      'parsing time "2006-01-02T15:04:05Z07:00": extra text: "07:00"'
    );

    expect(parsed?.family).toBe("sa1002");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Value",
          value: "2006-01-02T15:04:05Z07:00",
        }),
        expect.objectContaining({
          label: "Parse error",
          value: 'extra text: "07:00"',
        }),
        expect.objectContaining({
          label: "Hint",
          value: expect.stringContaining("layout"),
        }),
      ])
    );
  });

  it("formats SA1004 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1004",
      "sleeping for 5 nanoseconds is probably a bug; be explicit if it isn't"
    );

    expect(parsed?.family).toBe("sa1004");
    expect(parsed?.title).toBe(
      "Suspiciously small untyped constant in `time.Sleep`"
    );
    expect(parsed?.rawMessage).toBe(
      "sleeping for 5 nanoseconds is probably a bug; be explicit if it isn't"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Nanoseconds",
          value: "5",
          kind: "code",
        }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA1006 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1006",
      "printf-style function with dynamic format string and no further arguments should use print-style function instead"
    );

    expect(parsed?.family).toBe("sa1006");
    expect(parsed?.title).toBe(
      "`Printf` with dynamic first argument and no further arguments"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          value: expect.stringContaining("errors.New"),
        }),
      ])
    );
  });

  it("formats SA1008 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1008",
      'keys in http.Header are canonicalized, "etag" is not canonical; fix the constant or use http.CanonicalHeaderKey'
    );

    expect(parsed?.family).toBe("sa1008");
    expect(parsed?.title).toBe("Non-canonical key in `http.Header` map");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Header key",
          value: "etag",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Canonical form",
          value: "Etag",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Hint",
          value: expect.stringContaining("http.CanonicalHeaderKey"),
        }),
      ])
    );
  });

  it("formats SA1012 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1012",
      "do not pass a nil Context, even if a function permits it; pass context.TODO if you are unsure about which Context to use"
    );

    expect(parsed?.family).toBe("sa1012");
    expect(parsed?.title).toBe(
      "A nil `context.Context` is being passed to a function, consider using `context.TODO` instead"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          value: expect.stringContaining("context.TODO"),
        }),
      ])
    );
  });

  it("formats SA1015 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1015",
      "using time.Tick leaks the underlying ticker, consider using it only in endless functions, tests and the main package, and use time.NewTicker here"
    );

    expect(parsed?.family).toBe("sa1015");
    expect(parsed?.title).toBe(
      "Using `time.Tick` in a way that will leak. Consider using `time.NewTicker`, and only use `time.Tick` in tests, commands and endless functions"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          value: expect.stringContaining("time.NewTicker"),
        }),
      ])
    );
  });

  it("formats SA1017 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1017",
      "the channel used with signal.Notify should be buffered"
    );

    expect(parsed?.family).toBe("sa1017");
    expect(parsed?.title).toBe(
      "Channels used with `os/signal.Notify` should be buffered"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          value: expect.stringContaining("make(chan os.Signal, 1)"),
        }),
      ])
    );
  });

  it("formats SA1019 diagnostics with a deprecation notice", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1019",
      "ioutil.TempFile has been deprecated since Go 1.16: Use os.CreateTemp instead"
    );

    expect(parsed?.family).toBe("sa1019");
    expect(parsed?.title).toBe(
      "Using a deprecated function, variable, constant or field"
    );
    expect(parsed?.rawMessage).toBe(
      "ioutil.TempFile has been deprecated since Go 1.16: Use os.CreateTemp instead"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "API",
          value: "ioutil.TempFile",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Deprecated since",
          value: "Go 1.16",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Deprecation notice",
          value: "Use os.CreateTemp instead",
          kind: "text",
        }),
        expect.objectContaining({
          label: "Hint",
          value: "Use os.CreateTemp instead of ioutil.TempFile.",
        }),
      ])
    );
  });

  it("omits the SA1019 Hint when the notice names no replacement", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1019",
      "rc4.NewCipher has been deprecated since Go 1.0 because it shouldn't be used: RC4 is cryptographically broken and should not be used for secure applications."
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Deprecated since",
          value: "Go 1.0",
        }),
        expect.objectContaining({
          label: "Deprecation notice",
          value:
            "RC4 is cryptographically broken and should not be used for secure applications.",
        }),
      ])
    );
    expect(parsed?.details.some((detail) => detail.label === "Hint")).toBe(
      false
    );
  });

  it("formats SA1019 diagnostics with an alternative available since an earlier version", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1019",
      "ioutil.ReadFile has been deprecated since Go 1.16 and an alternative has been available since Go 1.0: Use os.ReadFile instead"
    );

    expect(parsed?.family).toBe("sa1019");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "API", value: "ioutil.ReadFile" }),
        expect.objectContaining({
          label: "Deprecated since",
          value: "Go 1.16",
        }),
        expect.objectContaining({
          label: "Alternative available since",
          value: "Go 1.0",
        }),
        expect.objectContaining({
          label: "Deprecation notice",
          value: "Use os.ReadFile instead",
        }),
        expect.objectContaining({
          label: "Hint",
          value: "Use os.ReadFile instead of ioutil.ReadFile.",
        }),
      ])
    );
  });

  it("formats SA1019 diagnostics for deprecated packages", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1019",
      "github.com/golang/protobuf/proto is deprecated: Use google.golang.org/protobuf instead."
    );

    expect(parsed?.family).toBe("sa1019");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "API",
          value: "github.com/golang/protobuf/proto",
        }),
        expect.objectContaining({
          label: "Deprecation notice",
          value: "Use google.golang.org/protobuf instead.",
        }),
        expect.objectContaining({
          label: "Hint",
          value:
            "Use google.golang.org/protobuf instead of github.com/golang/protobuf/proto.",
        }),
      ])
    );
  });

  it("formats SA1029 diagnostics for built-in key types", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1029",
      "should not use built-in type string as key for value; define your own type to avoid collisions"
    );

    expect(parsed?.family).toBe("sa1029");
    expect(parsed?.title).toBe(
      "Inappropriate key in call to `context.WithValue`"
    );
    expect(parsed?.rawMessage).toBe(
      "should not use built-in type string as key for value; define your own type to avoid collisions"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Key type",
          value: "string",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Hint",
          value: expect.stringContaining("type contextKey struct{}"),
        }),
      ])
    );
  });

  it("formats SA1029 diagnostics for built-in key types reached through an alias", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1029",
      "should not use built-in type string (via alias MyString) as key for value; define your own type to avoid collisions"
    );

    expect(parsed?.family).toBe("sa1029");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Key type", value: "string" }),
        expect.objectContaining({ label: "Alias type", value: "MyString" }),
        expect.objectContaining({ label: "Hint", kind: "text" }),
      ])
    );
  });

  it("formats SA1029 diagnostics for non-comparable key types", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1029",
      "keys used with context.WithValue must be comparable, but type []int is not comparable"
    );

    expect(parsed?.family).toBe("sa1029");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Key type",
          value: "[]int",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Hint",
          value: expect.stringContaining("comparable"),
        }),
      ])
    );
  });

  it("formats SA1032 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA1032",
      "arguments have the wrong order"
    );

    expect(parsed?.family).toBe("sa1032");
    expect(parsed?.title).toBe("Wrong order of arguments to `errors.Is`");
    expect(parsed?.rawMessage).toBe("arguments have the wrong order");
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          value: expect.stringContaining("errors.Is(err, io.EOF)"),
        }),
      ])
    );
  });

  it("returns null for an unmatched message with a valid SA1xx code", () => {
    expect(
      parseGoplsAnalyzerDiagnostic("SA1002", "unrelated message")
    ).toBeNull();
    expect(
      parseGoplsAnalyzerDiagnostic("SA1004", "sleeping for a while")
    ).toBeNull();
    expect(parseGoplsAnalyzerDiagnostic("SA1006", "different text")).toBeNull();
    expect(
      parseGoplsAnalyzerDiagnostic(
        "SA1019",
        "has been deprecated since Go 1.18"
      )
    ).toBeNull();
    expect(
      parseGoplsAnalyzerDiagnostic(
        "SA1029",
        "keys used with context.WithValue must be comparable"
      )
    ).toBeNull();
    expect(parseGoplsAnalyzerDiagnostic("SA1032", "wrong order")).toBeNull();
  });
});
