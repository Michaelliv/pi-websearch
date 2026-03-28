import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, jina } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Jina AI. Returns search results with full page content as clean text.",
    parameters: searchSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await jina.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 10),
      });
      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "jina", resultCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
