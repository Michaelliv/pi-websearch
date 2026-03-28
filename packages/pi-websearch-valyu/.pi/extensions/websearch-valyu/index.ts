import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, valyu } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  searchType: Type.Optional(
    Type.Union([Type.Literal("all"), Type.Literal("web"), Type.Literal("academic"), Type.Literal("premium")], {
      description: "Source type: all, web, academic, or premium. Default: all",
    }),
  ),
  maxPrice: Type.Optional(Type.Number({ description: "Maximum budget per query in USD" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Valyu. Accesses academic journals, premium content, and paywalled sources alongside the open web.",
    parameters: searchSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await valyu.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 10),
        searchType: params.searchType,
        maxPrice: params.maxPrice,
      });
      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "valyu", resultCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
