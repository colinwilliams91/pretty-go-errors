# fixtures

Deliberate example code for manually testing Pretty Go Errors hovers in VS
Code. Not committed to the repo.

## How to use

1. Install the locally-packaged extension (`pretty-go-errors-0.7.0.vsix`) and
   reload the window.
2. SA diagnostics: recent gopls versions ship Staticcheck enabled by default,
   so they usually appear with no configuration. If you don't see any
   SA-series hovers (or VS Code flags a duplicate setting), enable it in this
   workspace's `.vscode/settings.json`:

   ```jsonc
   {
     "gopls": { "staticcheck": true },
   }
   ```

3. Open a file below and hover the marked lines.

> Note: the root package (`fixtures`) compiles cleanly on purpose — Staticcheck
> analyzers only run on packages that type-check, which is why the
> compiler-error examples live in their own subdirectories.

## New Staticcheck (SA) diagnostics — `staticcheck.go`

| Line                                    | Code   | Hover title                                                        |
| --------------------------------------- | ------ | ------------------------------------------------------------------ |
| `strings.Title(...)`                    | SA1019 | Using a deprecated function, variable, constant or field           |
| `time.Sleep(100)`                       | SA1004 | Suspiciously small untyped constant in `time.Sleep`                |
| `time.Parse("2006-01-02", ...)`         | SA1002 | Invalid format in `time.Parse`                                     |
| `NeedsCtx(nil)`                         | SA1012 | A nil `context.Context` is being passed to a function...           |
| `errors.Is(io.EOF, err)`                | SA1032 | Wrong order of arguments to `errors.Is`                            |
| `strings.Replace(...)` (result ignored) | SA4017 | Discarding the return values of a function without side effects... |
| `wg.Add(1)` inside `go func`            | SA2000 | `(*sync.WaitGroup).Add` called inside the goroutine...             |
| `json:"a" json:"a"` tag                 | SA5008 | Invalid struct tag                                                 |
| `defer` inside `for range ch`           | SA9001 | Defers in range loops may not run when you expect them to          |
| `SpinForever()` recursion               | SA5007 | Infinite recursive call                                            |

## Older diagnostics

- `broken/broken.go` — compiler source: Type mismatch, Unused variable,
  Assignment mismatch, Too many arguments, Undefined.
- `syntax/syntax.go` — syntax source: Missing comma in argument list, Missing
  comma in composite literal, Expected operand. (The parser's trailing
  `expected ';', found 'EOF'` recovery errors intentionally demonstrate the
  fallback hover.)
- `staticcheck.go` — the 10 SA-series examples above.

## Reminder

If a hover shows only the raw message under "Original diagnostic" (with a
generic `### Go diagnostic` title), that check either isn't registered yet or
gopls' message didn't match the parser — grab the exact text and we'll adjust
the pattern.
