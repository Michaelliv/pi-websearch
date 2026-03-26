import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const you: SearchProvider = {
  name: "you",
  envKeys: ["YOU_API_KEY"],

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const apiKey = process.env.YOU_API_KEY;
    if (!apiKey) throw new Error("YOU_API_KEY not set");

    const params = new URLSearchParams({ query: options.query, num_web_results: String(options.numResults ?? 5) });
    if (options.country) params.set("country", options.country);

    const res = await fetch(`https://api.ydc-index.io/search?${params}`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!res.ok) throw new Error(`You.com API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.hits ?? []).map((r: { title: string; url: string; description: string; snippets?: string[] }) => ({
      title: r.title,
      url: r.url,
      content: r.snippets?.join("\n\n") ?? r.description ?? "",
    }));
  },
};
