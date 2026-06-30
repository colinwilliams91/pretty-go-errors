import {
  parseGoDiagnostic,
  type ParsedDetail,
  type ParsedDiagnostic,
} from "../../formatter/src/prettifyGoDiagnostic";
import {
  isSupportedGoplsAnalyzerCode,
  parseGoplsAnalyzerDiagnostic,
} from "../../formatter/src/goplsAnalyzers";
import {
  escapeMarkdownInlineCode,
  formatGoMethodChain,
  normalizeDiagnosticCode,
} from "../../utils/src/index";

export interface HoverDiagnosticLike {
  message: string;
  source?: string;
  code?: string | number | { value: string | number };
}

export function prettifyDiagnosticForHover(
  diagnostic: HoverDiagnosticLike
): string {
  const parsed = parseDiagnostic(diagnostic);
  return renderParsedDiagnosticForHover(parsed, diagnostic);
}

// Routes a diagnostic to the right parser. Gopls analyzer diagnostics carry
// the analyzer Name as `source` (e.g. "SA1000") with `code` set to "default";
// route those through the analyzer registry. Everything else (compiler,
// syntax, go list, and gopls passthrough compiler diagnostics) falls through to
// the existing message-shaped `parseGoDiagnostic` chain.
function parseDiagnostic(diagnostic: HoverDiagnosticLike): ParsedDiagnostic {
  if (diagnostic.source && isSupportedGoplsAnalyzerCode(diagnostic.source)) {
    const analyzer = parseGoplsAnalyzerDiagnostic(
      diagnostic.source,
      diagnostic.message
    );
    if (analyzer) {
      return analyzer;
    }
  }
  return parseGoDiagnostic(diagnostic.message);
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

  const code = normalizeDiagnosticCode(diagnostic.code);

  // Gopls sets `code` to "default" for analyzer diagnostics (which carry the
  // meaningful identifier in `source`); suppress that noise.
  if (code !== undefined && code !== "default") {
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
  // Only Go code blocks get fluent-chain line breaks; `text` blocks (raw
  // messages, single tokens) are rendered verbatim so they don't get mangled.
  const formatted = language === "go" ? formatGoMethodChain(value) : value;
  return `\`\`\`${language}\n${formatted}\n\`\`\``;
}
