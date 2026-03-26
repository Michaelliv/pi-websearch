import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  country: Type.Optional(Type.String({ description: "Country code for localized results" })),
  language: Type.Optional(Type.String({ description: "Language code for results" })),
});

interface FirecrawlResult {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
}

async function search(
  apiKey: string,
  query: string,
  limit: number,
  country?: string,
  lang?: string,
): Promise<FirecrawlResult[]> {
  const body: Record<string, unknown> = {
    query,
    limit,
    scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
  };
  if (country) body.country = country;
  if (lang) body.lang = lang;

  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
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
      "Search the web using Firecrawl. Returns full page content as markdown, not just snippets. Best when you need the actual content.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set");

      const limit = Math.min(params.numResults ?? 5, 10);
      const results = await search(apiKey, params.query, limit, params.country, params.language);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "firecrawl", results: results.length },
      };
    },
  });
}
