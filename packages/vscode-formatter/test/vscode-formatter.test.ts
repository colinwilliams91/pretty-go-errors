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
        'huh.NewGroup(huh.NewMultiSelect[string]().Options(huh.NewOption("copilot", "copilot"), huh.NewOption("claude", "claude"), huh.NewOption("codex", "codex"), huh.NewOption("cursor", "cursor")).Key("Harnesses").Title("Select one or more AI Harnesses to support").Value(&config.harnessSelections)).Skip undefined (type *huh.Group has no field or method Skip)',
    });

    expect(markdown).toContain("### Missing field or method");
    expect(markdown).toContain("Source: compiler");
    expect(markdown).toContain("Code: MissingFieldOrMethod");
    expect(markdown).toContain("**Receiver type**");
    expect(markdown).toContain("```go\n*huh.Group\n```");
    expect(markdown).toContain("**Missing member**");
    expect(markdown).toContain("```go\nSkip\n```");
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
