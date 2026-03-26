import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 20)" })),
});

interface BraveResult {
  title: string;
  url: string;
  description: string;
  extra_snippets?: string[];
}

async function search(apiKey: string, query: string, count: number): Promise<BraveResult[]> {
  const params = new URLSearchParams({ q: query, count: String(count) });
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brave Search API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.web?.results ?? [];
}

function formatResults(results: BraveResult[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r, i) => {
      const snippets = r.extra_snippets?.join("\n\n") ?? "";
      const body = [r.description, snippets].filter(Boolean).join("\n\n");
      return `## ${i + 1}. ${r.title}\n${r.url}\n\n${body}`;
    })
    .join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Brave Search. Returns web results with descriptions and snippets.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.BRAVE_API_KEY;
      if (!apiKey) throw new Error("BRAVE_API_KEY not set");

      const count = Math.min(params.numResults ?? 5, 20);
      const results = await search(apiKey, params.query, count);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "brave", results: results.length },
      };
    },
  });
}
