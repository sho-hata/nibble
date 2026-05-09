export type BookmarkUrl = {
  type: "url";
  guid: string;
  id: string;
  name: string;
  url: string;
  date_added: string;
  date_last_used: string;
  meta_info?: Record<string, string>;
};

export type BookmarkFolder = {
  type: "folder";
  guid: string;
  id: string;
  name: string;
  date_added: string;
  date_last_used: string;
  date_modified: string;
  children: BookmarkNode[];
};

export type BookmarkNode = BookmarkUrl | BookmarkFolder;

import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";

export type ChromeBookmarks = {
  checksum: string;
  roots: {
    bookmark_bar: BookmarkFolder;
    other: BookmarkFolder;
    synced: BookmarkFolder;
  };
};

export const readBookmarks = (filePath: string): ChromeBookmarks => {
  if (!existsSync(filePath)) {
    throw new Error(`Bookmarks file not found: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, "utf8")) as ChromeBookmarks;
};

const collectUrls = (node: BookmarkNode, acc: BookmarkUrl[]): void => {
  if (node.type === "url") {
    acc.push(node);
  } else {
    for (const child of node.children) {
      collectUrls(child, acc);
    }
  }
};

export const flattenUrls = (roots: ChromeBookmarks["roots"]): BookmarkUrl[] => {
  const acc: BookmarkUrl[] = [];
  collectUrls(roots.bookmark_bar, acc);
  collectUrls(roots.other, acc);
  collectUrls(roots.synced, acc);
  return acc;
};

export const pick = (bookmarks: BookmarkUrl[], count: number): BookmarkUrl[] => {
  const arr = [...bookmarks];
  const n = Math.min(count, arr.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr.slice(0, n);
};

const filterNode = (node: BookmarkNode, guids: Set<string>): BookmarkNode | null => {
  if (node.type === "url") {
    return guids.has(node.guid) ? null : node;
  }
  const children = node.children
    .map((child) => filterNode(child, guids))
    .filter((n): n is BookmarkNode => n !== null);
  return { ...node, children };
};

export const deleteByGuids = (
  roots: ChromeBookmarks["roots"],
  guids: Set<string>,
): ChromeBookmarks["roots"] => ({
  bookmark_bar: filterNode(roots.bookmark_bar, guids) as BookmarkFolder,
  other: filterNode(roots.other, guids) as BookmarkFolder,
  synced: filterNode(roots.synced, guids) as BookmarkFolder,
});

export const writeBookmarks = async (filePath: string, data: ChromeBookmarks): Promise<void> => {
  await writeFile(filePath, JSON.stringify({ ...data, checksum: "" }, null, 3));
};
