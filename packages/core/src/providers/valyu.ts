import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const valyu: SearchProvider = {
  name: "valyu",
  envKeys: ["VALYU_API_KEY"],

  async search(options: SearchOptions & { searchType?: string; maxPrice?: number }): Promise<SearchResult[]> {
    const apiKey = process.env.VALYU_API_KEY;
    if (!apiKey) throw new Error("VALYU_API_KEY not set");

    const body: Record<string, unknown> = {
      query: options.query,
      search_type: options.searchType ?? "all",
      max_num_results: options.numResults ?? 5,
    };
    if (options.maxPrice !== undefined) body.max_price = options.maxPrice;

    const res = await fetch("https://api.valyu.network/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Valyu API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.results ?? []).map((r: { title: string; url: string; content: string; source_type?: string }) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      sourceType: r.source_type,
    }));
  },
};
