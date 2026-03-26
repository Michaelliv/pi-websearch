import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  recencyFilter: Type.Optional(
    Type.Union([Type.Literal("hour"), Type.Literal("day"), Type.Literal("week"), Type.Literal("month")], {
      description: "Filter results by recency",
    }),
  ),
  domainFilter: Type.Optional(
    Type.Array(Type.String(), { description: "Filter to specific domains (prefix with - to exclude)" }),
  ),
});

async function search(
  apiKey: string,
  query: string,
  recencyFilter?: string,
  domainFilter?: string[],
): Promise<{ text: string; citations: string[] }> {
  const body: Record<string, unknown> = {
    model: "sonar",
    messages: [{ role: "user", content: query }],
  };
  if (recencyFilter) body.search_recency_filter = recencyFilter;
  if (domainFilter?.length) body.search_domain_filter = domainFilter;

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const citations: string[] = data.citations ?? [];
  return { text, citations };
}

function formatResults(text: string, citations: string[]): string {
  if (!text) return "No results found.";

  const parts = [text];
  if (citations.length > 0) {
    parts.push("\n\n## Sources");
    for (const [i, url] of citations.entries()) {
      parts.push(`${i + 1}. ${url}`);
    }
  }
  return parts.join("\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Perplexity Sonar. Returns a search-grounded answer with citations. Supports recency and domain filtering.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

      const { text, citations } = await search(apiKey, params.query, params.recencyFilter, params.domainFilter);

      return {
        content: [{ type: "text", text: formatResults(text, citations) }],
        details: { provider: "perplexity", citations: citations.length },
      };
    },
  });
}
