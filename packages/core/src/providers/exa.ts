import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const exa: SearchProvider = {
  name: "exa",
  envKeys: ["EXA_API_KEY"],

  async search(
    options: SearchOptions & {
      type?: string;
      startPublishedDate?: string;
      endPublishedDate?: string;
      includeDomains?: string[];
      excludeDomains?: string[];
    },
  ): Promise<SearchResult[]> {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) throw new Error("EXA_API_KEY not set");

    const body: Record<string, unknown> = {
      query: options.query,
      numResults: options.numResults ?? 5,
      type: options.type ?? "auto",
      contents: { text: { maxCharacters: 3000 }, highlights: true },
    };
    if (options.startPublishedDate) body.startPublishedDate = options.startPublishedDate;
    if (options.endPublishedDate) body.endPublishedDate = options.endPublishedDate;
    if (options.includeDomains?.length) body.includeDomains = options.includeDomains;
    if (options.excludeDomains?.length) body.excludeDomains = options.excludeDomains;

    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Exa API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.results ?? []).map(
      (r: {
        title: string;
        url: string;
        text?: string;
        highlights?: string[];
        publishedDate?: string;
        author?: string;
      }) => ({
        title: r.title,
        url: r.url,
        content: [r.text, ...(r.highlights ?? [])].filter(Boolean).join("\n\n"),
        publishedDate: r.publishedDate,
        author: r.author,
      }),
    );
  },
};
