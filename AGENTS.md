@README.md

## Dev

- `bun install` from root
- `bun run test:unit` for unit tests
- `bun run test:integration` for integration tests (needs API keys)
- `bun run lint` to check, `bun run lint:fix` to auto-fix

## Adding a Provider

Each provider has two parts:
1. Implementation in `packages/core/src/providers/<name>.ts` — implements `SearchProvider` interface
2. Pi extension in `packages/pi-websearch-<name>/.pi/extensions/websearch-<name>/index.ts` — thin wrapper with provider-specific tool schema

Provider-specific params (depth, freshness, etc.) use `Type.Union` of `Type.Literal` values.

Add new providers to `allProviders` array in `packages/core/src/index.ts` and to the router's detection order.

## Publishing

- Tag `v*` on main triggers release workflow
- `packages/core/` is not published to npm — it's bundled into each package via `bundledDependencies`
- `bun publish` resolves `workspace:*` automatically
