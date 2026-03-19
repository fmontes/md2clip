#!/usr/bin/env node

import { marked } from "marked";
import { spawnSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

function getStdin() {
  if (process.stdin.isTTY) {
    console.error("md2clip: reads markdown from stdin\n");
    console.error("Usage:");
    console.error("  echo '**hello**' | md2clip");
    console.error("  cat README.md | md2clip");
    process.exit(1);
  }

  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(chunks.join("")));
  });
}

function copyAsHTML(html) {
  const platform = process.platform;

  if (platform === "darwin") {
    copyMacOS(html);
  } else if (platform === "linux") {
    copyLinux(html);
  } else if (platform === "win32") {
    copyWindows(html);
  } else {
    console.error(`md2clip: unsupported platform: ${platform}`);
    process.exit(1);
  }
}

function copyMacOS(html) {
  // Swift sets public.html MIME type so apps receive rich HTML on paste
  const swiftCode = `
import AppKit
let html = CommandLine.arguments[1]
let data = html.data(using: .utf8)!
let pb = NSPasteboard.general
pb.clearContents()
pb.setData(data, forType: NSPasteboard.PasteboardType("public.html"))
pb.setString(html, forType: .string)
`;
  const swiftPath = join(tmpdir(), `_md2clip_${Date.now()}.swift`);
  try {
    writeFileSync(swiftPath, swiftCode);
    const result = spawnSync("swift", [swiftPath, html], { timeout: 10000 });
    if (result.status !== 0) {
      throw new Error(result.stderr?.toString() || "swift failed");
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      // swift not found, fall back to pbcopy (plain text)
      console.error("Warning: swift not found, copying as plain text only.");
      console.error("Fix: xcode-select --install");
      spawnSync("pbcopy", [], { input: html, encoding: "utf8" });
    } else {
      throw err;
    }
  } finally {
    try { unlinkSync(swiftPath); } catch {}
  }
}

function copyLinux(html) {
  // Try xclip then xsel then wl-copy (Wayland)
  const tools = [
    { cmd: "xclip", args: ["-selection", "clipboard", "-t", "text/html"] },
    { cmd: "xsel",  args: ["--clipboard", "--input"] },
    { cmd: "wl-copy", args: ["--type", "text/html"] },
  ];

  for (const tool of tools) {
    const result = spawnSync(tool.cmd, tool.args, {
      input: html,
      encoding: "utf8",
      timeout: 5000,
    });
    if (result.status === 0) return;
  }

  console.error("md2clip: install xclip, xsel, or wl-copy for clipboard support");
  process.exit(1);
}

function copyWindows(html) {
  // PowerShell with HTML clipboard format
  const ps = `
Add-Type -Assembly System.Windows.Forms
$html = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${Buffer.from(html).toString("base64")}'))
[System.Windows.Forms.Clipboard]::SetText($html, [System.Windows.Forms.TextDataFormat]::Html)
`;
  const result = spawnSync("powershell", ["-Command", ps], { encoding: "utf8", timeout: 10000 });
  if (result.status !== 0) {
    throw new Error(result.stderr?.toString() || "powershell failed");
  }
}

async function main() {
  const markdown = await getStdin();

  if (!markdown.trim()) {
    console.error("md2clip: empty input");
    process.exit(1);
  }

  const html = marked(markdown);

  copyAsHTML(html);

  // Also print to stdout so you can pipe further
  process.stdout.write(html);
  console.error("✓ Copied to clipboard as HTML");
}

main().catch((err) => {
  console.error("md2clip error:", err.message);
  process.exit(1);
});
