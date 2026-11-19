import { describe, expect, it } from "vitest";
import { prettifyDiagnosticForHover } from "../src";

describe("prettifyDiagnosticForHover", () => {
  it("renders SA4000 diagnostics", () => {
    // Gopls sets `source` to the analyzer Name ("SA4000") and `code` to
    // "default" for Staticcheck analyzer diagnostics.
    const markdown = prettifyDiagnosticForHover({
      source: "SA4000",
      code: "default",
      message:
        "identical expressions on the left and right side of the '==' operator",
    });

    expect(markdown).toContain(
      "### Binary operator has identical expressions on both sides"
    );
    expect(markdown).toContain("Source: SA4000");
    // The meaningless "default" code is suppressed.
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Operator**");
    expect(markdown).toContain("```text\n==\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4001 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4001",
      code: "default",
      message: "&*x will be simplified to x. It will not copy x.",
    });

    expect(markdown).toContain(
      "### `&*x` gets simplified to `x`, it does not copy `x`"
    );
    expect(markdown).toContain("Source: SA4001");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Original expression**");
    expect(markdown).toContain("```go\n&*x\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4001 diagnostics with the dereference-then-address variant", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4001",
      code: "default",
      message: "*&x will be simplified to x. It will not copy x.",
    });

    expect(markdown).toContain(
      "### `&*x` gets simplified to `x`, it does not copy `x`"
    );
    expect(markdown).toContain("```go\n*&x\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4003 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4003",
      code: "default",
      message: "no value of type uint is less than 0",
    });

    expect(markdown).toContain(
      "### Comparing unsigned values against negative values is pointless"
    );
    expect(markdown).toContain("Source: SA4003");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Type**");
    expect(markdown).toContain("```go\nuint\n```");
    expect(markdown).toContain(
      "- **Hint:** Unsigned values are never negative"
    );
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4003 diagnostics against a nonzero bound", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4003",
      code: "default",
      message: "every value of type uint8 is <= 255",
    });

    expect(markdown).toContain("**Bound**");
    expect(markdown).toContain("```go\n255\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4004 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4004",
      code: "default",
      message: "the surrounding loop is unconditionally terminated",
    });

    expect(markdown).toContain(
      "### The loop exits unconditionally after one iteration"
    );
    expect(markdown).toContain("Source: SA4004");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:** Remove the unconditional");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4005 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4005",
      code: "default",
      message: "ineffective assignment to field User.Name",
    });

    expect(markdown).toContain(
      "### Field assignment that will never be observed. Did you mean to use a pointer receiver?"
    );
    expect(markdown).toContain("Source: SA4005");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Type**");
    expect(markdown).toContain("**Field**");
    expect(markdown).toContain(
      "- **Hint:** Give the method a pointer receiver"
    );
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4006 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4006",
      code: "default",
      message: "this value of err is never used",
    });

    expect(markdown).toContain(
      "### A value assigned to a variable is never read before being overwritten. Forgotten error check or dead code?"
    );
    expect(markdown).toContain("Source: SA4006");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Variable**");
    expect(markdown).toContain("```go\nerr\n```");
    expect(markdown).toContain("- **Hint:** This is often a forgotten");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4008 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4008",
      code: "default",
      message: "variable in loop condition never changes",
    });

    expect(markdown).toContain(
      "### The variable in the loop condition never changes, are you incrementing the wrong variable?"
    );
    expect(markdown).toContain("Source: SA4008");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:** Check which variable");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4009 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4009",
      code: "default",
      message: "argument x is overwritten before first use",
    });

    expect(markdown).toContain(
      "### A function argument is overwritten before its first use"
    );
    expect(markdown).toContain("Source: SA4009");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Argument**");
    expect(markdown).toContain("```go\nx\n```");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4010 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4010",
      code: "default",
      message:
        "this result of append is never used, except maybe in other appends",
    });

    expect(markdown).toContain(
      "### The result of `append` will never be observed anywhere"
    );
    expect(markdown).toContain("Source: SA4010");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:** append may return a new slice");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4011 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4011",
      code: "default",
      message:
        "ineffective break statement. Did you mean to break out of the outer loop?",
    });

    expect(markdown).toContain(
      "### Break statement with no effect. Did you mean to break out of an outer loop?"
    );
    expect(markdown).toContain("Source: SA4011");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Hint:** Label the outer loop");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4017 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4017",
      code: "default",
      message:
        "Replace doesn't have side effects and its return value is ignored",
    });

    expect(markdown).toContain(
      "### Discarding the return values of a function without side effects, making the call pointless"
    );
    expect(markdown).toContain("Source: SA4017");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("**Function**");
    expect(markdown).toContain("```go\nReplace\n```");
    expect(markdown).toContain("- **Hint:** Assign the return value");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4023 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4023",
      code: "default",
      message: "this comparison is always true",
    });

    expect(markdown).toContain(
      "### Impossible comparison of interface value with untyped nil"
    );
    expect(markdown).toContain("Source: SA4023");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain("- **Outcome:** always");
    expect(markdown).toContain("- **Hint:** A nil `*T` stored in an interface");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4023 diagnostics with a concretely typed lhs", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4023",
      code: "default",
      message:
        "this comparison is never true; the lhs of the comparison has been assigned a concretely typed value",
    });

    expect(markdown).toContain("- **Outcome:** never");
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4031 diagnostics", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4031",
      code: "default",
      message:
        "the checked variable contains a function and is never nil; did you mean to call it?",
    });

    expect(markdown).toContain("### Checking never-nil value against nil");
    expect(markdown).toContain("Source: SA4031");
    expect(markdown).not.toContain("Code:");
    expect(markdown).toContain(
      "- **Hint:** Call the function first and check its result for nil."
    );
    expect(markdown).toContain("**Original diagnostic**");
  });

  it("renders SA4031 diagnostics with a fixed-outcome nil check", () => {
    const markdown = prettifyDiagnosticForHover({
      source: "SA4031",
      code: "default",
      message: "this nil check is never true",
    });

    expect(markdown).toContain("### Checking never-nil value against nil");
    expect(markdown).toContain("- **Outcome:** never");
    expect(markdown).toContain("**Original diagnostic**");
  });
});
