import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  searchDepth: Type.Optional(
    Type.Union([Type.Literal("basic"), Type.Literal("advanced")], {
      description: "Search depth: basic (fast) or advanced (thorough). Default: basic",
    }),
  ),
  topic: Type.Optional(
    Type.Union([Type.Literal("general"), Type.Literal("news"), Type.Literal("finance")], {
      description: "Topic category. Default: general",
    }),
  ),
  includeDomains: Type.Optional(Type.Array(Type.String(), { description: "Only include results from these domains" })),
  excludeDomains: Type.Optional(Type.Array(Type.String(), { description: "Exclude results from these domains" })),
});

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

async function search(apiKey: string, params: Record<string, unknown>): Promise<TavilyResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(params),
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
    description: "Search the web using Tavily. Supports topic filtering (general, news, finance) and domain filtering.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) throw new Error("TAVILY_API_KEY not set");

      const body: Record<string, unknown> = {
        query: params.query,
        max_results: Math.min(params.numResults ?? 5, 10),
        search_depth: params.searchDepth ?? "basic",
      };
      if (params.topic) body.topic = params.topic;
      if (params.includeDomains?.length) body.include_domains = params.includeDomains;
      if (params.excludeDomains?.length) body.exclude_domains = params.excludeDomains;

      const results = await search(apiKey, body);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "tavily", results: results.length },
      };
    },
  });
}
