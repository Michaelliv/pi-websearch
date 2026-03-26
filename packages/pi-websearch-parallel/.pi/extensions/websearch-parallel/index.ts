import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

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

interface ParallelResult {
  url: string;
  title: string;
  excerpts: string[];
}

async function search(apiKey: string, query: string, numResults: number, mode: string): Promise<ParallelResult[]> {
  const res = await fetch("https://api.parallel.ai/v1beta/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      objective: query,
      search_queries: [query],
      mode,
      num_results: numResults,
      excerpts: { max_chars_per_result: 3000 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Parallel API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.results ?? [];
}

function formatResults(results: ParallelResult[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r, i) => {
      const excerpts = r.excerpts?.join("\n\n") ?? "";
      return `## ${i + 1}. ${r.title}\n${r.url}\n\n${excerpts}`;
    })
    .join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Parallel. Returns relevant excerpts from web pages.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.PARALLEL_API_KEY;
      if (!apiKey) throw new Error("PARALLEL_API_KEY not set");

      const numResults = Math.min(params.numResults ?? 5, 10);
      const mode = params.mode ?? "fast";
      const results = await search(apiKey, params.query, numResults, mode);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "parallel", results: results.length },
      };
    },
  });
}
