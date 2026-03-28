import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, you } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 20)" })),
  country: Type.Optional(Type.String({ description: "2-char country code (e.g. US, GB, DE)" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using You.com. Returns web results with snippets optimized for AI consumption.",
    parameters: searchSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await you.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 20),
        country: params.country,
      });
      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "you", resultCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
