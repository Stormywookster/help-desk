import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dirname, "..");
const TASK_ID = /^M\d+-T\d+[a-z]?$/;

export function definedAcs(markdown) {
  const ids = new Set();
  for (const line of markdown.split("\n")) {
    const bullet = line.match(/^- \*\*(AC-[A-Z]+-\d+)\*\*/);
    const row = line.match(/^\| (AC-[A-Z]+-\d+)\b/);
    if (bullet) ids.add(bullet[1]);
    if (row) ids.add(row[1]);
  }
  return [...ids].sort(compareAc);
}

export function taskOwners(plan) {
  const map = new Map();
  for (const line of plan.split("\n")) {
    const row = line.match(/^\| (AC-[A-Z]+-\d+) \| ([^|]+) \| ([^|]+) \|/);
    if (!row) continue;
    const primary = taskList(row[2])[0] ?? "";
    map.set(row[1], { primary, also: taskList(row[3]) });
  }
  return map;
}

export function taggedTests(dir) {
  const tags = new Map();
  for (const file of walk(dir)) {
    if (!/\.(?:test|spec)\.(?:ts|tsx|js|mjs)$/.test(file)) continue;
    const rel = relative(dir, file).split(sep).join("/");
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/\[(AC-[A-Z]+-\d+)\]([^"'`\n]*)/g)) {
      const title = `[${match[1]}]${match[2]}`.trim();
      const list = tags.get(match[1]) ?? [];
      list.push({ file: rel, title });
      tags.set(match[1], list);
    }
  }
  return tags;
}

export function coverageReport({ defined, owners, tests, task = "" }) {
  const lines = [];
  if (task) {
    lines.push(
      `Task ${task}`,
      acTable(acsForTask(defined, owners, task), tests),
      "",
    );
    const missing = acsForTask(defined, owners, task).filter(
      (id) => !tests.has(id),
    );
    lines.push(
      missing.length === 0
        ? `Uncovered in ${task}: none`
        : `Uncovered in ${task}: ${missing.join(", ")}`,
    );
    return `${lines.join("\n")}\n`;
  }

  const covered = defined.filter((id) => tests.has(id));
  lines.push(
    "AC coverage",
    `defined    ${defined.length}`,
    `covered    ${covered.length}`,
    `uncovered  ${defined.length - covered.length}`,
    "",
    "By primary task",
    taskTable(defined, owners, tests),
    "",
    "Covered tests",
  );
  if (covered.length === 0) lines.push("(none)");
  for (const id of covered) {
    for (const hit of tests.get(id) ?? [])
      lines.push(`${id}  ${hit.file}  ${hit.title}`);
  }
  const unknown = [...tests.keys()]
    .filter((id) => !defined.includes(id))
    .sort(compareAc);
  if (unknown.length > 0) {
    lines.push("", `Unknown tags: ${unknown.join(", ")}`);
  }
  return `${lines.join("\n")}\n`;
}

function acsForTask(defined, owners, task) {
  return defined.filter((id) => {
    const owner = owners.get(id);
    return owner?.primary === task || owner?.also.includes(task);
  });
}

function taskTable(defined, owners, tests) {
  const groups = new Map();
  for (const id of defined) {
    const key = owners.get(id)?.primary || "(unmapped)";
    const group = groups.get(key) ?? { acs: 0, covered: 0 };
    group.acs += 1;
    if (tests.has(id)) group.covered += 1;
    groups.set(key, group);
  }
  const rows = [...groups.entries()]
    .sort(([a], [b]) => compareTask(a, b))
    .map(([name, group]) => [
      name,
      group.covered,
      group.acs,
      group.acs - group.covered,
    ]);
  return table(["Task", "Covered", "ACs", "Uncovered"], rows);
}

function acTable(ids, tests) {
  const rows = ids.map((id) => {
    const hits = tests.get(id) ?? [];
    const shown = hits.map((hit) => `${hit.file}: ${hit.title}`).join("; ");
    return [id, hits.length > 0 ? "yes" : "no", shown || "—"];
  });
  return table(["AC", "Covered", "Tests"], rows);
}

function table(headers, rows) {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => String(row[index]).length), 0),
  );
  const format = (row) =>
    row.map((cell, index) => String(cell).padEnd(widths[index])).join("  ");
  return [format(headers), ...rows.map(format)].join("\n");
}

function taskList(cell) {
  return cell
    .split(",")
    .map((part) => part.trim())
    .filter((part) => TASK_ID.test(part));
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === ".git"
    )
      continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function compareAc(a, b) {
  const left = /^AC-([A-Z]+)-(\d+)$/.exec(a);
  const right = /^AC-([A-Z]+)-(\d+)$/.exec(b);
  if (!left || !right) return a.localeCompare(b);
  if (left[1] !== right[1]) return left[1] < right[1] ? -1 : 1;
  return Number(left[2]) - Number(right[2]);
}

function compareTask(a, b) {
  const left = /^M(\d+)-T(\d+)([a-z]?)$/.exec(a);
  const right = /^M(\d+)-T(\d+)([a-z]?)$/.exec(b);
  if (!left || !right) return a.localeCompare(b);
  return (
    Number(left[1]) - Number(right[1]) ||
    Number(left[2]) - Number(right[2]) ||
    left[3].localeCompare(right[3])
  );
}

function main() {
  const taskFlag = process.argv.indexOf("--task");
  const task = taskFlag === -1 ? "" : (process.argv[taskFlag + 1] ?? "");
  if (taskFlag !== -1 && !TASK_ID.test(task)) {
    console.error("ac-report: --task needs an id such as M0-T03");
    process.exit(1);
  }
  const defined = definedAcs(
    readFileSync(join(root, "docs/ACCEPTANCE_CRITERIA.md"), "utf8"),
  );
  const owners = taskOwners(
    readFileSync(join(root, "docs/IMPLEMENTATION_PLAN.md"), "utf8"),
  );
  process.stdout.write(
    coverageReport({ defined, owners, tests: taggedTests(root), task }),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
