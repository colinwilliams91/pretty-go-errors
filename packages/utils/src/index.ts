export function compactLines(input: string): string {
  return input
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(
      (line, index, lines) => line.length > 0 || index === lines.length - 1
    )
    .join("\n")
    .trim();
}

export function escapeMarkdownInlineCode(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

export function normalizeDiagnosticCode(
  code: string | number | { value: string | number } | undefined
): string | number | undefined {
  if (typeof code === "string" || typeof code === "number") {
    return code;
  }

  if (code && typeof code === "object" && "value" in code) {
    return code.value;
  }

  return undefined;
}

// Only reflow chains long enough that breaking improves readability; short
// chains like `a.B().C()` stay inline to avoid noise. Both thresholds are
// tunable knobs for the "only when it helps" behavior.
const MIN_CHAIN_BREAKS = 2;
const MIN_CHAIN_LENGTH = 40;
const CONTINUATION_INDENT = "\t";

/**
 * Splits a long single-line Go fluent method chain across multiple lines so it
 * renders like a real code fence in a hover instead of one unbroken string.
 *
 * A break is inserted after each fluent-chain `.` — defined as a dot at bracket
 * depth 0, outside any string/rune literal, immediately preceded by `)` (i.e. a
 * method called on a call result). Trailing-dot style with a tab indent on
 * continuation lines, which keeps the result valid Go and stable for syntax
 * highlighting. Selectors like `db.Where` or `pkg.Type`, dots inside string
 * args, and chains nested inside call arguments are intentionally left alone.
 *
 * Input that already contains newlines is returned unchanged so any line breaks
 * already present in the original diagnostic are preserved verbatim.
 */
export function formatGoMethodChain(code: string): string {
  if (code.includes("\n")) {
    return code;
  }

  const boundaries = findChainBoundaries(code);
  if (boundaries.length < MIN_CHAIN_BREAKS || code.length < MIN_CHAIN_LENGTH) {
    return code;
  }

  let result = "";
  let previous = 0;
  for (const index of boundaries) {
    // `index` points at the chain `.`; keep the dot trailing on the prior line.
    result += `${code.slice(previous, index + 1)}\n${CONTINUATION_INDENT}`;
    previous = index + 1;
  }
  result += code.slice(previous);
  return result;
}

function findChainBoundaries(code: string): number[] {
  const boundaries: number[] = [];
  let depth = 0;
  let stringChar: string | null = null;
  let escaped = false;
  let prevSignificant = "";

  for (let index = 0; index < code.length; index++) {
    const char = code[index];

    if (stringChar) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === stringChar) {
        stringChar = null;
        prevSignificant = char;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      stringChar = char;
      continue;
    }

    if (char === "(" || char === "[" || char === "{") {
      depth++;
      prevSignificant = char;
      continue;
    }

    if (char === ")" || char === "]" || char === "}") {
      depth = Math.max(0, depth - 1);
      prevSignificant = char;
      continue;
    }

    if (char === "." && depth === 0 && prevSignificant === ")") {
      boundaries.push(index);
      prevSignificant = char;
      continue;
    }

    if (!/\s/.test(char)) {
      prevSignificant = char;
    }
  }

  return boundaries;
}
