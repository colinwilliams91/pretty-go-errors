export function compactLines(input: string): string {
  return input
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line.length > 0 || index === lines.length - 1)
    .join("\n")
    .trim();
}

export function escapeMarkdownInlineCode(input: string): string {
  return input.replace(/`/g, "\\`");
}
