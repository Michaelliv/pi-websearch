import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { allProviders, resolveProvider } from "../packages/core/src/index.js";

describe("resolveProvider", () => {
  const savedEnv: Record<string, string | undefined> = {};
  const allKeys = allProviders.flatMap((p) => p.envKeys);

  beforeEach(() => {
    for (const k of allKeys) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  test("returns null when no keys set", () => {
    expect(resolveProvider()).toBeNull();
  });

  test("picks provider by env key", () => {
    process.env.TAVILY_API_KEY = "fake";
    expect(resolveProvider()?.name).toBe("tavily");
  });

  test("respects priority order", () => {
    process.env.TAVILY_API_KEY = "fake";
    process.env.BRAVE_API_KEY = "fake";
    expect(resolveProvider()?.name).toBe("brave");
  });

  test("parallel is highest priority", () => {
    process.env.PARALLEL_API_KEY = "fake";
    process.env.BRAVE_API_KEY = "fake";
    process.env.EXA_API_KEY = "fake";
    expect(resolveProvider()?.name).toBe("parallel");
  });

  test("custom provider list", () => {
    process.env.BRAVE_API_KEY = "fake";
    process.env.TAVILY_API_KEY = "fake";
    const tavilyOnly = allProviders.filter((p) => p.name === "tavily");
    expect(resolveProvider(tavilyOnly)?.name).toBe("tavily");
  });

  test("all 12 providers are registered", () => {
    expect(allProviders).toHaveLength(12);
    const names = allProviders.map((p) => p.name);
    for (const expected of [
      "parallel",
      "brave",
      "exa",
      "you",
      "tavily",
      "firecrawl",
      "jina",
      "linkup",
      "valyu",
      "perplexity",
      "serper",
      "serpapi",
    ]) {
      expect(names).toContain(expected);
    }
  });
});
