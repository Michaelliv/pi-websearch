import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const linkup: SearchProvider = {
  name: "linkup",
  envKeys: ["LINKUP_API_KEY"],

  async search(options: SearchOptions & { depth?: string }): Promise<SearchResult[]> {
    const apiKey = process.env.LINKUP_API_KEY;
    if (!apiKey) throw new Error("LINKUP_API_KEY not set");

    const res = await fetch("https://api.linkup.so/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        q: options.query,
        depth: options.depth ?? "standard",
        outputType: "searchResults",
        includeImages: false,
      }),
    });

    if (!res.ok) throw new Error(`Linkup API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.results ?? []).map((r: { name: string; url: string; content: string }) => ({
      title: r.name,
      url: r.url,
      content: r.content,
    }));
  },
};
