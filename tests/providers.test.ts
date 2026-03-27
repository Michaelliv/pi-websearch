import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  brave,
  dataforseo,
  exa,
  firecrawl,
  jina,
  linkup,
  parallel,
  perplexity,
  serpapi,
  serper,
  tavily,
  valyu,
  you,
} from "../packages/core/src/index.js";

// Mock fetch globally
const originalFetch = globalThis.fetch;
let mockResponse: { ok: boolean; status: number; body: unknown };

beforeAll(() => {
  globalThis.fetch = mock(async () => ({
    ok: mockResponse.ok,
    status: mockResponse.status,
    json: async () => mockResponse.body,
    text: async () => JSON.stringify(mockResponse.body),
  })) as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

function setMockResponse(body: unknown, ok = true, status = 200) {
  mockResponse = { ok, status, body };
}

// Set fake API keys for all providers
const fakeKeys: Record<string, string> = {
  PARALLEL_API_KEY: "fake",
  BRAVE_API_KEY: "fake",
  EXA_API_KEY: "fake",
  TAVILY_API_KEY: "fake",
  SERPER_API_KEY: "fake",
  SERPAPI_API_KEY: "fake",
  PERPLEXITY_API_KEY: "fake",
  LINKUP_API_KEY: "fake",
  VALYU_API_KEY: "fake",
  YOU_API_KEY: "fake",
  DATAFORSEO_LOGIN: "fake",
  DATAFORSEO_PASSWORD: "fake",
  FIRECRAWL_API_KEY: "fake",
  JINA_API_KEY: "fake",
};
const savedKeys: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const [k, v] of Object.entries(fakeKeys)) {
    savedKeys[k] = process.env[k];
    process.env[k] = v;
  }
});

afterEach(() => {
  for (const [k, v] of Object.entries(savedKeys)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("parallel", () => {
  test("parses results", async () => {
    setMockResponse({
      results: [
        { title: "Bun Runtime", url: "https://bun.sh", excerpts: ["Fast JS runtime", "Built on JSC"] },
        { title: "Node.js", url: "https://nodejs.org", excerpts: ["Original runtime"] },
      ],
    });
    const results = await parallel.search({ query: "bun runtime" });
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Bun Runtime");
    expect(results[0].content).toContain("Fast JS runtime");
    expect(results[0].content).toContain("Built on JSC");
  });

  test("handles empty results", async () => {
    setMockResponse({ results: [] });
    const results = await parallel.search({ query: "nothing" });
    expect(results).toHaveLength(0);
  });

  test("throws on missing key", async () => {
    delete process.env.PARALLEL_API_KEY;
    await expect(parallel.search({ query: "test" })).rejects.toThrow("PARALLEL_API_KEY not set");
  });

  test("throws on API error", async () => {
    setMockResponse("rate limited", false, 429);
    await expect(parallel.search({ query: "test" })).rejects.toThrow("Parallel API error (429)");
  });
});

describe("brave", () => {
  test("parses results with extra snippets", async () => {
    setMockResponse({
      web: {
        results: [
          { title: "Result", url: "https://r.com", description: "Main snippet", extra_snippets: ["More info"] },
        ],
      },
    });
    const results = await brave.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain("Main snippet");
    expect(results[0].content).toContain("More info");
  });
});

describe("exa", () => {
  test("parses results with highlights and metadata", async () => {
    setMockResponse({
      results: [
        {
          title: "Paper",
          url: "https://arxiv.org/1",
          text: "Full text",
          highlights: ["Key finding"],
          publishedDate: "2024-06-01",
          author: "Alice",
        },
      ],
    });
    const results = await exa.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain("Full text");
    expect(results[0].content).toContain("Key finding");
    expect(results[0].publishedDate).toBe("2024-06-01");
    expect(results[0].author).toBe("Alice");
  });
});

describe("tavily", () => {
  test("parses results", async () => {
    setMockResponse({
      results: [{ title: "Tavily Result", url: "https://t.com", content: "Tavily content" }],
    });
    const results = await tavily.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Tavily Result");
  });
});

describe("serper", () => {
  test("parses organic + knowledge graph", async () => {
    setMockResponse({
      knowledgeGraph: { title: "Bun", description: "A fast JS runtime" },
      organic: [{ title: "Result", link: "https://r.com", snippet: "snippet" }],
    });
    const results = await serper.search({ query: "bun" });
    expect(results).toHaveLength(2);
    expect(results[0].title).toContain("Knowledge Graph");
    expect(results[0].content).toBe("A fast JS runtime");
    expect(results[1].url).toBe("https://r.com");
  });

  test("works without knowledge graph", async () => {
    setMockResponse({
      organic: [{ title: "Result", link: "https://r.com", snippet: "snippet" }],
    });
    const results = await serper.search({ query: "test" });
    expect(results).toHaveLength(1);
  });
});

describe("serpapi", () => {
  test("parses organic + knowledge graph", async () => {
    setMockResponse({
      knowledge_graph: { title: "KG", description: "KG desc" },
      organic_results: [{ title: "R", link: "https://r.com", snippet: "s" }],
    });
    const results = await serpapi.search({ query: "test" });
    expect(results).toHaveLength(2);
    expect(results[0].title).toContain("Knowledge Graph");
  });
});

describe("perplexity", () => {
  test("parses answer with citations", async () => {
    setMockResponse({
      choices: [{ message: { content: "Answer text" } }],
      citations: ["https://source1.com", "https://source2.com"],
    });
    const results = await perplexity.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain("Answer text");
    expect(results[0].content).toContain("source1.com");
    expect(results[0].content).toContain("source2.com");
  });
});

describe("linkup", () => {
  test("parses results", async () => {
    setMockResponse({
      results: [{ name: "Linkup Result", url: "https://l.com", content: "content" }],
    });
    const results = await linkup.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Linkup Result");
  });
});

describe("valyu", () => {
  test("parses results with source type", async () => {
    setMockResponse({
      results: [{ title: "Paper", url: "https://v.com", content: "content", source_type: "academic" }],
    });
    const results = await valyu.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].sourceType).toBe("academic");
  });
});

describe("you", () => {
  test("parses hits with snippets", async () => {
    setMockResponse({
      hits: [{ title: "You Result", url: "https://y.com", description: "desc", snippets: ["snip1", "snip2"] }],
    });
    const results = await you.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain("snip1");
    expect(results[0].content).toContain("snip2");
  });
});

describe("dataforseo", () => {
  test("filters to organic results only", async () => {
    setMockResponse({
      tasks: [
        {
          result: [
            {
              items: [
                { type: "organic", title: "Organic", url: "https://o.com", description: "desc" },
                { type: "paid", title: "Ad", url: "https://a.com", description: "ad" },
              ],
            },
          ],
        },
      ],
    });
    const results = await dataforseo.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Organic");
  });
});

describe("firecrawl", () => {
  test("prefers markdown over description", async () => {
    setMockResponse({
      data: [{ url: "https://f.com", title: "Page", description: "short", markdown: "# Full markdown content" }],
    });
    const results = await firecrawl.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe("# Full markdown content");
  });
});

describe("jina", () => {
  test("parses data array", async () => {
    setMockResponse({
      data: [{ title: "Jina Result", url: "https://j.com", content: "Full page text" }],
    });
    const results = await jina.search({ query: "test" });
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe("Full page text");
  });
});
