import { spawnSync } from "node:child_process";
import { readBookmarks, flattenUrls, pick, deleteByGuids, writeBookmarks } from "./bookmarks.ts";
import { prompt } from "./ui.ts";

const BOOKMARKS_PATH = `${process.env.HOME}/Library/Application Support/Google/Chrome/Default/Bookmarks`;
const DEFAULT_SUGGEST_COUNT = 5;

const parseCount = (): number => {
  const idx = process.argv.findIndex((a) => a === "-n");
  if (idx === -1) return DEFAULT_SUGGEST_COUNT;
  const val = parseInt(process.argv[idx + 1] ?? "", 10);
  if (isNaN(val) || val < 1) {
    console.error("-n must be a positive integer");
    process.exit(1);
  }
  return val;
};

const isChromeRunning = (): boolean => spawnSync("pgrep", ["-x", "Google Chrome"]).status === 0;

const printHelp = (): void => {
  console.log(`Usage: nibble [options]

Options:
  -n <number>   Number of bookmarks to suggest (default: ${DEFAULT_SUGGEST_COUNT})
  --auto        Open one random bookmark immediately
  --help, -h    Show this help message

Key bindings:
  j / ↓         Move to next item
  k / ↑         Move to previous item
  o             Mark to open in browser
  d             Mark to remove from bookmarks
  Enter         Confirm
  Ctrl+C        Cancel and exit`);
};

const main = async (): Promise<void> => {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  const auto = process.argv.includes("--auto");
  const count = parseCount();

  const data = readBookmarks(BOOKMARKS_PATH);
  const all = flattenUrls(data.roots);

  if (all.length === 0) {
    console.log("No bookmarks found.");
    return;
  }

  if (auto) {
    const [picked] = pick(all, 1);
    spawnSync("open", [picked!.url]);
    return;
  }

  const candidates = pick(all, count);
  const { toDelete } = await prompt(candidates);

  if (toDelete.length === 0) return;

  if (isChromeRunning()) {
    console.warn("\nChrome is running. Deletions may be overwritten when Chrome closes.");
  }

  const updatedRoots = deleteByGuids(data.roots, new Set(toDelete));
  await writeBookmarks(BOOKMARKS_PATH, { ...data, roots: updatedRoots });

  console.log(`\nDeleted ${toDelete.length} bookmark(s).`);
};

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
