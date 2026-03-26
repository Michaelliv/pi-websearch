import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({
    description: "What to search for. Exa supports long, semantically rich descriptions for finding niche content.",
  }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
});

interface ExaResult {
  title: string;
  url: string;
  text?: string;
  highlights?: string[];
  publishedDate?: string;
}

async function search(apiKey: string, query: string, numResults: number): Promise<ExaResult[]> {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      query,
      numResults,
      type: "auto",
      contents: { text: { maxCharacters: 3000 }, highlights: true },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Exa API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.results ?? [];
}

function formatResults(results: ExaResult[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r, i) => {
      const date = r.publishedDate ? ` (${r.publishedDate})` : "";
      const highlights = r.highlights?.join("\n\n") ?? "";
      const body = [r.text, highlights].filter(Boolean).join("\n\n");
      return `## ${i + 1}. ${r.title}${date}\n${r.url}\n\n${body}`;
    })
    .join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Exa. Neural search that understands meaning - supports long, descriptive queries. Returns page content and highlights.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.EXA_API_KEY;
      if (!apiKey) throw new Error("EXA_API_KEY not set");

      const numResults = Math.min(params.numResults ?? 5, 10);
      const results = await search(apiKey, params.query, numResults);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "exa", results: results.length },
      };
    },
  });
}
