import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  searchType: Type.Optional(
    Type.Union([Type.Literal("all"), Type.Literal("web"), Type.Literal("academic"), Type.Literal("premium")], {
      description: "Source type: all, web, academic, or premium. Default: all",
    }),
  ),
  maxPrice: Type.Optional(Type.Number({ description: "Maximum budget per query in USD" })),
});

interface ValyuResult {
  title: string;
  url: string;
  content: string;
  source_type?: string;
}

async function search(
  apiKey: string,
  query: string,
  numResults: number,
  searchType: string,
  maxPrice?: number,
): Promise<ValyuResult[]> {
  const body: Record<string, unknown> = { query, search_type: searchType, max_num_results: numResults };
  if (maxPrice !== undefined) body.max_price = maxPrice;

  const res = await fetch("https://api.valyu.network/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Valyu API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.results ?? [];
}

function formatResults(results: ValyuResult[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r, i) => {
      const source = r.source_type ? ` [${r.source_type}]` : "";
      return `## ${i + 1}. ${r.title}${source}\n${r.url}\n\n${r.content}`;
    })
    .join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Valyu. Accesses academic journals, premium content, and paywalled sources alongside the open web.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.VALYU_API_KEY;
      if (!apiKey) throw new Error("VALYU_API_KEY not set");

      const numResults = Math.min(params.numResults ?? 5, 10);
      const searchType = params.searchType ?? "all";
      const results = await search(apiKey, params.query, numResults, searchType, params.maxPrice);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "valyu", results: results.length },
      };
    },
  });
}
