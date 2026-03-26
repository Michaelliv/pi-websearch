import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for (max 400 chars, 50 words)." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 20)" })),
  country: Type.Optional(Type.String({ description: "2-char country code for results origin (default: US)" })),
  freshness: Type.Optional(
    Type.Union([Type.Literal("pd"), Type.Literal("pw"), Type.Literal("pm"), Type.Literal("py")], {
      description: "Filter by freshness: pd=past day, pw=past week, pm=past month, py=past year",
    }),
  ),
});

interface BraveResult {
  title: string;
  url: string;
  description: string;
  extra_snippets?: string[];
}

async function search(
  apiKey: string,
  query: string,
  count: number,
  country?: string,
  freshness?: string,
): Promise<BraveResult[]> {
  const params = new URLSearchParams({ q: query, count: String(count) });
  if (country) params.set("country", country);
  if (freshness) params.set("freshness", freshness);

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
    description: "Search the web using Brave Search. Independent index, not Google. Supports freshness filtering.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.BRAVE_API_KEY;
      if (!apiKey) throw new Error("BRAVE_API_KEY not set");

      const count = Math.min(params.numResults ?? 5, 20);
      const results = await search(apiKey, params.query, count, params.country, params.freshness);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "brave", results: results.length },
      };
    },
  });
}
