# Staticcheck message grounding (Tier 1 catalog)

Verbatim message templates for every Tier-1 Staticcheck check, extracted from
the analyzer sources in `github.com/dominikh/go-tools` (branch `master`,
module `honnef.co/go/tools`). Every regex in
`packages/formatter/src/goplsAnalyzers/*` must be anchored to one of these
templates — never guess message text.

The GitHub raw URL pattern is:

```
https://raw.githubusercontent.com/dominikh/go-tools/master/staticcheck/sa<nnnn>/sa<nnnn>.go
```

Notes that apply broadly:

- `%s`-style placeholders become regex capture groups; anchor patterns with
  `^...$` and use `[\s\S]+` for parts that may span weird input.
- Messages are reported verbatim via `report.Report(pass, node, msg)` or
  `arg.Invalid(msg)` (the `callcheck` helpers forward `Invalid` strings
  unchanged, see `analysis/callcheck/callcheck.go:100-119`).
- Some messages carry _related information_ (secondary diagnostics from
  `report.Related(...)`); gopls surfaces those as separate hover entries, so
  parsers should tolerate but not require them.

---

## SA1 — Standard library misuse

### SA1002 — Invalid format in `time.Parse`

Source: `staticcheck/sa1002/sa1002.go` (forwards the verbatim `time.Parse` error, same pattern as SA1000).

Template (from `time.ParseError.Error()`; the analyzer calls `time.Parse(s, s)` so value == layout):

```
parsing time "<value>" as "<layout>": <detail>
```

Second real shape — range/extra-text errors omit the `as "<layout>"` clause:

```
parsing time "<value>": <detail>
```

Examples:

- `parsing time "2006-01-02" as "2006-01-02": cannot parse "2006-01-02" as "2006"`
- `parsing time "2006-01-02" as "2006-01-02": extra text: "2006-01-02"`
- `parsing time "15:04:05": extra text: "07:00"`

The `<detail>` may itself contain quotes and colons; capture greedily to `$`.

### SA1004 — Suspiciously small untyped constant in `time.Sleep`

Source: `staticcheck/sa1004/sa1004.go:66`.

Template:

```
sleeping for %d nanoseconds is probably a bug; be explicit if it isn't
```

Example: `sleeping for 5 nanoseconds is probably a bug; be explicit if it isn't`

### SA1006 — `Printf` with dynamic first argument and no further arguments

Source: `staticcheck/sa1006/sa1006.go:110`.

Template (static):

```
printf-style function with dynamic format string and no further arguments should use print-style function instead
```

### SA1008 — Non-canonical key in `http.Header` map

Source: `staticcheck/sa1008/sa1008.go:101` (`%q` = double-quoted).

Template:

```
keys in http.Header are canonicalized, %q is not canonical; fix the constant or use http.CanonicalHeaderKey
```

Example: `keys in http.Header are canonicalized, "etag" is not canonical; fix the constant or use http.CanonicalHeaderKey`

### SA1012 — A nil `context.Context` is being passed to a function, consider using `context.TODO` instead

Source: `staticcheck/sa1012/sa1012.go:62`.

Template (static):

```
do not pass a nil Context, even if a function permits it; pass context.TODO if you are unsure about which Context to use
```

### SA1015 — Using `time.Tick` in a way that will leak...

Source: `staticcheck/sa1015/sa1015.go:64`.

Template (static):

```
using time.Tick leaks the underlying ticker, consider using it only in endless functions, tests and the main package, and use time.NewTicker here
```

### SA1017 — Channels used with `os/signal.Notify` should be buffered

Source: `staticcheck/sa1017/sa1017.go` (`arg.Invalid`, forwarded verbatim).

Template (static):

```
the channel used with signal.Notify should be buffered
```

### SA1019 — Using a deprecated function, variable, constant or field

Source: `staticcheck/sa1019/sa1019.go:106-119`. Four templates; try in this order (the first two would alias-match each other):

1. `%s has been deprecated since %s because it shouldn't be used: %s`
2. `%s has been deprecated since %s: %s`
3. `%s has been deprecated since %s and an alternative has been available since %s: %s`
4. `%s is deprecated: %s`

