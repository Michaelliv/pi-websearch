import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { formatResults, serper } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 10)" })),
  country: Type.Optional(Type.String({ description: "2-char country code (e.g. us, gb, de)" })),
  language: Type.Optional(Type.String({ description: "2-char language code (e.g. en, es, fr)" })),
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Serper (Google). Returns Google search results with snippets and knowledge graph.",
    parameters: searchSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await serper.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 10, 10),
        country: params.country,
        language: params.language,
      });
      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "serper", results: results.length },
      };
    },
  });
}
