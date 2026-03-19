# md2clip

Pipe markdown into your terminal, get HTML in your clipboard with proper `text/html` MIME type.

Apps like Notion, Slack, Mail, and Google Docs will paste it as rich text.

## Install

```bash
npm install -g md2clip
```

## Usage

```bash
echo "**bold** and _italic_" | md2clip
cat README.md | md2clip
pbpaste | md2clip   # convert clipboard markdown to HTML
```

Output is also printed to stdout, so you can pipe further:

```bash
cat doc.md | md2clip | less
```

## Platform support

| Platform | Method | MIME type |
|----------|--------|-----------|
| macOS    | Swift + NSPasteboard | `public.html` |
| Linux    | xclip / xsel / wl-copy | `text/html` |
| Windows  | PowerShell + System.Windows.Forms | HTML format |

### macOS requirement

Requires Xcode Command Line Tools for proper HTML MIME type:

```bash
xcode-select --install
```

Without it, falls back to `pbcopy` (plain text only).

### Linux requirement

Install one of: `xclip`, `xsel`, or `wl-copy`.

```bash
# Ubuntu/Debian
sudo apt install xclip
```

## License

MIT
