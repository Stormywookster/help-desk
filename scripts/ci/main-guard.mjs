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
const GUARD_PATH = ".github/workflows/main-guard.yml";

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
          body: JSON.stringify({ state: "open" }),
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

// A commit is checked only when a parent already contains this workflow.
// Commits before it lands predate CI, including the commit that adds the file.
export function commitFollowsGuard(sha, root = repoRoot()) {
  if (!SHA.test(sha)) throw new Error(`main-guard: refusing non-sha ${sha}`);
  const commit = git(root, ["rev-parse", "-q", "--verify", `${sha}^{commit}`]);
  if (commit.status !== 0) {
    throw new Error(`main-guard: commit ${sha} is not in this checkout`);
  }
  const parents = git(root, ["rev-parse", `${sha}^@`]);
  if (parents.status !== 0 || !parents.stdout.trim()) return false;
  for (const parent of parents.stdout.trim().split("\n")) {
    const file = git(root, ["cat-file", "-e", `${parent}:${GUARD_PATH}`]);
    if (file.status === 0) return true;
  }
  return false;
}

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
  const follows = ctx.followsGuard ?? commitFollowsGuard;
  const commits = [];
  if (!forced && !deleted && !rewritten) {
    for (const sha of shas) {
      if (!follows(sha)) {
        console.log(`main-guard: skipping ${sha}; it predates main-guard.yml`);
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
  const issue = planGuardIssue({
    openIssues: await ctx.github.listIssues("main-red", "all"),
    label: "main-red",
    title: "main-red: ci.yml failed on main",
    body: redBody({ jobs: failed, runUrl: run.html_url ?? "" }),
  });
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
    })),
    checks,
    files,
    comments: (comments ?? []).map((comment) => ({ body: comment.body })),
    listText: texts.listText,
    codeowners: texts.codeowners,
    plan: texts.plan,
  };
}

async function conclusions(github, sha) {
  const runs = await github.checkRuns(sha);
  const latest = new Map();
  for (const run of runs) {
    const name = jobName(run.name);
    if (name !== "pr-meta" && name !== "fast") continue;
    const prev = latest.get(name);
    if (
      !prev ||
      String(run.completed_at ?? "") > String(prev.completed_at ?? "")
    )
      latest.set(name, run);
  }
  return {
    "pr-meta": latest.get("pr-meta")?.conclusion,
    fast: latest.get("fast")?.conclusion,
  };
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
      loadCommit: (sha) => loadCommit(sha, github, texts),
      followsGuard: (sha) => commitFollowsGuard(sha),
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
