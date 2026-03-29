import type { SearchResult } from "./types.js";

/**
 * Create renderCall and renderResult functions for the web_search tool.
 * Pass in the pi-coding-agent and pi-tui imports so core stays dependency-free.
 */
export function createRenderers(keyHint: (id: string, desc: string) => string, Text: any) {
  return {
    renderCall(args: Record<string, unknown>, theme: any) {
      const query = typeof args.query === "string" ? args.query : "...";
      return new Text(`${theme.fg("toolTitle", theme.bold("web_search"))} ${theme.fg("accent", query)}`, 0, 0);
    },

    renderResult(
      result: { content: any[]; details: any },
      { expanded }: { expanded: boolean; isPartial: boolean },
      theme: any,
    ) {

      const details = result.details ?? {};
      const items: SearchResult[] = details.items ?? [];
      const count = details.resultCount ?? items.length;
      const prov = details.provider ?? "unknown";

      if (items.length === 0) {
        return new Text(theme.fg("muted", "No results found."), 0, 0);
      }

      if (!expanded) {
        let text = theme.fg("success", `${count} results`) + theme.fg("muted", ` via ${prov}`);
        for (const item of items) {
          text += `\n  ${theme.fg("toolOutput", item.title)}`;
          text += `  ${theme.fg("muted", item.url)}`;
        }
        text += `\n\n${theme.fg("muted", `(${keyHint("app.tools.expand", "to expand")})`)}`;
        return new Text(text, 0, 0);
      }

      let text = theme.fg("success", `${count} results`) + theme.fg("muted", ` via ${prov}`);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        text += `\n\n${theme.fg("toolTitle", theme.bold(`${i + 1}. ${item.title}`))}`;
        text += `\n${theme.fg("accent", item.url)}`;
        if (item.content) {
          text += `\n${theme.fg("toolOutput", item.content)}`;
        }
      }
      return new Text(text, 0, 0);
    },
  };
}
