import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const searchSchema = Type.Object({
  query: Type.String({ description: "What to search for. Be specific and descriptive." }),
  numResults: Type.Optional(Type.Number({ description: "Number of results to return (default 5, max 10)" })),
});

interface DataForSeoResult {
  title: string;
  url: string;
  description: string;
  breadcrumb?: string;
}

async function search(login: string, password: string, query: string, depth: number): Promise<DataForSeoResult[]> {
  const auth = btoa(`${login}:${password}`);
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify([{ keyword: query, depth }]),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DataForSEO API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .filter((item: Record<string, string>) => item.type === "organic")
    .map((item: Record<string, string>) => ({
      title: item.title ?? "",
      url: item.url ?? "",
      description: item.description ?? "",
      breadcrumb: item.breadcrumb ?? "",
    }));
}

function formatResults(results: DataForSeoResult[]): string {
  if (results.length === 0) return "No results found.";

  return results.map((r, i) => `## ${i + 1}. ${r.title}\n${r.url}\n\n${r.description}`).join("\n\n---\n\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using DataForSEO (Google SERP). Returns Google search results at the lowest cost per query.",
    parameters: searchSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const login = process.env.DATAFORSEO_LOGIN;
      const password = process.env.DATAFORSEO_PASSWORD;
      if (!login || !password) throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD not set");

      const depth = Math.min(params.numResults ?? 5, 10);
      const results = await search(login, password, params.query, depth);

      return {
        content: [{ type: "text", text: formatResults(results.slice(0, depth)) }],
        details: { provider: "dataforseo", results: results.length },
      };
    },
  });
}
