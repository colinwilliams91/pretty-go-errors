import {
  isSupportedGoplsAnalyzerCode,
  prettifyDiagnosticForHover,
} from "@pretty-go-errors/vscode-formatter";
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
  const supportedDiagnostics = dedupeDiagnostics(
    diagnostics.filter(isSupportedDiagnostic)
  );

  if (supportedDiagnostics.length === 0) {
    formattedDiagnosticsStore.delete(uri.toString());
    return;
  }

  const formatted = await Promise.all(
    supportedDiagnostics.map(async (diagnostic) => formatDiagnostic(diagnostic))
  );

  formattedDiagnosticsStore.set(uri.toString(), formatted);
}

// Gopls/VS Code can surface the same diagnostic through more than one
// diagnostic collection; without deduplication each copy would be formatted
// and rendered as a separate hover entry, producing visible duplicates.
function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  const unique: Diagnostic[] = [];
  for (const diagnostic of diagnostics) {
    const key = diagnosticIdentityKey(diagnostic);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(diagnostic);
  }
  return unique;
}

function diagnosticIdentityKey(diagnostic: Diagnostic): string {
  return JSON.stringify({
    source: diagnostic.source ?? "",
    code: normalizeCode(diagnostic.code) ?? "",
    message: diagnostic.message,
    startLine: diagnostic.range.start.line,
    startCharacter: diagnostic.range.start.character,
    endLine: diagnostic.range.end.line,
    endCharacter: diagnostic.range.end.character,
  });
}

function isSupportedDiagnostic(diagnostic: Diagnostic): boolean {
  if (!diagnostic.source) {
    return true;
  }

  if (SUPPORTED_GO_DIAGNOSTIC_SOURCES.has(diagnostic.source)) {
    return true;
  }

  // Gopls analyzer diagnostics set `source` to the analyzer Name (e.g. "SA1000").
  return isSupportedGoplsAnalyzerCode(diagnostic.source);
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
