import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const jina: SearchProvider = {
  name: "jina",
  envKeys: ["JINA_API_KEY"],

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const apiKey = process.env.JINA_API_KEY;
    if (!apiKey) throw new Error("JINA_API_KEY not set");

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Retain-Images": "none",
    };
    if (options.numResults) headers["X-Max-Results"] = String(options.numResults);

    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(options.query)}`, { headers });

    if (!res.ok) throw new Error(`Jina AI error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.data ?? []).map((r: { title: string; url: string; content: string; description?: string }) => ({
      title: r.title,
      url: r.url,
      content: r.content ?? r.description ?? "",
    }));
  },
};
