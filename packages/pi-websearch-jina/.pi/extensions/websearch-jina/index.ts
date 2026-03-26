import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
});

interface JinaResult {
  title: string;
  url: string;
  content: string;
  description?: string;
}

async function search(apiKey: string, query: string, numResults: number): Promise<JinaResult[]> {
  const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Retain-Images": "none",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jina AI error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return (data.data ?? []).slice(0, numResults);
}

function formatResults(results: JinaResult[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r, i) => {
      const body = r.content ?? r.description ?? "";
      return `## ${i + 1}. ${r.title}\n${r.url}\n\n${body}`;
    })
    .join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Jina AI. Returns search results with full page content as clean text.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.JINA_API_KEY;
      if (!apiKey) throw new Error("JINA_API_KEY not set");

      const numResults = Math.min(params.numResults ?? 5, 10);
      const results = await search(apiKey, params.query, numResults);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "jina", results: results.length },
      };
    },
  });
}
