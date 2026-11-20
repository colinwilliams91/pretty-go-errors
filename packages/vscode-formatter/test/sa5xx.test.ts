import { describe, expect, it } from "vitest";
import { prettifyDiagnosticForHover } from "../src";

describe("prettifyDiagnosticForHover", () => {
  it("renders SA5000 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA5000",
      code: "default",
      message: "assignment to nil map",
    });

    expect(markdown).toContain("### Assignment to nil map");
    expect(markdown).toContain("Source: SA5000");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:**");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA5001 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA5001",
      code: "default",
      message:
        "should check error returned from resp.Body.Close() before deferring resp.Body.Close()",
    });

    expect(markdown).toContain(
      "### Deferring `Close` before checking for a possible error"
    );
    expect(markdown).toContain("Source: SA5001");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Acquiring call**");
    expect(markdown).toContain("```go\nresp.Body.Close()\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA5002 diagnostics", () => {
    const race = prettifyDiagnosticForHover({
      source: "SA5002",
      code: "default",
      message: "loop condition never changes or has a race condition",
    });

    expect(race).toContain(
      "### The empty for loop (`for {}`) spins and can block the scheduler"
    );
    expect(race).toContain("Source: SA5002");
    expect(race).not.toContain("Code:");
    expect(race).toContain("- **Hint:**");
    expect(race).toContain("**Original diagnostic**");

    const spin = prettifyDiagnosticForHover({
      source: "SA5002",
      code: "default",
      message: "this loop will spin, using 100% CPU",
    });

    expect(spin).toContain(
      "### The empty for loop (`for {}`) spins and can block the scheduler"
    );
    expect(spin).toContain("Source: SA5002");
    expect(spin).not.toContain("Code:");
    expect(spin).toContain("- **Hint:**");
    expect(spin).toContain("**Original diagnostic**");
  });

  it("renders SA5003 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA5003",
      code: "default",
      message: "defers in this infinite loop will never run",
    });

    expect(markdown).toContain(
      "### Defers in infinite loops will never execute"
    );
    expect(markdown).toContain("Source: SA5003");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:**");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA5004 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA5004",
      code: "default",
      message:
        "should not have an empty default case in a for+select loop; the loop will spin",
    });

    expect(markdown).toContain(
      "### `for { select { ...` with an empty default branch spins"
    );
    expect(markdown).toContain("Source: SA5004");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:**");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA5007 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA5007",
      code: "default",
      message: "infinite recursive call",
    });

    expect(markdown).toContain("### Infinite recursive call");
    expect(markdown).toContain("Source: SA5007");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:**");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA5008 diagnostics", () => {
    const duplicate = prettifyDiagnosticForHover({
      source: "SA5008",
      code: "default",
      message: 'duplicate struct tag "json"',
    });

    expect(duplicate).toContain("### Invalid struct tag");
    expect(duplicate).toContain("Source: SA5008");
    expect(duplicate).not.toContain("Code:");
    expect(duplicate).toContain("- **Tag key:** json");
    expect(duplicate).toContain("- **Hint:**");
    expect(duplicate).toContain("**Original diagnostic**");

    const unexported = prettifyDiagnosticForHover({
      source: "SA5008",
      code: "default",
      message:
        'unexported struct field cannot have non-ignored `json:"name"` tag',
    });

    expect(unexported).toContain("### Invalid struct tag");
    expect(unexported).toContain("- **Tag key:** json");
    expect(unexported).toContain("- **Tag value:** name");
    expect(unexported).toContain("**Original diagnostic**");
  });

  it("renders SA5009 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA5009",
      code: "default",
      message: "Printf format %d reads arg #2, but call has only 1 args",
    });

    expect(markdown).toContain("### Invalid Printf call");
    expect(markdown).toContain("Source: SA5009");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Verb:** %d");
    expect(markdown).toContain("- **Reads argument:** #2");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA5010 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA5010",
      code: "default",
      message: [
        "impossible type assertion; io.ReadCloser and interface{Read([]byte) (int, error, error); Close() (error, bool)} contradict each other:",
        "\twrong type for Read method",
        "\t\thave func([]byte) (int, error)",
        "\t\twant func([]byte) (int, error, error)",
        "\twrong type for Close method",
        "\t\thave func() error",
        "\t\twant func() (error, bool)",
      ].join("\n"),
    });

    expect(markdown).toContain("### Impossible type assertion");
    expect(markdown).toContain("Source: SA5010");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Asserted from:** io.ReadCloser");
    expect(markdown).toContain("**Method signature conflicts**");
    expect(markdown).toContain(
      "- Read method: have func([]byte) (int, error), want func([]byte) (int, error, error)"
    );
    expect(markdown).toContain("**Original diagnostic**");
  });
});
