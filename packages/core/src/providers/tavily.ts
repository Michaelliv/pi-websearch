import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const tavily: SearchProvider = {
  name: "tavily",
  envKeys: ["TAVILY_API_KEY"],

  async search(
    options: SearchOptions & {
      searchDepth?: string;
      topic?: string;
      includeDomains?: string[];
      excludeDomains?: string[];
    },
  ): Promise<SearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("TAVILY_API_KEY not set");

    const body: Record<string, unknown> = {
      query: options.query,
      max_results: options.numResults ?? 5,
      search_depth: options.searchDepth ?? "basic",
    };
    if (options.topic) body.topic = options.topic;
    if (options.includeDomains?.length) body.include_domains = options.includeDomains;
    if (options.excludeDomains?.length) body.exclude_domains = options.excludeDomains;

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Tavily API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.results ?? []).map((r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  },
};
