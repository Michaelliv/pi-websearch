import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const firecrawl: SearchProvider = {
  name: "firecrawl",
  envKeys: ["FIRECRAWL_API_KEY"],

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set");

    const body: Record<string, unknown> = {
      query: options.query,
      limit: options.numResults ?? 5,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    };
    if (options.country) body.country = options.country;
    if (options.language) body.lang = options.language;

    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Firecrawl API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.data ?? []).map((r: { url: string; title?: string; description?: string; markdown?: string }) => ({
      title: r.title ?? r.url,
      url: r.url,
      content: r.markdown ?? r.description ?? "",
    }));
  },
};
