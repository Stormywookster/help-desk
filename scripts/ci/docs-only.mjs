import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const LIST_PATH = ".github/docs-only-paths.txt";

export function repoRoot() {
  return join(import.meta.dirname, "..", "..");
}

export function readList(root = repoRoot()) {
  return readFileSync(join(root, LIST_PATH), "utf8");
}

export function classify(files, listText) {
  const names = (files ?? [])
    .map((file) => file.replaceAll("\\", "/").replace(/^\.\//, ""))
    .filter((file) => file.length > 0);
  if (names.length === 0) return false;
  if (names.includes(LIST_PATH)) return false;
  const rules = parseList(listText);
  return names.every((file) => fileMatches(file, rules));
}

export function parseList(listText) {
  const include = [];
  const exclude = [];
  for (const raw of listText.split("\n")) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    if (line.startsWith("- ")) exclude.push(line.slice(2).trim());
    else if (line.startsWith("+ ")) include.push(line.slice(2).trim());
    else include.push(line);
  }
  return { include, exclude };
}

export function globMatch(pattern, file) {
  return matchTokens(globTokens(pattern), file, 0, 0);
}

function globTokens(pattern) {
  const tokens = [];
  let literal = "";
  const pushLiteral = () => {
    if (literal.length > 0) tokens.push(literal);
    literal = "";
  };
  for (let i = 0; i < pattern.length; i += 1) {
    if (pattern[i] === "*" && pattern[i + 1] === "*") {
      pushLiteral();
      tokens.push("**");
      i += 1;
      if (pattern[i + 1] === "/") i += 1;
    } else if (pattern[i] === "*") {
      pushLiteral();
      tokens.push("*");
    } else literal += pattern[i];
  }
  pushLiteral();
  return tokens;
}

function matchTokens(tokens, file, tokenIndex, fileIndex) {
  if (tokenIndex === tokens.length) return fileIndex === file.length;
  const token = tokens[tokenIndex];
  if (token === "**") {
    for (let end = fileIndex; end <= file.length; end += 1) {
      if (matchTokens(tokens, file, tokenIndex + 1, end)) return true;
    }
    return false;
  }
  if (token === "*") {
    for (let end = fileIndex; end <= file.length; end += 1) {
      if (end > fileIndex && file[end - 1] === "/") break;
      if (matchTokens(tokens, file, tokenIndex + 1, end)) return true;
    }
    return false;
  }
  if (!file.startsWith(token, fileIndex)) return false;
  return matchTokens(tokens, file, tokenIndex + 1, fileIndex + token.length);
}

function fileMatches(file, rules) {
  if (rules.exclude.some((pattern) => globMatch(pattern, file))) return false;
  return rules.include.some((pattern) => globMatch(pattern, file));
}

function main() {
  const docsOnly = classify(process.argv.slice(2), readList());
  process.stdout.write(docsOnly ? "true\n" : "false\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
