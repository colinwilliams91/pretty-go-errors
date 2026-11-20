import { describe, expect, it } from "vitest";
import { prettifyDiagnosticForHover } from "../src";

describe("prettifyDiagnosticForHover", () => {
  it("renders SA9001 diagnostics", () => {
    // Gopls sets source = analyzer Name, code = "default".
    const markdown = prettifyDiagnosticForHover({
      source: "SA9001",
      code: "default",
      message:
        "defers in this range loop won't run unless the channel gets closed",
    });

    expect(markdown).toContain(
      "### Defers in range loops may not run when you expect them to"
    );
    expect(markdown).toContain("Source: SA9001");
    expect(markdown).not.toContain("Code:"); // "default" is suppressed
    expect(markdown).toContain("**Hint:**");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA9002 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA9002",
      code: "default",
      message: "file mode '777' evaluates to 01411; did you mean '0777'?",
    });

    expect(markdown).toContain(
      "### Using a non-octal `os.FileMode` that looks like it was meant to be in octal"
    );
    expect(markdown).toContain("Source: SA9002");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Mode literal**");
    expect(markdown).toContain("**Evaluated mode**");
    expect(markdown).toContain("**Intended mode**");
    expect(markdown).toContain("```go\n0777\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });
});