`%s` #1 is a fully qualified object name (e.g. `strings.Title`); the version
fields render as e.g. `Go 1.18`; the trailing `%s` is the deprecation
notice text (often contains the suggested replacement) and may contain
colons — capture greedily and split carefully.

### SA1029 — Inappropriate key in call to `context.WithValue`

Source: `staticcheck/sa1029/sa1029.go:44-59` (`arg.Invalid`, forwarded verbatim). Four templates:

1. `should not use built-in type %s (via alias %s) as key for value; define your own type to avoid collisions`
2. `should not use built-in type %s as key for value; define your own type to avoid collisions`
3. `should not use empty anonymous struct as key for value; define your own type to avoid collisions`
4. `keys used with context.WithValue must be comparable, but type %s is not comparable`

Example (2): `should not use built-in type string as key for value; define your own type to avoid collisions`

### SA1032 — Wrong order of arguments to `errors.Is`

Source: `staticcheck/sa1032/sa1032.go:77` (`call.Invalid`).

Template (static):

```
arguments have the wrong order
```

---

## SA2 — Concurrency issues

### SA2000 — `(*sync.WaitGroup).Add` called inside the goroutine...

Source: `staticcheck/sa2000/sa2000.go:44`.

Template:

```
should call %s before starting the goroutine to avoid a race
```

`%s` is a rendered call expression, e.g. `wg.Add(1)`.
Example: `should call wg.Add(1) before starting the goroutine to avoid a race`

### SA2001 — Empty critical section, did you mean to defer the unlock?

Source: `staticcheck/sa2001/sa2001.go:104`.

Template (static):

```
empty critical section
```

### SA2002 — Called `testing.T.FailNow` or `SkipNow` in a goroutine, which isn't allowed

Source: `staticcheck/sa2002/sa2002.go:92`. Method name ∈ `FailNow|Fatal|Fatalf|SkipNow|Skip|Skipf`.

Template:

```
the goroutine calls T.%s, which must be called in the same goroutine as the test
```

Example: `the goroutine calls T.Fatal, which must be called in the same goroutine as the test`

### SA2003 — Deferred `Lock` right after locking, likely meant to defer `Unlock` instead

Source: `staticcheck/sa2003/sa2003.go:77`.

Template:

```
deferring %s right after having locked already; did you mean to defer %s?
```

`%s` are rendered selector expressions (e.g. `mu.Lock`, `mu.Unlock`).
Example: `deferring mu.Lock right after having locked already; did you mean to defer mu.Unlock?`

---

## SA3 — Testing issues

### SA3000 — `TestMain` doesn't call `os.Exit`, hiding test failures

Source: `staticcheck/sa3000/sa3000.go:50`.

Template (static):

```
TestMain should call os.Exit to set exit code
```

---

## SA4 — Code that isn't really doing anything

### SA4000 — Binary operator has identical expressions on both sides

Source: `staticcheck/sa4000/sa4000.go:223`.

Template:

```
identical expressions on the left and right side of the '%s' operator
```

`%s` is a token, e.g. `==`, `&&`, `-`.

### SA4001 — `&*x` gets simplified to `x`, it does not copy `x`

Source: `staticcheck/sa4001/sa4001.go:49-52`. Two templates (identical shape; only the operator pair differs):

1. `%s will be simplified to %s. It will not copy %s.` where the rendered expression e.g. `&*x will be simplified to x. It will not copy x.`
2. `*&x will be simplified to x. It will not copy x.`

### SA4003 — Comparing unsigned values against negative values is pointless

Source: `staticcheck/sa4003/sa4003.go:83-218`. Four templates:

1. `no value of type %s is less than 0`
2. `every value of type %s is >= 0`
3. `no value of type %s is greater than %s`
4. `every value of type %s is <= %s`

Examples: `no value of type uint is less than 0`, `every value of type uint8 is <= 255`

### SA4004 — The loop exits unconditionally after one iteration

Source: `staticcheck/sa4004/sa4004.go:157`.

Template (static):

```
the surrounding loop is unconditionally terminated
```

