import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const parallel: SearchProvider = {
  name: "parallel",
  envKeys: ["PARALLEL_API_KEY"],

  async search(options: SearchOptions & { mode?: string }): Promise<SearchResult[]> {
    const apiKey = process.env.PARALLEL_API_KEY;
    if (!apiKey) throw new Error("PARALLEL_API_KEY not set");

    const res = await fetch("https://api.parallel.ai/v1beta/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        objective: options.query,
        search_queries: [options.query],
        mode: options.mode ?? "fast",
        num_results: options.numResults ?? 5,
        excerpts: { max_chars_per_result: 3000 },
      }),
    });

    if (!res.ok) throw new Error(`Parallel API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.results ?? []).map((r: { title: string; url: string; excerpts?: string[] }) => ({
      title: r.title,
      url: r.url,
      content: r.excerpts?.join("\n\n") ?? "",
    }));
  },
};
