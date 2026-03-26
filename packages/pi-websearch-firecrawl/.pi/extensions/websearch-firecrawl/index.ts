import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 5)" })),
});

interface FirecrawlResult {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
}

async function search(apiKey: string, query: string, limit: number): Promise<FirecrawlResult[]> {
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      query,
      limit,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firecrawl API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.data ?? [];
}

function formatResults(results: FirecrawlResult[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r, i) => {
      const title = r.title ?? r.url;
      const body = r.markdown ?? r.description ?? "";
      return `## ${i + 1}. ${title}\n${r.url}\n\n${body}`;
    })
    .join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Firecrawl. Returns search results with full page content extracted as markdown - not just snippets.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set");

      const limit = Math.min(params.numResults ?? 5, 5);
      const results = await search(apiKey, params.query, limit);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "firecrawl", results: results.length },
      };
    },
  });
}
