import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { brave, formatResults } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for (max 400 chars, 50 words)." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 20)" })),
  country: Type.Optional(Type.String({ description: "2-char country code for results origin (default: US)" })),
  freshness: Type.Optional(
    Type.Union([Type.Literal("pd"), Type.Literal("pw"), Type.Literal("pm"), Type.Literal("py")], {
      description: "Filter by freshness: pd=past day, pw=past week, pm=past month, py=past year",
    }),
  ),
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Brave Search. Independent index, not Google. Supports freshness filtering.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await brave.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 20),
        country: params.country,
        freshness: params.freshness,
      });

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "brave", results: results.length },
      };
    },
  });
}
