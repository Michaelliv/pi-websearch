import type { SearchOptions, SearchProvider, SearchResult } from "../types.js";

export const perplexity: SearchProvider = {
  name: "perplexity",
  envKeys: ["PERPLEXITY_API_KEY"],

  async search(options: SearchOptions & { recencyFilter?: string; domainFilter?: string[] }): Promise<SearchResult[]> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

    const body: Record<string, unknown> = {
      model: "sonar",
      messages: [{ role: "user", content: options.query }],
    };
    if (options.recencyFilter) body.search_recency_filter = options.recencyFilter;
    if (options.domainFilter?.length) body.search_domain_filter = options.domainFilter;

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Perplexity API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const citations: string[] = data.citations ?? [];

    const content =
      citations.length > 0
        ? `${text}\n\n## Sources\n${citations.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}`
        : text;

    return [{ title: "Perplexity Answer", url: "", content }];
  },
};
