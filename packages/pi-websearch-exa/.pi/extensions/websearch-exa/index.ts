import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({
    description: "What to search for. Exa supports long, semantically rich descriptions for finding niche content.",
  }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  type: Type.Optional(
    Type.Union([Type.Literal("auto"), Type.Literal("fast"), Type.Literal("instant"), Type.Literal("deep")], {
      description:
        "Search type: auto (best quality), fast, instant (lowest latency), deep (structured output). Default: auto",
    }),
  ),
  startPublishedDate: Type.Optional(
    Type.String({ description: "Filter to results published after this ISO date (e.g. 2024-01-01)" }),
  ),
  endPublishedDate: Type.Optional(Type.String({ description: "Filter to results published before this ISO date" })),
  includeDomains: Type.Optional(Type.Array(Type.String(), { description: "Only include results from these domains" })),
  excludeDomains: Type.Optional(Type.Array(Type.String(), { description: "Exclude results from these domains" })),
});

interface ExaResult {
  title: string;
  url: string;
  text?: string;
  highlights?: string[];
  publishedDate?: string;
  author?: string;
}

async function search(apiKey: string, params: Record<string, unknown>): Promise<ExaResult[]> {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(params),
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
      const author = r.author ? ` by ${r.author}` : "";
      const highlights = r.highlights?.join("\n\n") ?? "";
      const body = [r.text, highlights].filter(Boolean).join("\n\n");
      return `## ${i + 1}. ${r.title}${date}${author}\n${r.url}\n\n${body}`;
    })
    .join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Exa. Neural search that understands meaning. Supports date filtering and domain filtering.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.EXA_API_KEY;
      if (!apiKey) throw new Error("EXA_API_KEY not set");

      const body: Record<string, unknown> = {
        query: params.query,
        numResults: Math.min(params.numResults ?? 5, 10),
        type: params.type ?? "auto",
        contents: { text: { maxCharacters: 3000 }, highlights: true },
      };
      if (params.startPublishedDate) body.startPublishedDate = params.startPublishedDate;
      if (params.endPublishedDate) body.endPublishedDate = params.endPublishedDate;
      if (params.includeDomains?.length) body.includeDomains = params.includeDomains;
      if (params.excludeDomains?.length) body.excludeDomains = params.excludeDomains;

      const results = await search(apiKey, body);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "exa", results: results.length },
      };
    },
  });
}
