import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readList, repoRoot } from "./docs-only.mjs";
import {
  evaluatePush,
  guardBody,
  planGuardIssue,
  redBody,
} from "./provenance.mjs";

const ZERO = /^0+$/;
const SHA = /^[0-9a-f]{7,64}$/i;
const FULL_SHA = /^[0-9a-f]{40}$/i;
export const BOOTSTRAP_PATH = ".github/main-guard-bootstrap.txt";

export function isAncestorOfBootstrap(sha, bootstrap, root = repoRoot()) {
  if (!SHA.test(sha) || !SHA.test(bootstrap)) {
    throw new Error("main-guard: refusing a non-sha");
  }
  const result = git(root, ["merge-base", "--is-ancestor", sha, bootstrap]);
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`main-guard: merge-base failed for ${sha}`);
}

export function bootstrapChanged(sha, root = repoRoot()) {
  if (!SHA.test(sha)) throw new Error(`main-guard: refusing non-sha ${sha}`);
  const diff = git(root, [
    "diff-tree",
    "--name-status",
    "-r",
    "--no-commit-id",
    `${sha}^`,
    sha,
  ]);
  if (diff.status !== 0) {
    throw new Error(`main-guard: diff-tree failed for ${sha}`);
  }
  return diff.stdout.split("\n").some((line) => {
    const parts = line.split("\t");
    return parts.includes(BOOTSTRAP_PATH) && parts[0] !== "A";
  });
}

export function readBootstrapSha(root, before, after) {
  const text = (fileAt(root, before) ?? fileAt(root, after) ?? "").trim();
  if (!FULL_SHA.test(text)) {
    throw new Error("main-guard: bootstrap sha is missing");
  }
  return text;
}

export function createGithub(token, repository) {
  const [owner, repo] = repository.split("/");
  return {
    async compare(base, head) {
      return api(token, `/repos/${owner}/${repo}/compare/${base}...${head}`);
    },
    async pullsForCommit(sha) {
      return api(token, `/repos/${owner}/${repo}/commits/${sha}/pulls`);
    },
    async checkRuns(sha) {
      const body = await api(
        token,
        `/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`,
      );
      return body.check_runs ?? [];
    },
    async files(number) {
      return paginate(token, `/repos/${owner}/${repo}/pulls/${number}/files`);
    },
    async comments(number) {
      return paginate(
        token,
        `/repos/${owner}/${repo}/issues/${number}/comments`,
      );
    },
    async listIssues(label, state) {
      const issues = await paginate(
        token,
        `/repos/${owner}/${repo}/issues?state=${state}&labels=${encodeURIComponent(label)}`,
      );
      return issues.map(presentIssue);
    },
    async jobs(runId) {
      const body = await api(
        token,
        `/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=100`,
      );
      return body.jobs ?? [];
    },
    async apply(plan) {
      if (plan.action === "open") {
        return api(token, `/repos/${owner}/${repo}/issues`, {
          method: "POST",
          body: JSON.stringify({
            title: plan.title,
            body: plan.body,
            labels: plan.labels,
          }),
        });
      }
      if (plan.action === "reopen") {
        await api(token, `/repos/${owner}/${repo}/issues/${plan.number}`, {
          method: "PATCH",
          body: JSON.stringify({ state: "open", body: plan.body }),
        });
      }
      if (plan.action === "update") {
        return api(token, `/repos/${owner}/${repo}/issues/${plan.number}`, {
          method: "PATCH",
          body: JSON.stringify({ body: plan.body }),
        });
      }
      if (plan.action === "comment" || plan.action === "reopen") {
        return api(
          token,
          `/repos/${owner}/${repo}/issues/${plan.number}/comments`,
          {
            method: "POST",
            body: JSON.stringify({ body: plan.body }),
          },
        );
      }
      return null;
    },
  };
}

// Skip only commits that are ancestors of the bootstrap SHA, including that
// commit. The merge that adds this workflow is newer, so it is checked.
export async function handlePush(event, ctx) {
  const forced = event.forced === true;
  const deleted = event.deleted === true || ZERO.test(event.after ?? "");
  const before = event.before ?? "";
  const after = event.after ?? "";
  let rewritten = false;
  let shas = [];
  if (!forced && !deleted && before && !ZERO.test(before)) {
    const compared = await ctx.github.compare(before, after);
    rewritten = compared.status === "diverged" || compared.status === "behind";
    shas = (compared.commits ?? []).map((commit) => commit.sha);
  }
  const predates =
    ctx.predates ??
    ((sha) =>
      isAncestorOfBootstrap(sha, ctx.bootstrap, ctx.root ?? repoRoot()));
  const commits = [];
  if (!forced && !deleted && !rewritten) {
    for (const sha of shas) {
      if (predates(sha)) {
        console.log(
          `main-guard: skipping ${sha}; it is an ancestor of the bootstrap commit`,
        );
        continue;
      }
      commits.push(await ctx.loadCommit(sha));
    }
  }
  const result = evaluatePush({
    forced,
    deleted,
    rewritten,
    before,
    after,
    commits,
  });
  if (result.ok) return { ...result, issue: { action: "none" } };
  const issue = planGuardIssue({
    openIssues: await ctx.github.listIssues("main-guard", "all"),
    label: "main-guard",
    title: "main-guard: push to main failed provenance",
    body: guardBody(result.problems),
  });
  await ctx.github.apply(issue);
  return { ...result, issue };
}