### SA4005 — Field assignment that will never be observed. Did you mean to use a pointer receiver?

Source: `staticcheck/sa4005/sa4005.go:134`.

Template:

```
ineffective assignment to field %s.%s
```

Example: `ineffective assignment to field User.Name`

### SA4006 — A value assigned to a variable is never read before being overwritten...

Source: `staticcheck/sa4006/sa4006.go:111,142,167`.

Template:

```
this value of %s is never used
```

`%s` is an identifier or selector expression, e.g. `err`, `x.y`.
Example: `this value of err is never used`

### SA4008 — The variable in the loop condition never changes...

Source: `staticcheck/sa4008/sa4008.go:91`.

Template (static):

```
variable in loop condition never changes
```

### SA4009 — A function argument is overwritten before its first use

Source: `staticcheck/sa4009/sa4009.go:98`.

Template:

```
argument %s is overwritten before first use
```

Example: `argument x is overwritten before first use`

### SA4010 — The result of `append` will never be observed anywhere

Source: `staticcheck/sa4010/sa4010.go:204`.

Template (static):

```
this result of append is never used, except maybe in other appends
```

### SA4011 — Break statement with no effect...

Source: `staticcheck/sa4011/sa4011.go:86`.

Template (static):

```
ineffective break statement. Did you mean to break out of the outer loop?
```

### SA4017 — Discarding the return values of a function without side effects...

Source: `staticcheck/sa4017/sa4017.go:84`.

Template:

```
%s doesn't have side effects and its return value is ignored
```

`%s` is the short function name (e.g. `Replace`).
Example: `Replace doesn't have side effects and its return value is ignored`

### SA4023 — Impossible comparison of interface value with untyped nil

Source: `staticcheck/sa4023/sa4023.go:166-206`. Two templates; qualifier ∈ `always|never`:

1. `this comparison is %s true`
2. `this comparison is %s true; the lhs of the comparison has been assigned a concretely typed value`

Examples: `this comparison is always true`, `this comparison is never true`

### SA4031 — Checking never-nil value against nil

Source: `staticcheck/sa4031/sa4031.go:125-159`. Three templates; qualifier ∈ `always|never` (chosen by the opposite of the comparison operator):

1. `the checked variable contains a function and is never nil; did you mean to call it?`
2. `functions are never nil; did you mean to call it?`
3. `this nil check is %s true`

Example: `this nil check is never true`

---

## SA5 — Correctness issues

### SA5000 — Assignment to nil map

Source: `staticcheck/sa5000/sa5000.go:47`.

Template (static):

```
assignment to nil map
```

### SA5001 — Deferring `Close` before checking for a possible error

Source: `staticcheck/sa5001/sa5001.go:98`.

Template:

```
should check error returned from %s() before deferring %s
```

`%s` are rendered selector expressions; the first is the call's `Fun`
(without parens, the template adds `()`).
Example: `should check error returned from resp.Body.Close() before deferring resp.Body.Close()`

### SA5002 — The empty for loop (`for {}`) spins and can block the scheduler

Source: `staticcheck/sa5002/sa5002.go:76-78`. Two templates:

1. `loop condition never changes or has a race condition`
2. `this loop will spin, using 100% CPU`

### SA5003 — Defers in infinite loops will never execute

Source: `staticcheck/sa5003/sa5003.go:69`.

Template (static):

```
defers in this infinite loop will never run
```

### SA5004 — `for { select { ...` with an empty default branch spins

Source: `staticcheck/sa5004/sa5004.go:45`.

Template (static):

```
should not have an empty default case in a for+select loop; the loop will spin
```

### SA5007 — Infinite recursive call

Source: `staticcheck/sa5007/sa5007.go:56`.

Template (static):

```
infinite recursive call
```

### SA5008 — Invalid struct tag

Source: `staticcheck/sa5008/sa5008.go` (main), `staticcheck/sa5008/jsonv2.go`
(JSON tags), `staticcheck/sa5008/structtag.go` (tag syntax errors). The most
variant-rich check; many templates. The important ones:

