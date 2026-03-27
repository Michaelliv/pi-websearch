export { brave } from "./providers/brave.js";
export { exa } from "./providers/exa.js";
export { firecrawl } from "./providers/firecrawl.js";
export { jina } from "./providers/jina.js";
export { linkup } from "./providers/linkup.js";
export { parallel } from "./providers/parallel.js";
export { perplexity } from "./providers/perplexity.js";
export { serpapi } from "./providers/serpapi.js";
export { serper } from "./providers/serper.js";
export { tavily } from "./providers/tavily.js";
export { valyu } from "./providers/valyu.js";
export { you } from "./providers/you.js";
export type { SearchOptions, SearchProvider, SearchResult } from "./types.js";
export { formatResults } from "./types.js";

import { brave } from "./providers/brave.js";
import { exa } from "./providers/exa.js";
import { firecrawl } from "./providers/firecrawl.js";
import { jina } from "./providers/jina.js";
import { linkup } from "./providers/linkup.js";
import { parallel } from "./providers/parallel.js";
import { perplexity } from "./providers/perplexity.js";
import { serpapi } from "./providers/serpapi.js";
import { serper } from "./providers/serper.js";
import { tavily } from "./providers/tavily.js";
import { valyu } from "./providers/valyu.js";
import { you } from "./providers/you.js";
import type { SearchProvider } from "./types.js";

/** All available providers, ordered by preference (own index first, then hybrid, then SERP scrapers). */
export const allProviders: SearchProvider[] = [
  parallel,
  brave,
  exa,
  you,
  tavily,
  firecrawl,
  jina,
  linkup,
  valyu,
  perplexity,
  serper,
  serpapi,
];

/** Find the first provider that has its env keys set. */
export function resolveProvider(providers: SearchProvider[] = allProviders): SearchProvider | null {
  for (const p of providers) {
    const hasKeys = p.envKeys.every((key) => process.env[key]);
    if (hasKeys) return p;
  }
  return null;
}
