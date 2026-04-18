import { prettifyDiagnosticForHover } from "@pretty-go-errors/vscode-formatter";
import {
  ExtensionContext,
  languages,
  MarkdownString,
  type Diagnostic,
  type Uri,
} from "vscode";
import {
  formattedDiagnosticsStore,
  type FormattedDiagnostic,
} from "./formattedDiagnosticsStore";

const SUPPORTED_GO_DIAGNOSTIC_SOURCES = new Set([
  "compiler",
  "gopls",
  "go list",
  "go test",
  "syntax",
]);

const CACHE_SIZE_MAX = 200;
const cache = new Map<string, MarkdownString>();
const cacheOrder: string[] = [];

export function registerOnDidChangeDiagnostics(context: ExtensionContext) {
  context.subscriptions.push(
    languages.onDidChangeDiagnostics((event) => {
      for (const uri of event.uris) {
        void refreshDiagnosticsForUri(uri);
      }
    })
  );
}

export async function refreshDiagnosticsForUri(uri: Uri): Promise<void> {
  const diagnostics = languages.getDiagnostics(uri);
  const supportedDiagnostics = diagnostics.filter(isSupportedDiagnostic);

  if (supportedDiagnostics.length === 0) {
    formattedDiagnosticsStore.delete(uri.toString());
    return;
  }

  const formatted = await Promise.all(
    supportedDiagnostics.map(async (diagnostic) => formatDiagnostic(diagnostic))
  );

  formattedDiagnosticsStore.set(uri.toString(), formatted);
}

function isSupportedDiagnostic(diagnostic: Diagnostic): boolean {
  return (
    !diagnostic.source ||
    SUPPORTED_GO_DIAGNOSTIC_SOURCES.has(diagnostic.source)
  );
}

async function formatDiagnostic(
  diagnostic: Diagnostic
): Promise<FormattedDiagnostic> {
  const cacheKey = JSON.stringify({
    source: diagnostic.source ?? "unknown",
    code: normalizeCode(diagnostic.code) ?? "",
    message: diagnostic.message,
  });
  let markdown = cache.get(cacheKey);

  if (!markdown) {
    markdown = new MarkdownString(
      prettifyDiagnosticForHover({
        message: diagnostic.message,
        source: diagnostic.source,
        code: normalizeCode(diagnostic.code),
      })
    );
    markdown.supportHtml = false;
    if (cache.size >= CACHE_SIZE_MAX) {
      const oldestKey = cacheOrder.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    cache.set(cacheKey, markdown);
    cacheOrder.push(cacheKey);
  }

  return {
    range: diagnostic.range,
    contents: [markdown],
  };
}

function normalizeCode(code: Diagnostic["code"]): string | number | undefined {
  if (typeof code === "string" || typeof code === "number") {
    return code;
  }

  if (code && typeof code === "object" && "value" in code) {
    return code.value;
  }

  return undefined;
}
