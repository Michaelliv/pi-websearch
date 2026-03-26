import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
});

interface PerplexityCitation {
  url: string;
}

async function search(apiKey: string, query: string): Promise<{ text: string; citations: string[] }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: query }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const citations = (data.citations ?? []).map((c: string | PerplexityCitation) => (typeof c === "string" ? c : c.url));
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
      "Search the web using Perplexity Sonar. Returns a search-grounded answer with citations. Best for questions that need a synthesized answer rather than raw results.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

      const { text, citations } = await search(apiKey, params.query);

      return {
        content: [{ type: "text", text: formatResults(text, citations) }],
        details: { provider: "perplexity", citations: citations.length },
      };
    },
  });
}
