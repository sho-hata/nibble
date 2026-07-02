import { spawnSync } from "node:child_process";
import type { BookmarkUrl } from "./bookmarks.ts";

export type PromptResult = {
  toDelete: string[];
};

// Truncate a string so its display width (CJK chars count as 2) fits within max,
// preventing terminal line wrapping that breaks cursor-based re-rendering.
const truncateToWidth = (s: string, max: number): string => {
  if (Bun.stringWidth(s) <= max) return s;
  let out = "";
  let width = 0;
  for (const ch of s) {
    const w = Bun.stringWidth(ch);
    if (width + w > max - 1) break;
    out += ch;
    width += w;
  }
  return `${out}…`;
};

const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export const prompt = (candidates: BookmarkUrl[]): Promise<PromptResult> => {
  return new Promise((resolve) => {
    let cursor = 0;
    const toDelete = new Set<string>();
    const toOpen = new Set<string>();
    const hintLine = "j/k: move  d: remove from bookmarks  o: open in browser  Enter: confirm";
    const totalLines = candidates.length + 2;

    const render = (firstRender = false) => {
      const maxWidth = (process.stdout.columns ?? 80) - 1;
      if (!firstRender) {
        process.stdout.write(`\x1b[${totalLines}A`);
      }
      for (const [i, b] of candidates.entries()) {
        const isActive = i === cursor;
        const del = toDelete.has(b.guid);
        const open = toOpen.has(b.guid);
        const title = b.name.length > 50 ? b.name.slice(0, 50) + "…" : b.name;
        const hostname = getHostname(b.url);
        const prefix = isActive ? "▶" : " ";
        const delMark = del ? "✗" : " ";
        const openMark = open ? "→" : " ";
        let line = truncateToWidth(`${prefix} ${delMark}${openMark} ${title} — ${hostname}`, maxWidth);

        if (del && open) line = `\x1b[33m${line}\x1b[0m`;
        else if (del) line = `\x1b[31m${line}\x1b[0m`;
        else if (open) line = `\x1b[32m${line}\x1b[0m`;
        else if (isActive) line = `\x1b[36m${line}\x1b[0m`;

        process.stdout.write(`\x1b[2K\r${line}\n`);
      }
      process.stdout.write(`\x1b[2K\r\n`);
      process.stdout.write(`\x1b[2K\r\x1b[2m${truncateToWidth(hintLine, maxWidth)}\x1b[0m\n`);
    };

    render(true);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    const onData = (key: string) => {
      if (key === "\x1b[A" || key === "k") {
        cursor = Math.max(0, cursor - 1);
      } else if (key === "\x1b[B" || key === "j") {
        cursor = Math.min(candidates.length - 1, cursor + 1);
      } else if (key === "d") {
        const guid = candidates[cursor]!.guid;
        if (toDelete.has(guid)) toDelete.delete(guid);
        else if (!toOpen.has(guid)) toDelete.add(guid);
      } else if (key === "o") {
        const guid = candidates[cursor]!.guid;
        if (toOpen.has(guid)) toOpen.delete(guid);
        else if (!toDelete.has(guid)) toOpen.add(guid);
      } else if (key === "\r") {
        cleanup();
        for (const guid of toOpen) {
          const b = candidates.find((c) => c.guid === guid);
          if (b) spawnSync("open", [b.url]);
        }
        resolve({ toDelete: [...toDelete] });
        return;
      } else if (key === "\x03") {
        cleanup();
        process.exit(0);
      }
      render();
    };

    process.stdin.on("data", onData);
  });
};
