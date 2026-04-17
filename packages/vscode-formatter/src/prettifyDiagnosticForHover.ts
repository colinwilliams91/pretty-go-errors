import {
  parseGoDiagnostic,
  type ParsedDetail,
  type ParsedDiagnostic,
} from "@pretty-go-errors/formatter";
import { escapeMarkdownInlineCode } from "@pretty-go-errors/utils";

export interface HoverDiagnosticLike {
  message: string;
  source?: string;
  code?: string | number | { value: string | number };
}

export function prettifyDiagnosticForHover(
  diagnostic: HoverDiagnosticLike
): string {
  const parsed = parseGoDiagnostic(diagnostic.message);
  return renderParsedDiagnosticForHover(parsed, diagnostic);
}

export function renderParsedDiagnosticForHover(
  parsed: ParsedDiagnostic,
  diagnostic: Omit<HoverDiagnosticLike, "message">
): string {
  const metadata = formatMetadata(diagnostic);
  const sections = parsed.details.map(renderDetail).join("\n\n");

  return [
    `### ${parsed.title}`,
    parsed.summary,
    metadata,
    sections,
    "**Original diagnostic**",
    codeBlock(parsed.rawMessage, "text"),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function formatMetadata(
  diagnostic: Omit<HoverDiagnosticLike, "message">
): string | undefined {
  const items: string[] = [];
  if (diagnostic.source) {
    items.push(`Source: ${escapeMarkdownInlineCode(diagnostic.source)}`);
  }

  const code =
    typeof diagnostic.code === "object" && diagnostic.code !== null
      ? diagnostic.code.value
      : diagnostic.code;

  if (code !== undefined) {
    items.push(`Code: ${escapeMarkdownInlineCode(String(code))}`);
  }

  return items.length > 0 ? `_${items.join(" · ")}_` : undefined;
}

function renderDetail(detail: ParsedDetail): string {
  switch (detail.kind) {
    case "text":
      return `- **${detail.label}:** ${detail.value}`;
    case "list":
      return [
        `**${detail.label}**`,
        ...detail.items.map((item) => `- ${item}`),
      ].join("\n");
    case "code":
      return [
        `**${detail.label}**`,
        codeBlock(detail.value, detail.language ?? "go"),
      ].join("\n\n");
  }
}

function codeBlock(value: string, language: string): string {
  return `\`\`\`${language}\n${value}\n\`\`\``;
}
