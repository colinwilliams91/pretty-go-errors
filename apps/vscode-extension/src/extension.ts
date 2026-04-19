import { ExtensionContext, window } from "vscode";
import {
  refreshDiagnosticsForUri,
  registerOnDidChangeDiagnostics,
} from "./diagnostics";
import { registerHoverProvider } from "./provider/hoverProvider";
import { SUPPORTED_LANGUAGE_IDS } from "./supportedLanguageIds";

export function activate(context: ExtensionContext) {
  registerHoverProvider(context);
  registerOnDidChangeDiagnostics(context);

  for (const editor of window.visibleTextEditors) {
    if (SUPPORTED_LANGUAGE_IDS.includes(editor.document.languageId)) {
      void refreshDiagnosticsForUri(editor.document.uri);
    }
  }
}

export function deactivate() {
  // no-op for hover-only MVP
}
