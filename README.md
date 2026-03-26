# pi-websearch

Web search tools for [pi](https://github.com/badlogic/pi). Multiple providers, pick what you need.

## Packages

| Package | Provider | Env var |
|---------|----------|---------|
| [`pi-websearch-parallel`](packages/pi-websearch-parallel) | [Parallel](https://parallel.ai) | `PARALLEL_API_KEY` |
| [`pi-websearch-brave`](packages/pi-websearch-brave) | [Brave Search](https://brave.com/search/api/) | `BRAVE_API_KEY` |
| [`pi-websearch-exa`](packages/pi-websearch-exa) | [Exa](https://exa.ai) | `EXA_API_KEY` |

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
