import { describe, expect, it } from "vitest";
import { prettifyDiagnosticForHover } from "../src";
import { parseGoplsAnalyzerDiagnostic } from "../../formatter/src";

describe("prettifyDiagnosticForHover", () => {
  it("renders SA1002 diagnostics", () => {
    // Gopls sets `source` to the analyzer Name ("SA1002") and `code` to
    // "default" for Staticcheck analyzer diagnostics.
    const markdown = prettifyDiagnosticForHover({
      source: "SA1002",
      code: "default",
      message:
        'parsing time "Mon Jan _2 15:04:05 2006" as "Mon Jan _2 15:04:05 2006": cannot parse "_2 15:04:05 2006" as "_2"',
    });

    expect(markdown).toContain("### Invalid format in `time.Parse`");
    expect(markdown).toContain("Source: SA1002");
    // The meaningless "default" code is suppressed.
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Layout**");
    expect(markdown).toContain('cannot parse "_2 15:04:05 2006" as "_2"');
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA1004 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA1004",
      code: "default",
      message:
        "sleeping for 5 nanoseconds is probably a bug; be explicit if it isn't",
    });

    expect(markdown).toContain(
      "### Suspiciously small untyped constant in `time.Sleep`"
    );
    expect(markdown).toContain("Source: SA1004");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Nanoseconds**");
    expect(markdown).toContain("- **Hint:** Use a duration expression");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA1006 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA1006",
      code: "default",
      message:
        "printf-style function with dynamic format string and no further arguments should use print-style function instead",
    });

    expect(markdown).toContain(
      "### `Printf` with dynamic first argument and no further arguments"
    );
    expect(markdown).toContain("Source: SA1006");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:** Drop the trailing `f`");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA1008 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA1008",
      code: "default",
      message:
        'keys in http.Header are canonicalized, "etag" is not canonical; fix the constant or use http.CanonicalHeaderKey',
    });

    expect(markdown).toContain("### Non-canonical key in `http.Header` map");
    expect(markdown).toContain("Source: SA1008");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Header key**");
    expect(markdown).toContain("- **Hint:** Wrap the key in");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA1012 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA1012",
      code: "default",
      message:
        "do not pass a nil Context, even if a function permits it; pass context.TODO if you are unsure about which Context to use",
    });

    expect(markdown).toContain(
      "### A nil `context.Context` is being passed to a function, consider using `context.TODO` instead"
    );
    expect(markdown).toContain("Source: SA1012");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:** Replace the `nil` argument");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA1015 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA1015",
      code: "default",
      message:
        "using time.Tick leaks the underlying ticker, consider using it only in endless functions, tests and the main package, and use time.NewTicker here",
    });

    expect(markdown).toContain(
      "### Using `time.Tick` in a way that will leak. Consider using `time.NewTicker`, and only use `time.Tick` in tests, commands and endless functions"
    );
    expect(markdown).toContain("Source: SA1015");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:** Create the ticker with");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA1017 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA1017",
      code: "default",
      message: "the channel used with signal.Notify should be buffered",
    });

    expect(markdown).toContain(
      "### Channels used with `os/signal.Notify` should be buffered"
    );
    expect(markdown).toContain("Source: SA1017");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:** Create the channel with a buffer");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA1019 diagnostics", () => {
    const message =
      "ioutil.TempFile has been deprecated since Go 1.16: Use os.CreateTemp instead";
    const markdown = prettifyDiagnosticForHover({
      source: "SA1019",
      code: "default",
      message,
    });

    expect(markdown).toContain(
      "### Using a deprecated function, variable, constant or field"
    );
    expect(markdown).toContain("Source: SA1019");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**API**");
    expect(markdown).toContain("- **Deprecated since:** Go 1.16");
    expect(markdown).toContain("- **Hint:** Use os.CreateTemp instead of");
    expect(markdown).toContain("**Original diagnostic**");
    // The hover is built from the same shared analyzer parser.
    expect(parseGoplsAnalyzerDiagnostic("SA1019", message)?.title).toBe(
      "Using a deprecated function, variable, constant or field"
    );
  });

  it("renders SA1029 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA1029",
      code: "default",
      message:
        "should not use built-in type string as key for value; define your own type to avoid collisions",
    });

    expect(markdown).toContain(
      "### Inappropriate key in call to `context.WithValue`"
    );
    expect(markdown).toContain("Source: SA1029");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Key type**");
    expect(markdown).toContain("- **Hint:** Define your own named type");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA1032 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA1032",
      code: "default",
      message: "arguments have the wrong order",
    });

    expect(markdown).toContain("### Wrong order of arguments to `errors.Is`");
    expect(markdown).toContain("Source: SA1032");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:** Call `errors.Is(err, sentinel)`");
    expect(markdown).toContain("**Original diagnostic**");
  });
});
