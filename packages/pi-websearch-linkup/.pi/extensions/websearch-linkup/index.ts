import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
  depth: Type.Optional(
    Type.Union([Type.Literal("standard"), Type.Literal("deep")], {
      description: "Search depth: 'standard' for fast results, 'deep' for thorough research (default: standard)",
    }),
  ),
});

interface LinkupResult {
  name: string;
  url: string;
  content: string;
}

async function search(apiKey: string, query: string, numResults: number, depth: string): Promise<LinkupResult[]> {
  const res = await fetch("https://api.linkup.so/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      q: query,
      depth,
      outputType: "searchResults",
      includeImages: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Linkup API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return (data.results ?? []).slice(0, numResults);
}

function formatResults(results: LinkupResult[]): string {
  if (results.length === 0) return "No results found.";

  return results.map((r, i) => `## ${i + 1}. ${r.name}\n${r.url}\n\n${r.content}`).join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Linkup. Accesses premium and paywalled sources. Supports 'standard' and 'deep' search modes.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.LINKUP_API_KEY;
      if (!apiKey) throw new Error("LINKUP_API_KEY not set");

      const numResults = Math.min(params.numResults ?? 5, 10);
      const depth = params.depth ?? "standard";
      const results = await search(apiKey, params.query, numResults, depth);

      return {
        content: [{ type: "text", text: formatResults(results) }],
        details: { provider: "linkup", results: results.length },
      };
    },
  });
}
