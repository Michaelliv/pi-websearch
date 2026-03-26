import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const serper: SearchProvider = {
  name: "serper",
  envKeys: ["SERPER_API_KEY"],

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) throw new Error("SERPER_API_KEY not set");

    const body: Record<string, unknown> = { q: options.query, num: options.numResults ?? 10 };
    if (options.country) body.gl = options.country;
    if (options.language) body.hl = options.language;

    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Serper API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    const results: SearchResult[] = [];

    if (data.knowledgeGraph?.description) {
      results.push({
        title: `Knowledge Graph: ${data.knowledgeGraph.title ?? ""}`,
        url: "",
        content: data.knowledgeGraph.description,
      });
    }

    for (const r of data.organic ?? []) {
      results.push({ title: r.title, url: r.link, content: r.snippet });
    }

    return results;
  },
};
