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
