import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
});

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

async function search(apiKey: string, query: string, maxResults: number): Promise<TavilyResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query, max_results: maxResults, include_raw_content: false }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tavily API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.results ?? [];
}

function formatResults(results: TavilyResult[]): string {
  if (results.length === 0) return "No results found.";

  return results.map((r, i) => `## ${i + 1}. ${r.title}\n${r.url}\n\n${r.content}`).join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Tavily. Returns relevant content extracted from web pages.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) throw new Error("TAVILY_API_KEY not set");

      const maxResults = Math.min(params.numResults ?? 5, 10);
      const results = await search(apiKey, params.query, maxResults);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "tavily", results: results.length },
      };
    },
  });
}
