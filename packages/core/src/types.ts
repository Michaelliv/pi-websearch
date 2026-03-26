/** Normalized search result across all providers. */
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  author?: string;
  sourceType?: string;
}

/** Common search options. Providers may support a subset. */
export interface SearchOptions {
  query: string;
  numResults?: number;
  country?: string;
  language?: string;
}

/** A search provider implementation. */
export interface SearchProvider {
  /** Provider identifier (e.g. "brave", "exa"). */
  name: string;
  /** Environment variable names required. First one found enables the provider. */
  envKeys: string[];
  /** Execute a search and return normalized results. */
  search(options: SearchOptions & Record<string, unknown>): Promise<SearchResult[]>;
}

/** Format search results as markdown for the agent. */
export function formatResults(results: SearchResult[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r, i) => {
      const meta: string[] = [];
      if (r.publishedDate) meta.push(r.publishedDate);
      if (r.author) meta.push(`by ${r.author}`);
      if (r.sourceType) meta.push(`[${r.sourceType}]`);
      const suffix = meta.length > 0 ? ` (${meta.join(", ")})` : "";
      return `## ${i + 1}. ${r.title}${suffix}\n${r.url}\n\n${r.content}`;
    })
    .join("\n\n---\n\n");
}
