import { describe, expect, it } from "vitest";
import { prettifyDiagnosticForHover } from "../src";

describe("prettifyDiagnosticForHover", () => {
  it("renders SA2000 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA2000",
      code: "default",
      message:
        "should call wg.Add(1) before starting the goroutine to avoid a race",
    });

    expect(markdown).toContain(
      "### `(*sync.WaitGroup).Add` called inside the goroutine, leading to a race condition"
    );
    expect(markdown).toContain("Source: SA2000");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Add call**");
    expect(markdown).toContain("```go\nwg.Add(1)\n```");
    expect(markdown).toContain("- **Hint:** Call `wg.Add(1)`");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA2001 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA2001",
      code: "default",
      message: "empty critical section",
    });

    expect(markdown).toContain(
      "### Empty critical section, did you mean to defer the unlock?"
    );
    expect(markdown).toContain("Source: SA2001");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain(
      "- **Hint:** Move the unlock out of the critical section and defer it: `mu.Lock(); defer mu.Unlock()`."
    );
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA2002 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA2002",
      code: "default",
      message:
        "the goroutine calls T.Fatal, which must be called in the same goroutine as the test",
    });

    expect(markdown).toContain(
      "### Called `testing.T.FailNow` or `SkipNow` in a goroutine, which isn't allowed"
    );
    expect(markdown).toContain("Source: SA2002");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Method**");
    expect(markdown).toContain("```go\nT.Fatal\n```");
    expect(markdown).toContain("- **Hint:**");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA2003 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA2003",
      code: "default",
      message:
        "deferring mu.Lock right after having locked already; did you mean to defer mu.Unlock?",
    });

    expect(markdown).toContain(
      "### Deferred `Lock` right after locking, likely meant to defer `Unlock` instead"
    );
    expect(markdown).toContain("Source: SA2003");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Locked**");
    expect(markdown).toContain("```go\nmu.Lock\n```");
    expect(markdown).toContain("**Meant to defer**");
    expect(markdown).toContain("```go\nmu.Unlock\n```");
    expect(markdown).toContain("- **Hint:** Defer the unlock instead");
    expect(markdown).toContain("**Original diagnostic**");
  });
});
