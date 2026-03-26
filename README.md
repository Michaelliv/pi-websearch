# pi-websearch

Web search tools for [pi](https://github.com/badlogic/pi). Multiple providers, pick what you need.

## Packages

| Package | Provider | Env var |
|---------|----------|---------|
| [`pi-websearch-parallel`](packages/pi-websearch-parallel) | [Parallel](https://parallel.ai) | `PARALLEL_API_KEY` |
| [`pi-websearch-brave`](packages/pi-websearch-brave) | [Brave Search](https://brave.com/search/api/) | `BRAVE_API_KEY` |
| [`pi-websearch-exa`](packages/pi-websearch-exa) | [Exa](https://exa.ai) | `EXA_API_KEY` |
| [`pi-websearch-tavily`](packages/pi-websearch-tavily) | [Tavily](https://tavily.com) | `TAVILY_API_KEY` |
| [`pi-websearch-serper`](packages/pi-websearch-serper) | [Serper](https://serper.dev) (Google) | `SERPER_API_KEY` |
| [`pi-websearch-serpapi`](packages/pi-websearch-serpapi) | [SerpAPI](https://serpapi.com) (40+ engines) | `SERPAPI_API_KEY` |
| [`pi-websearch-perplexity`](packages/pi-websearch-perplexity) | [Perplexity Sonar](https://docs.perplexity.ai) | `PERPLEXITY_API_KEY` |
| [`pi-websearch-linkup`](packages/pi-websearch-linkup) | [Linkup](https://linkup.so) | `LINKUP_API_KEY` |
| [`pi-websearch-valyu`](packages/pi-websearch-valyu) | [Valyu](https://platform.valyu.ai) (academic/premium) | `VALYU_API_KEY` |
| [`pi-websearch-you`](packages/pi-websearch-you) | [You.com](https://you.com) | `YOU_API_KEY` |
| [`pi-websearch-dataforseo`](packages/pi-websearch-dataforseo) | [DataForSEO](https://dataforseo.com) (Google) | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` |
| [`pi-websearch-firecrawl`](packages/pi-websearch-firecrawl) | [Firecrawl](https://firecrawl.dev) (search + extraction) | `FIRECRAWL_API_KEY` |
| [`pi-websearch-jina`](packages/pi-websearch-jina) | [Jina AI](https://jina.ai) (search + reader) | `JINA_API_KEY` |

## Usage

Install any provider as a pi package:

```bash
pi install pi-websearch-parallel
```

Set your API key:

```bash
export PARALLEL_API_KEY=...
```

The `web_search` tool is now available to the agent. Only install one - they all register the same tool name.
