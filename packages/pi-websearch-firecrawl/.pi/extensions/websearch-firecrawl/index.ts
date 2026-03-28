import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, firecrawl, formatResults } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  country: Type.Optional(Type.String({ description: "Country code for localized results" })),
  language: Type.Optional(Type.String({ description: "Language code for results" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Firecrawl. Returns full page content as markdown, not just snippets. Best when you need the actual content.",
    parameters: searchSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await firecrawl.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 10),
        country: params.country,
        language: params.language,
      });
      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "firecrawl", resultCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
