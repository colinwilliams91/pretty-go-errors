import { describe, expect, it } from "vitest";
import { prettifyDiagnosticForHover } from "../src";

describe("prettifyDiagnosticForHover", () => {
  it("renders SA3000 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA3000",
      code: "default",
      message: "TestMain should call os.Exit to set exit code",
    });

    expect(markdown).toContain(
      "### `TestMain` doesn't call `os.Exit`, hiding test failures"
    );
    expect(markdown).toContain("Source: SA3000");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Suggested pattern**");
    expect(markdown).toContain("```go\nfunc TestMain(m *testing.M) {");
    expect(markdown).toContain("os.Exit(m.Run())");
    expect(markdown).toContain(
      "- **Hint:** End TestMain with `os.Exit(m.Run())`"
    );
    expect(markdown).toContain("**Original diagnostic**");
  });
});
