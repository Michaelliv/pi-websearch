import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const serpapi: SearchProvider = {
  name: "serpapi",
  envKeys: ["SERPAPI_API_KEY"],

  async search(options: SearchOptions & { engine?: string }): Promise<SearchResult[]> {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) throw new Error("SERPAPI_API_KEY not set");

    const params = new URLSearchParams({
      q: options.query,
      api_key: apiKey,
      engine: options.engine ?? "google",
      num: String(options.numResults ?? 10),
    });
    if (options.country) params.set("gl", options.country);
    if (options.language) params.set("hl", options.language);

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) throw new Error(`SerpAPI error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    const results: SearchResult[] = [];

    if (data.knowledge_graph?.description) {
      results.push({
        title: `Knowledge Graph: ${data.knowledge_graph.title ?? ""}`,
        url: "",
        content: data.knowledge_graph.description,
      });
    }

    for (const r of data.organic_results ?? []) {
      results.push({ title: r.title, url: r.link, content: r.snippet });
    }

    return results;
  },
};
