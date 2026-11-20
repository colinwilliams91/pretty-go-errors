import { describe, expect, it } from "vitest";
import { prettifyDiagnosticForHover } from "../src";

describe("prettifyDiagnosticForHover", () => {
  it("renders SA6000 diagnostics", () => {
    // Gopls sets source = analyzer Name, code = "default".
    const markdown = prettifyDiagnosticForHover({
      source: "SA6000",
      code: "default",
      message:
        "calling regexp.MatchString in a loop has poor performance, consider using regexp.Compile",
    });

    expect(markdown).toContain(
      "### Using `regexp.Match` or related in a loop, should use `regexp.Compile`"
    );
    expect(markdown).toContain("Source: SA6000");
    expect(markdown).not.toContain("Code:"); // "default" is suppressed
    expect(markdown).toContain("**Function**");
    expect(markdown).toContain("```go\nregexp.MatchString\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA6002 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA6002",
      code: "default",
      message: "argument should be pointer-like to avoid allocations",
    });

    expect(markdown).toContain(
      "### Storing non-pointer values in `sync.Pool` allocates memory"
    );
    expect(markdown).toContain("Source: SA6002");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Hint:**");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA6005 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA6005",
      code: "default",
      message: "should use strings.EqualFold instead",
    });

    expect(markdown).toContain(
      "### Inefficient string comparison with `strings.ToLower` or `strings.ToUpper`"
    );
    expect(markdown).toContain("Source: SA6005");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Replacement**");
    expect(markdown).toContain("```go\nstrings.EqualFold\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });
});
