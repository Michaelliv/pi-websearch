import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { formatResults, parallel } from "pi-websearch-core";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  mode: Type.Optional(
    Type.Union(
      [
        Type.Literal("fast"),
        Type.Literal("agentic"),
        Type.Literal("hybrid"),
        Type.Literal("hybrid-fast"),
        Type.Literal("one-shot"),
        Type.Literal("parallel"),
        Type.Literal("ultra-fast"),
        Type.Literal("private"),
      ],
      { description: "Search mode (default: fast)" },
    ),
  ),
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Parallel. Returns relevant excerpts from web pages.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await parallel.search({
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 10),
        mode: params.mode,
      });

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "parallel", results: results.length },
      };
    },
  });
}
