import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, linkup } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  depth: Type.Optional(
    Type.Union([Type.Literal("fast"), Type.Literal("standard"), Type.Literal("deep")], {
      description:
        "Search depth: fast (sub-second, simple queries), standard (balanced, default), or deep (thorough, multi-step). Default: standard",
    }),
  ),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Linkup. Accesses premium and paywalled sources. Supports fast, standard, and deep search.",
    parameters: searchSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await linkup.search({ query: params.query, depth: params.depth });
      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "linkup", resultCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
