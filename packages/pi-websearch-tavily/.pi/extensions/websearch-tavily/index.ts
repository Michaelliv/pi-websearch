import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, tavily } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  searchDepth: Type.Optional(
    Type.Union([Type.Literal("basic"), Type.Literal("advanced")], {
      description: "Search depth: basic (fast) or advanced (thorough). Default: basic",
    }),
  ),
  topic: Type.Optional(
    Type.Union([Type.Literal("general"), Type.Literal("news"), Type.Literal("finance")], {
      description: "Topic category. Default: general",
    }),
  ),
  includeDomains: Type.Optional(Type.Array(Type.String(), { description: "Only include results from these domains" })),
  excludeDomains: Type.Optional(Type.Array(Type.String(), { description: "Exclude results from these domains" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Tavily. Supports topic filtering (general, news, finance) and domain filtering.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await tavily.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 10),
        searchDepth: params.searchDepth,
        topic: params.topic,
        includeDomains: params.includeDomains,
        excludeDomains: params.excludeDomains,
      });

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "tavily", resultCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
