import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
});

interface YouResult {
  title: string;
  url: string;
  description: string;
  snippets?: string[];
}

async function search(apiKey: string, query: string, numResults: number): Promise<YouResult[]> {
  const params = new URLSearchParams({ query, num_web_results: String(numResults) });
  const res = await fetch(`https://api.ydc-index.io/search?${params}`, {
    headers: { "X-API-Key": apiKey },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`You.com API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.hits ?? [];
}

function formatResults(results: YouResult[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r, i) => {
      const snippets = r.snippets?.join("\n\n") ?? r.description ?? "";
      return `## ${i + 1}. ${r.title}\n${r.url}\n\n${snippets}`;
    })
    .join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using You.com. Returns web results with snippets optimized for AI consumption.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.YOU_API_KEY;
      if (!apiKey) throw new Error("YOU_API_KEY not set");

      const numResults = Math.min(params.numResults ?? 5, 10);
      const results = await search(apiKey, params.query, numResults);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "you", results: results.length },
      };
    },
  });
}
