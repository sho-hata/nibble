# nibble

[日本語](README.ja.md)

**macOS only.** A CLI tool that randomly surfaces forgotten Chrome bookmarks.

![demo](demo.gif)

## Requirements

- macOS
- Google Chrome
- Node.js 18+ or Bun

## Installation

Run without installing:

```bash
npx @sho-hata/nibble
```

Or install globally:

```bash
npm install -g @sho-hata/nibble
nibble
```

## Usage

### Basic

```bash
npx nibble
```

Presents 5 randomly selected bookmarks from Chrome (use `-n` to change the number):

```
▶    Some article you saved — example.com
     A tool you meant to try — github.com
     That blog post from last year — note.com
     ...

j/k: move  d: remove from bookmarks  o: open in browser  Enter: confirm
```

### Key bindings

| Key | Action |
|-----|--------|
| `j` / `↓` | Move to next item |
| `k` / `↑` | Move to previous item |
| `o` | Mark to open in browser (green) |
| `d` | Mark to remove from bookmarks (red) |
| `Enter` | Confirm — opens marked items, removes marked items |
| `Ctrl+C` | Cancel and exit |

To show 10 candidates:

```bash
npx @sho-hata/nibble -n 10
```

### Auto mode

```bash
npx @sho-hata/nibble --auto
```

Picks one bookmark and opens it immediately — useful for cron jobs or automation.

```bash
# Open a random bookmark every morning at 9am
0 9 * * * npx @sho-hata/nibble --auto
```

## How it works

- Bookmarks source: `~/Library/Application Support/Google/Chrome/Default/Bookmarks`

If Chrome is running when you delete bookmarks, a warning is shown since Chrome may overwrite the file on exit.

## Development

```bash
bun install       # install dependencies
bun run start     # run from source
bun run build     # build to dist/
bun run lint      # lint
bun run fmt       # format
```
