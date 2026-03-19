# CLAUDE.md

`md2clip` is a single-file Node.js CLI tool (ESM, `"type": "module"`) that reads Markdown from stdin, converts it to HTML via `marked`, copies it to the clipboard with a proper HTML MIME type, and echoes the HTML to stdout.

## Known issue: bin path mismatch

`package.json` declares `"bin": { "md2clip": "./bin/md2clip.js" }` but the source file is `md2clip.js` at the repo root. The `bin/` directory does not exist. Before publishing or running `npm link`, either:
- Move `md2clip.js` → `bin/md2clip.js`, or
- Update `package.json` to point at `./md2clip.js`.

## Commands

```bash
npm install           # install dependencies (only: marked)
npm test              # smoke test: pipes "**hello** _world_" through the tool
npm link              # install globally as `md2clip` for local testing
echo "**hi**" | node md2clip.js   # run directly (workaround for bin mismatch)
```

## Architecture

All logic is in `md2clip.js`.

The macOS path is the most complex: it compiles and runs a temporary `.swift` file per invocation (slow but avoids native addons). Errors in the Swift path surface via `result.stderr`.
