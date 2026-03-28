import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, perplexity } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  recencyFilter: Type.Optional(
    Type.Union([Type.Literal("hour"), Type.Literal("day"), Type.Literal("week"), Type.Literal("month")], {
      description: "Filter results by recency",
    }),
  ),
  domainFilter: Type.Optional(
    Type.Array(Type.String(), { description: "Filter to specific domains (prefix with - to exclude)" }),
  ),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Perplexity Sonar. Returns a search-grounded answer with citations. Supports recency and domain filtering.",
    parameters: searchSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await perplexity.search({
        query: params.query,
        recencyFilter: params.recencyFilter,
        domainFilter: params.domainFilter,
      });
      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "perplexity", resultCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
