import { describe, expect, test } from "bun:test";
import { formatResults, type SearchResult } from "../packages/core/src/index.js";

describe("formatResults", () => {
  test("empty results", () => {
    expect(formatResults([])).toBe("No results found.");
  });

  test("single result", () => {
    const results: SearchResult[] = [{ title: "Hello", url: "https://example.com", content: "World" }];
    const out = formatResults(results);
    expect(out).toContain("## 1. Hello");
    expect(out).toContain("https://example.com");
    expect(out).toContain("World");
    expect(out).not.toContain("---"); // no separator for single result
  });

  test("multiple results have separators", () => {
    const results: SearchResult[] = [
      { title: "A", url: "https://a.com", content: "aaa" },
      { title: "B", url: "https://b.com", content: "bbb" },
    ];
    const out = formatResults(results);
    expect(out).toContain("## 1. A");
    expect(out).toContain("## 2. B");
    expect(out).toContain("---");
  });

  test("includes published date", () => {
    const results: SearchResult[] = [{ title: "T", url: "https://t.com", content: "c", publishedDate: "2024-03-01" }];
    expect(formatResults(results)).toContain("(2024-03-01)");
  });

  test("includes author", () => {
    const results: SearchResult[] = [{ title: "T", url: "https://t.com", content: "c", author: "Alice" }];
    expect(formatResults(results)).toContain("by Alice");
  });

  test("includes source type", () => {
    const results: SearchResult[] = [{ title: "T", url: "https://t.com", content: "c", sourceType: "academic" }];
    expect(formatResults(results)).toContain("[academic]");
  });

  test("combines all metadata", () => {
    const results: SearchResult[] = [
      {
        title: "T",
        url: "https://t.com",
        content: "c",
        publishedDate: "2024-01-01",
        author: "Bob",
        sourceType: "premium",
      },
    ];
    const out = formatResults(results);
    expect(out).toContain("(2024-01-01, by Bob, [premium])");
  });
});