- `unparseable struct tag: %s` (syntax error text from `structtag.go`)
- `duplicate struct tag %q` (e.g. `duplicate struct tag "json"`)
- XML: `invalid XML tag: %s`, `invalid XML tag: unknown option %q`, `invalid XML tag: duplicate option %q`
- JSON (from `jsonv2.go`, read the file for the full list):
  - `unexported struct field cannot have non-ignored \`json:%q\` tag`
  - `malformed \`json\` tag: %v`(also the two fixed sub-forms`invalid character %q before next option (expecting ',')`and`invalid trailing ',' character`)
  - `invalid UTF-8 in JSON object name %q`
  - `should encoding/json ignore this field or name it "-"? ...` (long — see source)
  - `\`format\` tag option was not specified last`
  - `missing value for \`format\` tag option`
  - plus the format-option validation messages around `jsonv2.go:111-208`

Recommended implementation: a list of anchored patterns checked in order,
shared `title` ("Invalid struct tag") and `summary`, with per-family
`Hint`s. Extract the tag key where present. `return null` for unmatched
variants (fallback hover still renders the raw message).

### SA5009 — Invalid Printf call

Source: `staticcheck/sa5009/sa5009.go:327-413`. Six templates:

1. `couldn't parse format string`
2. `Printf format %s reads invalid arg 0; indices are 1-based`
3. `Printf format %s reads arg #%d, but call has only %d args`
4. `Printf format %s reads non-int arg #%d as argument of *`
5. `Printf format %s has arg #%d of wrong type %s`
6. `Printf call needs %d args but has %d args`

`%s` #2/#3/#4/#5 (first position) is the raw verb, e.g. `%d`. Type strings in
#5 e.g. `string`, `*int`. Hint candidates: `%v`/`%s` general advice, 1-based
indexing, and matching arg counts.
Example (3): `Printf format %d reads arg #2, but call has only 1 args`

### SA5010 — Impossible type assertion

Source: `staticcheck/sa5010/sa5010.go:99-109`. Multi-line message:

```
impossible type assertion; <leftType> and <rightType> contradict each other:\n\twrong type for <Method> method\n\t\thave <haveType>\n\t\twant <wantType>
```

The `\n\twrong type for ...` block repeats per mismatched method (one or more
times). Parse the first line into Left/Right types, then the method block(s)
into a `list` detail.

---

## SA6 — Performance issues

### SA6000 — Using `regexp.Match` or related in a loop...

Source: `staticcheck/sa6000/sa6000.go` (`call.Invalid`).

Template:

```
calling %s in a loop has poor performance, consider using regexp.Compile
```

`%s` ∈ `regexp.Match|regexp.MatchReader|regexp.MatchString`.
Example: `calling regexp.MatchString in a loop has poor performance, consider using regexp.Compile`

### SA6002 — Storing non-pointer values in `sync.Pool` allocates memory

Source: `staticcheck/sa6002/sa6002.go` (`arg.Invalid`).

Template (static):

```
argument should be pointer-like to avoid allocations
```

### SA6005 — Inefficient string comparison with `strings.ToLower` or `strings.ToUpper`

Source: `staticcheck/sa6005/sa6005.go:73`.

Template:

```
should use %s instead
```

`%s` is the suggested replacement, e.g. `strings.EqualFold`.
Example: `should use strings.EqualFold instead`

---

## SA9 — Dubious code

### SA9001 — Defers in range loops may not run when you expect them to

Source: `staticcheck/sa9001/sa9001.go:71`.

Template (static):

```
defers in this range loop won't run unless the channel gets closed
```

### SA9002 — Using a non-octal `os.FileMode` that looks like it was meant to be in octal

Source: `staticcheck/sa9002/sa9002.go:61`.

Template:

```
file mode '%s' evaluates to %#o; did you mean '0%s'?
```

`%s` #1/#3 is the raw literal (e.g. `777`); `%#o` renders with the **legacy
`0` prefix** (Go's `%#o` verb predates `0o`; `%O` would render `0o`), e.g.
`%#o` of decimal 777 → `01411`.
Example: `file mode '777' evaluates to 01411; did you mean '0777'?`
