import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { classify, readList, repoRoot } from "./docs-only.mjs";

export const TITLE =
  /^(feat|fix|test|docs|ci|chore|refactor)(\([a-z0-9-]+\))?!?: .+/;

export function titleOk(title) {
  return TITLE.test(title);
}

const ZERO = /^0+$/;

export function gitleaksArgs(event) {
  const range = commitRange(event);
  const args = [
    "detect",
    "--source",
    ".",
    "--config",
    ".gitleaks.toml",
    "--redact",
    "--no-banner",
    "--exit-code",
    "1",
  ];
  if (range) args.push("--log-opts", range);
  return args;
}

export function commitRange(event) {
  const name = event.name;
  if (name === "pull_request" && event.pull_request) {
    return `${event.pull_request.base.sha}..${event.pull_request.head.sha}`;
  }
  if (event.before && event.after && !ZERO.test(event.before)) {
    return `${event.before}..${event.after}`;
  }
  return null;
}

export function changedFiles(event, run = git) {
  const name = event.name;
  if (name === "pull_request" && event.pull_request) {
    const base = event.pull_request.base.sha;
    const head = event.pull_request.head.sha;
    return lines(run(["diff", "--name-only", `${base}...${head}`]));
  }
  if (event.before && event.after && !ZERO.test(event.before)) {
    return lines(run(["diff", "--name-only", event.before, event.after]));
  }
  const parent = run(["rev-parse", "--verify", "--quiet", "HEAD^"]);
  if (parent.status === 0 && parent.stdout.trim()) {
    return lines(run(["diff", "--name-only", "HEAD^", "HEAD"]));
  }
  return lines(run(["ls-tree", "-r", "--name-only", "HEAD"]));
}

function lines(result) {
  if (result.status !== 0) {
    throw new Error(result.stderr || "git failed");
  }
  return result.stdout.split("\n").filter((line) => line.length > 0);
}

function git(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

function setOutput(name, value) {
  const line = `${name}=${value}\n`;
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, line);
  else process.stdout.write(line);
}

function readEvent() {
  const name = process.env.GITHUB_EVENT_NAME ?? "";
  const path = process.env.GITHUB_EVENT_PATH;
  const payload = path ? JSON.parse(readFileSync(path, "utf8")) : {};
  return { name, ...payload };
}

function main() {
  const root = repoRoot();
  const event = readEvent();
  if (event.name === "pull_request") {
    const title = event.pull_request?.title ?? "";
    if (!titleOk(title)) {
      console.error(
        `pr-meta: pull request title is not a Conventional Commit: ${title}`,
      );
      process.exit(1);
    }
    console.log("pr-meta: title check passed");
  } else {
    console.log("pr-meta: title check skipped (not a pull request)");
  }

  const scan = spawnSync("gitleaks", gitleaksArgs(event), {
    cwd: root,
    encoding: "utf8",
  });
  if (scan.stdout) process.stdout.write(scan.stdout);
  if (scan.stderr) process.stderr.write(scan.stderr);
  if (scan.status !== 0) {
    console.error("pr-meta: gitleaks found a leak or failed to run");
    process.exit(scan.status ?? 1);
  }

  const docsOnly = classify(changedFiles(event), readList(root));
  console.log(`pr-meta: docs_only=${docsOnly}`);
  setOutput("docs_only", docsOnly ? "true" : "false");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
