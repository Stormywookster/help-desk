import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", ".git", "docs"]);
const EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".html",
  ".vue",
  ".svelte",
  ".hbs",
  ".eta",
  ".css",
  ".json",
  ".txt",
]);
const SKIP_FILES = new Set([
  "deploy/env.example",
  "package-lock.json",
  // First-start placeholders bundled with the app (AC-GEN-12). Same strings
  // as deploy/env.example, so a production image does not read that file.
  "apps/api/src/settings-defaults.json",
]);

export function placeholderNames(exampleText) {
  return ["BRAND_SITE_NAME", "BRAND_COMPANY_NAME"].map((key) => {
    const match = exampleText.match(new RegExp(`^${key}=([^\\n#]+)`, "m"));
    const value = match?.[1]?.trim() ?? "";
    if (!value) throw new Error(`missing ${key} in deploy/env.example`);
    return value;
  });
}

export function findHardCodedNames(root, names) {
  const needles = names.map((name) => ({ name, needle: name.toLowerCase() }));
  const hits = [];
  for (const file of walk(root)) {
    const rel = relative(root, file).split(sep).join("/");
    if (SKIP_FILES.has(rel) || !EXTS.has(extname(file))) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        const haystack = line.toLowerCase();
        for (const item of needles) {
          if (haystack.includes(item.needle)) {
            hits.push({ file: rel, line: index + 1, name: item.name });
          }
        }
      });
  }
  return hits;
}

export function reportHits(hits) {
  if (hits.length === 0) return "branding check passed\n";
  const lines = ["branding check failed: hard-coded site or company name"];
  for (const hit of hits) lines.push(`${hit.file}:${hit.line}: ${hit.name}`);
  return `${lines.join("\n")}\n`;
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile()) acc.push(full);
  }
  return acc;
}

function main() {
  const root = join(import.meta.dirname, "..");
  const names = placeholderNames(
    readFileSync(join(root, "deploy/env.example"), "utf8"),
  );
  const hits = findHardCodedNames(root, names);
  process.stdout.write(reportHits(hits));
  if (hits.length > 0) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
