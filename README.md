# pi-websearch

Web search tools for [pi](https://github.com/badlogic/pi). Multiple providers, pick what you need.

## Packages

| Package | Provider |
|---------|----------|
| `pi-search-parallel` | [Parallel](https://parallel.ai) |
| `pi-search-brave` | [Brave Search](https://brave.com/search/api/) |
| `pi-search-exa` | [Exa](https://exa.ai) |

## Usage

Install any provider as a pi package:

```bash
pi install pi-search-parallel
```

Set your API key:

```bash
export PARALLEL_API_KEY=...
```

The search tool is now available to the agent.
