import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const brave: SearchProvider = {
  name: "brave",
  envKeys: ["BRAVE_API_KEY"],

  async search(options: SearchOptions & { freshness?: string }): Promise<SearchResult[]> {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) throw new Error("BRAVE_API_KEY not set");

    const params = new URLSearchParams({ q: options.query, count: String(options.numResults ?? 5) });
    if (options.country) params.set("country", options.country);
    if (options.freshness) params.set("freshness", options.freshness);

    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`Brave API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.web?.results ?? []).map(
      (r: { title: string; url: string; description: string; extra_snippets?: string[] }) => ({
        title: r.title,
        url: r.url,
        content: [r.description, ...(r.extra_snippets ?? [])].filter(Boolean).join("\n\n"),
      }),
    );
  },
};
