![Pretty Go Errors Logo](https://raw.githubusercontent.com/colinwilliams91/pretty-go-errors/main/apps/vscode-extension/media/pretty-go-errors.png)

# Pretty Go Errors

![GitHub Repo stars](https://img.shields.io/github/stars/colinwilliams91/pretty-go-errors)
![GitHub last commit](https://img.shields.io/github/last-commit/colinwilliams91/pretty-go-errors?style=flat)
![GitHub License](https://img.shields.io/github/license/colinwilliams91/pretty-go-errors)

Pretty Go Errors turns dense Go diagnostics into clearer, structured VS Code hovers so you can understand the actual problem faster.

If you regularly stop to mentally unpack `gopls` or compiler output, this extension shortens that step without hiding the original message.

## Why install it

- Pulls useful parts of common Go diagnostics into named fields
- Keeps the original diagnostic at the bottom of the hover for verification
- Works automatically when you open Go files with diagnostics
- Stays lightweight and focused on hover clarity rather than adding a full sidebar workflow

Pretty Go Errors was inspired by the value provided from [Pretty TypeScript Errors](https://github.com/yoavbls/pretty-ts-errors). Check them out if you use TypeScript too!

## Before and after

Raw diagnostic:

```text
cannot use value (value of type *bytes.Buffer) as io.Reader value in assignment: *bytes.Buffer does not implement io.Reader (missing method Read)
```

Pretty Go Errors hover:

```text
Type mismatch

Actual type: *bytes.Buffer
Expected type: io.Reader
Missing method: Read

Original diagnostic
cannot use value (value of type *bytes.Buffer) as io.Reader value in assignment: *bytes.Buffer does not implement io.Reader (missing method Read)
```

## What it improves today

- Type mismatch diagnostics such as `cannot use ... as ...`
- Missing identifier diagnostics such as `undefined: ...`
- Call argument count diagnostics such as `too many arguments in call ...`
- Diagnostics coming from `gopls`, `compiler`, `go list`, `go test`, and `syntax`

## Current scope

- Hover formatting for Go diagnostics only
- Rule-based formatting for common high-friction messages
- Original raw diagnostic preserved in every formatted hover

## Usage

1. Install the extension.
2. Open a Go file that has diagnostics.
3. Hover the underlined code to see the formatted explanation.

## Feedback

Issues and suggestions: https://github.com/colinwilliams91/pretty-go-errors/issues

Support details and Development workflow: [SUPPORT.md](./SUPPORT.md)
