import { describe, expect, test } from "bun:test";
import { allProviders, formatResults, resolveProvider, type SearchProvider } from "../packages/core/src/index.js";

// Integration tests — only run for providers that have API keys set.
// Run with: PARALLEL_API_KEY=... bun test tests/integration.test.ts

function integrationTest(provider: SearchProvider) {
  const hasKeys = provider.envKeys.every((k) => process.env[k]);

  describe(provider.name, () => {
    test.skipIf(!hasKeys)(
      "search returns results",
      async () => {
        const results = await provider.search({ query: "what is TypeScript", numResults: 3 });
        expect(results.length).toBeGreaterThan(0);

        for (const r of results) {
          expect(r.title).toBeDefined();
          expect(typeof r.title).toBe("string");
          expect(typeof r.content).toBe("string");
          expect(r.content.length).toBeGreaterThan(0);
        }

        // Verify formatResults doesn't throw
        const formatted = formatResults(results);
        expect(formatted).toContain("## 1.");
        expect(formatted.length).toBeGreaterThan(50);
      },
      15_000,
    );
  });
}

describe("integration", () => {
  for (const provider of allProviders) {
    integrationTest(provider);
  }

  test("resolveProvider returns a working provider", async () => {
    const provider = resolveProvider();
    if (!provider) {
      console.log("No API keys set, skipping resolveProvider integration test");
      return;
    }

    const results = await provider.search({ query: "hello world", numResults: 2 });
    expect(results.length).toBeGreaterThan(0);
  });
});
