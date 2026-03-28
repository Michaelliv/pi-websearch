import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, serpapi } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 10)" })),
  engine: Type.Optional(
    Type.String({ description: "Search engine: google, bing, yahoo, duckduckgo, etc. Default: google" }),
  ),
  country: Type.Optional(Type.String({ description: "2-char country code (e.g. us, gb, de)" })),
  language: Type.Optional(Type.String({ description: "2-char language code (e.g. en, es, fr)" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using SerpAPI. Supports Google, Bing, Yahoo, DuckDuckGo and 40+ other engines.",
    parameters: searchSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await serpapi.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 10, 10),
        engine: params.engine,
        country: params.country,
        language: params.language,
      });
      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "serpapi", resultCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
