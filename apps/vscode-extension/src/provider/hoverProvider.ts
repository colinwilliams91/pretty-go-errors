import { ExtensionContext, languages, type HoverProvider } from "vscode";
import { formattedDiagnosticsStore } from "../formattedDiagnosticsStore";
import { SUPPORTED_LANGUAGE_IDS } from "../supportedLanguageIds";

const hoverProvider: HoverProvider = {
  provideHover(document, position) {
    const items = formattedDiagnosticsStore.get(document.uri.toString());
    if (!items) {
      return null;
    }

    const matches = items.filter((item) => item.range.contains(position));
    if (matches.length === 0) {
      return null;
    }

    return {
      range: matches[0]?.range,
      contents: matches.flatMap((item) => item.contents)
    };
  }
};

export function registerHoverProvider(context: ExtensionContext) {
  for (const language of SUPPORTED_LANGUAGE_IDS) {
    context.subscriptions.push(languages.registerHoverProvider({ language }, hoverProvider));
  }
}
