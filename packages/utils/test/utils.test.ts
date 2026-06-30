import { describe, expect, it } from "vitest";
import {
  compactLines,
  escapeMarkdownInlineCode,
  formatGoMethodChain,
  normalizeDiagnosticCode,
} from "../src";

describe("formatGoMethodChain", () => {
  it("breaks long fluent chains after each chained call, keeping the dot trailing", () => {
    const input = 'db.Where("active").Order("name").Limit(10).Find(&users)';
    expect(formatGoMethodChain(input)).toBe(
      'db.Where("active").\n\tOrder("name").\n\tLimit(10).\n\tFind(&users)'
    );
  });

  it("leaves short chains inline (below the length threshold)", () => {
    expect(formatGoMethodChain("a.B().C().D()")).toBe("a.B().C().D()");
  });

  it("does not break a chain with only one fluent boundary", () => {
    const input = "someReceiver.FirstCall().SecondCall()";
    expect(formatGoMethodChain(input)).toBe(input);
  });

  it("does not split selectors that are not method-call results", () => {
    const input = "package.path.subpkg.LongFunctionNameThatIsQuiteVerbose";
    expect(formatGoMethodChain(input)).toBe(input);
  });

  it("ignores dots inside string arguments", () => {
    const input =
      'client.Get("https://example.com/a.b.c").Decode(&out).Close()';
    expect(formatGoMethodChain(input)).toBe(
      'client.Get("https://example.com/a.b.c").\n\tDecode(&out).\n\tClose()'
    );
  });

  it("does not break chains nested inside call arguments", () => {
    const input = "outer.Build(inner.A().B().C().D()).Done()";
    // Only the single top-level `).Done` boundary exists, so it stays inline.
    expect(formatGoMethodChain(input)).toBe(input);
  });

  it("preserves input that already contains newlines", () => {
    const input = "struct {\n\tName string\n\tAge  int\n}";
    expect(formatGoMethodChain(input)).toBe(input);
  });

  it("returns simple identifiers and types untouched", () => {
    expect(formatGoMethodChain("int")).toBe("int");
    expect(formatGoMethodChain("*Config")).toBe("*Config");
    expect(formatGoMethodChain("int, int")).toBe("int, int");
  });
});

describe("compactLines", () => {
  it("trims trailing whitespace and drops blank interior lines", () => {
    expect(compactLines("a  \n\nb \n")).toBe("a\nb");
  });
});

describe("escapeMarkdownInlineCode", () => {
  it("escapes backslashes and backticks", () => {
    expect(escapeMarkdownInlineCode("a`b\\c")).toBe("a\\`b\\\\c");
  });
});

describe("normalizeDiagnosticCode", () => {
  it("passes through a string code", () => {
    expect(normalizeDiagnosticCode("SA1000")).toBe("SA1000");
  });

  it("passes through a numeric code", () => {
    expect(normalizeDiagnosticCode(42)).toBe(42);
  });

  it("unwraps the { value } object form gopls sends", () => {
    expect(normalizeDiagnosticCode({ value: "SA1000" })).toBe("SA1000");
  });

  it("unwraps a numeric value inside the object form", () => {
    expect(normalizeDiagnosticCode({ value: 7 })).toBe(7);
  });

  it("returns undefined for undefined", () => {
    expect(normalizeDiagnosticCode(undefined)).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(normalizeDiagnosticCode(null)).toBeUndefined();
  });
});
