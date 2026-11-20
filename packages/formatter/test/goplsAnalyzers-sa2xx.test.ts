import { describe, expect, it } from "vitest";
import { parseGoplsAnalyzerDiagnostic } from "../src";

describe("parseGoplsAnalyzerDiagnostic", () => {
  it("formats SA2000 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA2000",
      "should call wg.Add(1) before starting the goroutine to avoid a race"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa2000");
    expect(parsed?.title).toBe(
      "`(*sync.WaitGroup).Add` called inside the goroutine, leading to a race condition"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Add call",
          value: "wg.Add(1)",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
        }),
      ])
    );
  });

  it("formats SA2001 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA2001",
      "empty critical section"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa2001");
    expect(parsed?.title).toBe(
      "Empty critical section, did you mean to defer the unlock?"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Hint",
          kind: "text",
          value:
            "Move the unlock out of the critical section and defer it: `mu.Lock(); defer mu.Unlock()`.",
        }),
      ])
    );
  });

  it("formats SA2002 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA2002",
      "the goroutine calls T.Fatal, which must be called in the same goroutine as the test"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa2002");
    expect(parsed?.title).toBe(
      "Called `testing.T.FailNow` or `SkipNow` in a goroutine, which isn't allowed"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Method",
          value: "T.Fatal",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
        }),
      ])
    );
  });

  it("formats SA2003 diagnostics", () => {
    const parsed = parseGoplsAnalyzerDiagnostic(
      "SA2003",
      "deferring mu.Lock right after having locked already; did you mean to defer mu.Unlock?"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.family).toBe("sa2003");
    expect(parsed?.title).toBe(
      "Deferred `Lock` right after locking, likely meant to defer `Unlock` instead"
    );
    expect(parsed?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Locked",
          value: "mu.Lock",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Meant to defer",
          value: "mu.Unlock",
          kind: "code",
        }),
        expect.objectContaining({
          label: "Hint",
          kind: "text",
        }),
      ])
    );
  });

  it("returns null for an SA2xx message that does not match a known template", () => {
    expect(
      parseGoplsAnalyzerDiagnostic("SA2002", "some unrelated goroutine message")
    ).toBeNull();
  });
});
