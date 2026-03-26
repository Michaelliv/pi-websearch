# pi-websearch

Web search tools for [pi](https://github.com/badlogic/pi). 13 providers, pick what you need.

## Quick start - Router (recommended)

Install the router - it auto-detects which API key you have and uses that provider:

```bash
pi install pi-websearch-router
export PARALLEL_API_KEY=...  # or any other provider's key
```

The `web_search` tool is now available. The router checks for keys in this order: Parallel, Brave, Exa, You.com, Tavily, Firecrawl, Jina, Linkup, Valyu, Perplexity, Serper, SerpAPI, DataForSEO.

## Pick a specific provider

If you want provider-specific parameters (e.g. Exa's date filtering, Brave's freshness filter), install that provider directly:

```bash
pi install pi-websearch-exa
export EXA_API_KEY=...
```

## Packages

| Package | Provider | Env var |
|---------|----------|---------|
| **[`pi-websearch-router`](packages/pi-websearch-router)** | **Auto-detect** | **Any below** |
| [`pi-websearch-parallel`](packages/pi-websearch-parallel) | [Parallel](https://parallel.ai) | `PARALLEL_API_KEY` |
| [`pi-websearch-brave`](packages/pi-websearch-brave) | [Brave Search](https://brave.com/search/api/) | `BRAVE_API_KEY` |
| [`pi-websearch-exa`](packages/pi-websearch-exa) | [Exa](https://exa.ai) | `EXA_API_KEY` |
| [`pi-websearch-tavily`](packages/pi-websearch-tavily) | [Tavily](https://tavily.com) | `TAVILY_API_KEY` |
| [`pi-websearch-serper`](packages/pi-websearch-serper) | [Serper](https://serper.dev) (Google) | `SERPER_API_KEY` |
| [`pi-websearch-serpapi`](packages/pi-websearch-serpapi) | [SerpAPI](https://serpapi.com) (40+ engines) | `SERPAPI_API_KEY` |
| [`pi-websearch-perplexity`](packages/pi-websearch-perplexity) | [Perplexity Sonar](https://docs.perplexity.ai) | `PERPLEXITY_API_KEY` |
| [`pi-websearch-linkup`](packages/pi-websearch-linkup) | [Linkup](https://linkup.so) | `LINKUP_API_KEY` |
| [`pi-websearch-valyu`](packages/pi-websearch-valyu) | [Valyu](https://platform.valyu.ai) | `VALYU_API_KEY` |
| [`pi-websearch-you`](packages/pi-websearch-you) | [You.com](https://you.com) | `YOU_API_KEY` |
| [`pi-websearch-dataforseo`](packages/pi-websearch-dataforseo) | [DataForSEO](https://dataforseo.com) | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` |
| [`pi-websearch-firecrawl`](packages/pi-websearch-firecrawl) | [Firecrawl](https://firecrawl.dev) | `FIRECRAWL_API_KEY` |
| [`pi-websearch-jina`](packages/pi-websearch-jina) | [Jina AI](https://jina.ai) | `JINA_API_KEY` |

## Architecture

```
packages/
├── core/                    # Shared types, provider implementations, formatResults()
├── pi-websearch-router/     # Auto-detect provider, common schema
├── pi-websearch-parallel/   # Provider-specific schema + delegates to core
├── pi-websearch-brave/
├── ...
```

- **`core`** exports `SearchProvider` interface, `SearchResult` type, `formatResults()`, all 13 provider implementations, and `resolveProvider()` for auto-detection.
- **Individual packages** are thin pi extension wrappers with provider-specific tool schemas.
- **Router** uses `resolveProvider()` to find the first available provider and registers a generic `web_search` tool.

Only install one package at a time - they all register the same `web_search` tool name.
