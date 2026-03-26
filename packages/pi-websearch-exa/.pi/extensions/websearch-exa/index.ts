import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { exa, formatResults } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({
    description: "What to search for. Exa supports long, semantically rich descriptions for finding niche content.",
  }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  type: Type.Optional(
    Type.Union([Type.Literal("auto"), Type.Literal("fast"), Type.Literal("instant"), Type.Literal("deep")], {
      description: "Search type: auto (best quality), fast, instant (lowest latency), deep. Default: auto",
    }),
  ),
  startPublishedDate: Type.Optional(
    Type.String({ description: "Filter to results after this ISO date (e.g. 2024-01-01)" }),
  ),
  endPublishedDate: Type.Optional(Type.String({ description: "Filter to results before this ISO date" })),
  includeDomains: Type.Optional(Type.Array(Type.String(), { description: "Only include results from these domains" })),
  excludeDomains: Type.Optional(Type.Array(Type.String(), { description: "Exclude results from these domains" })),
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Exa. Neural search that understands meaning. Supports date and domain filtering.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await exa.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 10),
        type: params.type,
        startPublishedDate: params.startPublishedDate,
        endPublishedDate: params.endPublishedDate,
        includeDomains: params.includeDomains,
        excludeDomains: params.excludeDomains,
      });

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "exa", results: results.length },
      };
    },
  });
}