export async function handleStatus(event, ctx) {
  const run = event.workflow_run ?? {};
  if (run.conclusion !== "failure") return { action: "none" };
  const jobs = await ctx.github.jobs(run.id);
  const failed = jobs
    .filter((job) => job.conclusion === "failure")
    .map((job) => job.name);
  const planned = planGuardIssue({
    openIssues: await ctx.github.listIssues("main-red", "all"),
    label: "main-red",
    title: "main-red: ci.yml failed on main",
    body: "",
  });
  const runUrl = run.html_url ?? "";
  if (planned.action === "open") {
    const created = await ctx.github.apply({
      ...planned,
      body: "ci.yml failed on main.",
    });
    const number = created?.number;
    if (!number) throw new Error("main-guard: opened issue has no number");
    const body = redBody({ jobs: failed, runUrl, number });
    await ctx.github.apply({ action: "update", number, body });
    return { ...planned, number, body };
  }
  const issue = {
    ...planned,
    body: redBody({ jobs: failed, runUrl, number: planned.number }),
  };
  await ctx.github.apply(issue);
  return issue;
}

export async function loadCommit(sha, github, texts) {
  const pulls = await github.pullsForCommit(sha);
  const merged = (pulls ?? []).find(
    (pull) => pull.merged_at && pull.merge_commit_sha === sha,
  );
  const head = merged?.head?.sha;
  const checks = head ? await conclusions(github, head) : {};
  const files = merged ? await filenames(github, merged.number) : [];
  const comments = merged ? await github.comments(merged.number) : [];
  return {
    sha,
    pulls: (pulls ?? []).map((pull) => ({
      number: pull.number,
      merged: Boolean(pull.merged_at),
      merge_commit_sha: pull.merge_commit_sha,
      title: pull.title ?? "",
      body: pull.body ?? "",
    })),
    checks,
    files,
    comments: (comments ?? []).map((comment) => ({ body: comment.body })),
    listText: texts.listText,
    codeowners: texts.codeowners,
    plan: texts.plan,
    bootstrapChanged: bootstrapChanged(sha),
  };
}

export function pickConclusions(runs) {
  const latest = new Map();
  for (const run of runs ?? []) {
    if (run.conclusion === "cancelled") continue;
    const name = jobName(run.name);
    if (name !== "pr-meta" && name !== "fast") continue;
    const prev = latest.get(name);
    if (
      !prev ||
      String(run.completed_at ?? "") > String(prev.completed_at ?? "")
    ) {
      latest.set(name, run);
    }
  }
  return {
    "pr-meta": latest.get("pr-meta")?.conclusion,
    fast: latest.get("fast")?.conclusion,
  };
}

async function conclusions(github, sha) {
  return pickConclusions(await github.checkRuns(sha));
}

function jobName(name) {
  const text = name ?? "";
  if (text === "pr-meta" || text.endsWith("/ pr-meta")) return "pr-meta";
  if (text === "fast" || text.endsWith("/ fast")) return "fast";
  return text;
}

async function filenames(github, number) {
  const files = await github.files(number);
  return files.map((file) => file.filename);
}

function presentIssue(issue) {
  return {
    number: issue.number,
    state: issue.state,
    pull_request: issue.pull_request,
    labels: (issue.labels ?? []).map((label) =>
      typeof label === "string" ? label : label.name,
    ),
  };
}

function git(root, args) {
  return spawnSync("git", args, { cwd: root, encoding: "utf8" });
}

function fileAt(root, rev) {
  if (!rev || ZERO.test(rev) || !SHA.test(rev)) return null;
  const result = git(root, ["show", `${rev}:${BOOTSTRAP_PATH}`]);
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

async function paginate(token, path) {
  const out = [];
  for (let page = 1; page < 20; page += 1) {
    const joiner = path.includes("?") ? "&" : "?";
    const batch = await api(token, `${path}${joiner}per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

async function api(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub ${response.status} ${path}: ${detail}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function textsFromRepo() {
  const root = repoRoot();
  return {
    listText: readList(root),
    codeowners: readFileSync(join(root, "CODEOWNERS"), "utf8"),
    plan: readFileSync(join(root, "docs/IMPLEMENTATION_PLAN.md"), "utf8"),
  };
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const name = process.env.GITHUB_EVENT_NAME;
  if (!token || !repository)
    throw new Error("main-guard: missing GitHub context");
  const github = createGithub(token, repository);
  const texts = textsFromRepo();
  if (name === "push") {
    const result = await handlePush(event, {
      github,
      bootstrap: readBootstrapSha(repoRoot(), event.before, event.after),
      loadCommit: (sha) => loadCommit(sha, github, texts),
    });
    if (!result.ok) process.exit(1);
    return;
  }
  if (name === "workflow_run") {
    await handleStatus(event, { github });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
