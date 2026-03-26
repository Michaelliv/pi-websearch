import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 10)" })),
  engine: Type.Optional(
    Type.String({ description: "Search engine: google, bing, yahoo, duckduckgo, etc. Default: google" }),
  ),
  country: Type.Optional(Type.String({ description: "2-char country code (e.g. us, gb, de)" })),
  language: Type.Optional(Type.String({ description: "2-char language code (e.g. en, es, fr)" })),
});

interface SerpApiResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerpApiKnowledgeGraph {
  title?: string;
  description?: string;
}

async function search(
  apiKey: string,
  query: string,
  num: number,
  engine: string,
  gl?: string,
  hl?: string,
): Promise<{ organic: SerpApiResult[]; knowledgeGraph?: SerpApiKnowledgeGraph }> {
  const params = new URLSearchParams({ q: query, api_key: apiKey, engine, num: String(num) });
  if (gl) params.set("gl", gl);
  if (hl) params.set("hl", hl);

  const res = await fetch(`https://serpapi.com/search.json?${params}`);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SerpAPI error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { organic: data.organic_results ?? [], knowledgeGraph: data.knowledge_graph };
}

function formatResults(organic: SerpApiResult[], kg?: SerpApiKnowledgeGraph): string {
  const parts: string[] = [];

  if (kg?.description) {
    parts.push(`## Knowledge Graph: ${kg.title ?? ""}\n${kg.description}`);
  }

  if (organic.length === 0 && parts.length === 0) return "No results found.";

  for (const [i, r] of organic.entries()) {
    parts.push(`## ${i + 1}. ${r.title}\n${r.link}\n\n${r.snippet}`);
  }

  return parts.join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using SerpAPI. Supports Google, Bing, Yahoo, DuckDuckGo and 40+ other engines.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.SERPAPI_API_KEY;
      if (!apiKey) throw new Error("SERPAPI_API_KEY not set");

      const num = Math.min(params.numResults ?? 10, 10);
      const engine = params.engine ?? "google";
      const { organic, knowledgeGraph } = await search(
        apiKey,
        params.query,
        num,
        engine,
        params.country,
        params.language,
      );

      return {
        content: [{ type: "text", text: formatResults(organic, knowledgeGraph) }],
        details: { provider: "serpapi", engine, results: organic.length },
      };
    },
  });
}
