import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const dataforseo: SearchProvider = {
  name: "dataforseo",
  envKeys: ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"],

  async search(options: SearchOptions & { languageCode?: string }): Promise<SearchResult[]> {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD not set");

    const auth = btoa(`${login}:${password}`);
    const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify([
        {
          keyword: options.query,
          depth: options.numResults ?? 10,
          language_code: options.languageCode ?? options.language ?? "en",
        },
      ]),
    });

    if (!res.ok) throw new Error(`DataForSEO API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
    return items
      .filter((item: Record<string, string>) => item.type === "organic")
      .map((item: Record<string, string>) => ({
        title: item.title ?? "",
        url: item.url ?? "",
        content: item.description ?? "",
      }));
  },
};
