import type { ParsedDiagnostic } from "../prettifyGoDiagnostic";
import type { GoplsAnalyzerParser } from "./types";

// SA2 - Concurrency issues (staticcheck).

// SA2000 - `(*sync.WaitGroup).Add` called inside the goroutine, leading to a
// race condition.
//
// Source: staticcheck/sa2000/sa2000.go:44. The %s is a rendered call
// expression, e.g. "wg.Add(1)".
//   should call %s before starting the goroutine to avoid a race
const SA2000_PATTERN =
  /^should call ([\s\S]+) before starting the goroutine to avoid a race$/;

function parseSA2000(message: string): ParsedDiagnostic | null {
  const match = message.match(SA2000_PATTERN);
  if (!match) {
    return null;
  }

  const [, call] = match;
  return {
    family: "sa2000",
    title:
      "`(*sync.WaitGroup).Add` called inside the goroutine, leading to a race condition",
    summary:
      "The WaitGroup counter is incremented inside the goroutine, so Wait can return before the goroutine starts its work.",
    rawMessage: message,
    details: [
      { label: "Add call", kind: "code", value: call, language: "go" },
      {
        label: "Hint",
        kind: "text",
        value: `Call \`${call}\` before the \`go\` statement so the counter is already incremented by the time the goroutine (or any waiter) runs.`,
      },
    ],
  };
}

// SA2001 - Empty critical section, did you mean to defer the unlock?
//
// Source: staticcheck/sa2001/sa2001.go:104. Static message.
const SA2001_PATTERN = /^empty critical section$/;

function parseSA2001(message: string): ParsedDiagnostic | null {
  const match = message.match(SA2001_PATTERN);
  if (!match) {
    return null;
  }

  return {
    family: "sa2001",
    title: "Empty critical section, did you mean to defer the unlock?",
    summary:
      "The critical section contains no statements, so the lock is acquired and released without protecting anything.",
    rawMessage: message,
    details: [
      {
        label: "Hint",
        kind: "text",
        value:
          "Move the unlock out of the critical section and defer it: `mu.Lock(); defer mu.Unlock()`.",
      },
    ],
  };
}

// SA2002 - Called `testing.T.FailNow` or `SkipNow` in a goroutine, which
// isn't allowed.
//
// Source: staticcheck/sa2002/sa2002.go:92. The method name is one of the
// runtime-terminating testing.T methods:
//   the goroutine calls T.%s, which must be called in the same goroutine as the test
const SA2002_PATTERN =
  /^the goroutine calls T\.(FailNow|Fatal|Fatalf|SkipNow|Skip|Skipf), which must be called in the same goroutine as the test$/;

function parseSA2002(message: string): ParsedDiagnostic | null {
  const match = message.match(SA2002_PATTERN);
  if (!match) {
    return null;
  }

  const [, name] = match;
  return {
    family: "sa2002",
    title:
      "Called `testing.T.FailNow` or `SkipNow` in a goroutine, which isn't allowed",
    summary:
      "Runtime-terminating test methods must run on the test goroutine that the testing package controls.",
    rawMessage: message,
    details: [
      { label: "Method", kind: "code", value: `T.${name}`, language: "go" },
      {
        label: "Hint",
        kind: "text",
        value:
          "From inside a goroutine, report failures with `t.Error` or `t.Errorf` instead, or send the result over a channel and call `t.Fatal` in the test goroutine.",
      },
    ],
  };
}

// SA2003 - Deferred `Lock` right after locking, likely meant to defer
// `Unlock` instead.
//
// Source: staticcheck/sa2003/sa2003.go:77. Both %s are rendered selector
// expressions, e.g. "mu.Lock" and "mu.Unlock":
//   deferring %s right after having locked already; did you mean to defer %s?
const SA2003_PATTERN =
  /^deferring ([\s\S]+?) right after having locked already; did you mean to defer ([\s\S]+)\?$/;

function parseSA2003(message: string): ParsedDiagnostic | null {
  const match = message.match(SA2003_PATTERN);
  if (!match) {
    return null;
  }

  const [, locked, unlock] = match;
  return {
    family: "sa2003",
    title:
      "Deferred `Lock` right after locking, likely meant to defer `Unlock` instead",
    summary:
      "Deferring the lock call right after locking re-locks the mutex instead of ever releasing it.",
    rawMessage: message,
    details: [
      { label: "Locked", kind: "code", value: locked, language: "go" },
      {
        label: "Meant to defer",
        kind: "code",
        value: unlock,
        language: "go",
      },
      {
        label: "Hint",
        kind: "text",
        value: `Defer the unlock instead of the lock so the mutex is released when the function returns: \`defer ${unlock}\`.`,
      },
    ],
  };
}

export const sa2xxParsers: Record<string, GoplsAnalyzerParser> = {
  SA2000: parseSA2000,
  SA2001: parseSA2001,
  SA2002: parseSA2002,
  SA2003: parseSA2003,
};
