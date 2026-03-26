import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 10)" })),
  country: Type.Optional(Type.String({ description: "2-char country code (e.g. us, gb, de)" })),
  language: Type.Optional(Type.String({ description: "2-char language code (e.g. en, es, fr)" })),
});

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerperKnowledgeGraph {
  title?: string;
  type?: string;
  description?: string;
  attributes?: Record<string, string>;
}

async function search(
  apiKey: string,
  query: string,
  num: number,
  gl?: string,
  hl?: string,
): Promise<{ organic: SerperResult[]; knowledgeGraph?: SerperKnowledgeGraph }> {
  const body: Record<string, unknown> = { q: query, num };
  if (gl) body.gl = gl;
  if (hl) body.hl = hl;

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Serper API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { organic: data.organic ?? [], knowledgeGraph: data.knowledgeGraph };
}

function formatResults(organic: SerperResult[], kg?: SerperKnowledgeGraph): string {
  const parts: string[] = [];

  if (kg?.description) {
    const attrs = kg.attributes
      ? Object.entries(kg.attributes)
          .map(([k, v]) => `- **${k}:** ${v}`)
          .join("\n")
      : "";
    parts.push(`## Knowledge Graph: ${kg.title ?? ""}\n${kg.description}${attrs ? `\n${attrs}` : ""}`);
  }

  if (organic.length === 0 && parts.length === 0) return "No results found.";

  for (const [i, r] of organic.entries()) {
    parts.push(`## ${i + 1}. ${r.title}\n${r.link}\n\n${r.snippet}`);
  }

  return parts.join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Serper (Google). Returns Google search results with snippets and knowledge graph.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const apiKey = process.env.SERPER_API_KEY;
      if (!apiKey) throw new Error("SERPER_API_KEY not set");

      const num = Math.min(params.numResults ?? 10, 10);
      const { organic, knowledgeGraph } = await search(apiKey, params.query, num, params.country, params.language);

      return {
        content: [{ type: "text", text: formatResults(organic, knowledgeGraph) }],
        details: { provider: "serper", results: organic.length },
      };
    },
  });
}
