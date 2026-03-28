import { keyHint, type ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { allProviders, formatResults, resolveProvider, type SearchResult } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  country: Type.Optional(Type.String({ description: "2-char country code (e.g. us, gb, de)" })),
  language: Type.Optional(Type.String({ description: "2-char language code (e.g. en, es, fr)" })),
});

export default function (pi: ExtensionAPI) {
  const provider = resolveProvider();

  if (!provider) {
    const keys = allProviders.map((p) => p.envKeys.join(" + ")).join(", ");
    console.warn(`[websearch-router] No search provider configured. Set one of: ${keys}`);
    return;
  }

  console.log(`[websearch-router] Using provider: ${provider.name}`);

  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: `Search the web (using ${provider.name}). Returns relevant results with content.`,
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await provider.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 10),
        country: params.country,
        language: params.language,
      });

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: provider.name, resultCount: results.length, items: results },
      };
    },

    renderCall(args: Record<string, unknown>, theme: any) {
      const query = typeof args.query === "string" ? args.query : "...";
      return new Text(
        `${theme.fg("toolTitle", theme.bold("web_search"))} ${theme.fg("accent", query)}`,
        0,
        0,
      );
    },

    renderResult(
      result: { content: any[]; details: any },
      { expanded }: { expanded: boolean; isPartial: boolean },
      theme: any,
    ) {
      const details = result.details ?? {};
      const items: SearchResult[] = details.items ?? [];
      const count = details.resultCount ?? items.length;
      const prov = details.provider ?? "unknown";

      if (items.length === 0) {
        return new Text(theme.fg("muted", "No results found."), 0, 0);
      }

      // Collapsed: show one-line summary per result (title + url)
      if (!expanded) {
        let text = theme.fg("success", `${count} results`) + theme.fg("muted", ` via ${prov}`);
        for (const item of items) {
          text += `\n  ${theme.fg("toolOutput", item.title)}`;
          text += `  ${theme.fg("muted", item.url)}`;
        }
        text += `\n\n${theme.fg("muted", `(${keyHint("app.tools.expand", "to expand")})`)}`;
        return new Text(text, 0, 0);
      }

      // Expanded: show full content
      let text = theme.fg("success", `${count} results`) + theme.fg("muted", ` via ${prov}`);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        text += `\n\n${theme.fg("toolTitle", theme.bold(`${i + 1}. ${item.title}`))}`;
        text += `\n${theme.fg("accent", item.url)}`;
        if (item.content) {
          text += `\n${theme.fg("toolOutput", item.content)}`;
        }
      }
      return new Text(text, 0, 0);
    },
  });
}
