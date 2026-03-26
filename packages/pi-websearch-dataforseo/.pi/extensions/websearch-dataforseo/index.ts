import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { dataforseo, formatResults } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 10)" })),
  languageCode: Type.Optional(Type.String({ description: "Language code (e.g. en, es, fr). Default: en" })),
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using DataForSEO (Google SERP). Lowest cost per query among SERP scrapers.",
    parameters: searchSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await dataforseo.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 10, 10),
        language: params.languageCode,
      });
      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "dataforseo", results: results.length },
      };
    },
  });
}
