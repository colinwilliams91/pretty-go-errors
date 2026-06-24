import { describe, expect, it } from "vitest";
import { prettifyDiagnosticForHover } from "../src";

describe("prettifyDiagnosticForHover", () => {
  it("renders structured markdown for known diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "gopls",
      code: "compiler",
      message:
        "cannot use value (value of type int) as string value in assignment",
    });

    expect(markdown).toContain("### Type mismatch");
    expect(markdown).toContain("Source: gopls");
    expect(markdown).toContain("**Actual type**");
    expect(markdown).toContain("```go\nint\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("falls back cleanly for unknown diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      message: "mystery diagnostic",
    });
    expect(markdown).toContain("### Go diagnostic");
    expect(markdown).toContain("mystery diagnostic");
  });

  it("renders missing field or method diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "compiler",
      code: "MissingFieldOrMethod",
      message:
        "config.Theme undefined (type *Config has no field or method Theme)",
    });

    expect(markdown).toContain("### Missing field or method");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("Code: MissingFieldOrMethod");
    expect(markdown).toContain("**Receiver type**");
    expect(markdown).toContain("```go\n*Config\n```");
    expect(markdown).toContain("**Missing member**");
    expect(markdown).toContain("```go\nTheme\n```");
  });

  it("renders missing conversion argument diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "compiler",
      code: "WrongArgCount",
      message: "missing argument in conversion to CustomType",
    });

    expect(markdown).toContain("### Missing conversion argument");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("Code: WrongArgCount");
    expect(markdown).toContain("**Target type**");
    expect(markdown).toContain("```go\nCustomType\n```");
  });

  it("renders non-local method receiver diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "compiler",
      code: "InvalidRecv",
      message: "cannot define new methods on non-local type uint32",
    });

    expect(markdown).toContain("### Invalid method receiver");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("Code: InvalidRecv");
    expect(markdown).toContain("**Receiver type**");
    expect(markdown).toContain("```go\nuint32\n```");
  });

  it("renders expected operand diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "syntax",
      message: "expected operand, found '{'",
    });

    expect(markdown).toContain("### Expected operand");
    expect(markdown).toContain("Source: syntax");
    expect(markdown).toContain("**Found token**");
    expect(markdown).toContain("```text\n'{'\n```");
  });

  it("renders missing comma diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "syntax",
      message: "missing ',' in argument list",
    });

    expect(markdown).toContain("### Missing comma");
    expect(markdown).toContain("Source: syntax");
    expect(markdown).toContain("- **Context:** argument list");
    expect(markdown).toContain("**Expected token**");
    expect(markdown).toContain("```text\n,\n```");
  });

  it("renders mismatched types diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "compiler",
      code: "MismatchedTypes",
      message:
        'invalid operation: 1 + "a" (mismatched types untyped int and untyped string)',
    });

    expect(markdown).toContain("### Mismatched types");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("**Left type**");
    expect(markdown).toContain("```go\nuntyped int\n```");
    expect(markdown).toContain("**Right type**");
    expect(markdown).toContain("```go\nuntyped string\n```");
  });

  it("renders return value count diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "compiler",
      code: "WrongResultCount",
      message: "not enough return values\n\thave (number)\n\twant (int, int)",
    });

    expect(markdown).toContain("### Not enough return values");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("**Have**");
    expect(markdown).toContain("```go\nnumber\n```");
    expect(markdown).toContain("**Want**");
    expect(markdown).toContain("```go\nint, int\n```");
  });

  it("renders assignment mismatch diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "compiler",
      code: "WrongAssignCount",
      message: "assignment mismatch: 1 variable but two returns 2 values",
    });

    expect(markdown).toContain("### Assignment mismatch");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("- **Variables on the left:** 1");
    expect(markdown).toContain("- **Values on the right:** 2");
    expect(markdown).toContain("**Returning function**");
    expect(markdown).toContain("```go\ntwo\n```");
  });

  it("renders missing return diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "compiler",
      code: "MissingReturn",
      message: "missing return",
    });

    expect(markdown).toContain("### Missing return");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("**Expected statement**");
    expect(markdown).toContain("```go\nreturn\n```");
  });

  it("renders unused import diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "compiler",
      code: "UnusedImport",
      message: '"math/rand" imported as r and not used',
    });

    expect(markdown).toContain("### Unused import");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("**Package**");
    expect(markdown).toContain("```go\nmath/rand\n```");
    expect(markdown).toContain("**Imported as**");
    expect(markdown).toContain("```go\nr\n```");
  });

  it("renders unused variable diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "compiler",
      code: "UnusedVar",
      message: "declared and not used: count",
    });

    expect(markdown).toContain("### Unused variable");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("**Variable**");
    expect(markdown).toContain("```go\ncount\n```");
  });

  it("falls back cleanly when a partially similar diagnostic does not match a rule", () => {
    const markdown = prettifyDiagnosticForHover({
      message: "cannot use value with an unexpected diagnostic layout",
    });

    expect(markdown).toContain("### Go diagnostic");
    expect(markdown).toContain(
      "does not match a specialized formatter rule yet"
    );
  });
});
