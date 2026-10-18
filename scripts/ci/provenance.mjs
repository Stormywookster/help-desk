import { classify, globMatch } from "./docs-only.mjs";
import { taskOwners } from "../ac-report.mjs";

const ROLES = ["Architect", "QA", "Designer", "Support Ops", "Project Lead"];
const REVIEW =
  /^REVIEW (Architect|QA|Designer|Support Ops|Project Lead): (APPROVED|CHANGES REQUESTED)\b/;
const TASK_ID = /\[(M\d-T\d\d[a-z]?|fix-M\d-T\d\d)\]/;

export function evaluatePush(input) {
  const forced = input.forced === true;
  const deleted = input.deleted === true;
  const rewritten = input.rewritten === true;
  const before = input.before ?? "";
  const after = input.after ?? "";
  const commits = input.commits ?? [];
  const problems = [];
  if (forced) {
    problems.push({ commit: after || before, problem: "force push" });
  }
  if (deleted) {
    problems.push({
      commit: before || after,
      problem: "push deleted or rewrote main",
    });
  }
  if (rewritten && !forced && !deleted) {
    problems.push({ commit: after, problem: "rewritten history" });
  }
  if (forced || deleted || rewritten) return { ok: false, problems };
  for (const commit of commits) problems.push(...evaluateCommit(commit));
  return { ok: problems.length === 0, problems };
}

export function evaluateCommit(commit) {
  const problems = [];
  const sha = commit.sha;
  const merged = (commit.pulls ?? []).filter(
    (pull) => pull.merged === true && pull.merge_commit_sha === sha,
  );
  if (commit.bootstrapChanged === true) {
    problems.push({
      commit: sha,
      problem: "changed .github/main-guard-bootstrap.txt",
    });
  }
  if (merged.length === 0) {
    problems.push({
      commit: sha,
      problem: "direct push with no merged pull request",
    });
    return problems;
  }
  const pull = merged[0];
  if (commit.checks?.["pr-meta"] !== "success") {
    problems.push({
      commit: sha,
      problem: "pr-meta was not green on the pull request head",
    });
  }
  const fast = commit.checks?.fast;
  if (fast === "success") {
    // A green fast job is enough. The file list is not consulted.
  } else if (fast === "skipped") {
    const docsOnly = classify(commit.files ?? [], commit.listText ?? "");
    if (!docsOnly) {
      problems.push({
        commit: sha,
        problem:
          "fast was skipped but the re-fetched pull request files are not docs-only",
      });
    }
  } else {
    problems.push({
      commit: sha,
      problem: "fast was not green on the pull request head",
    });
  }
  const roles = requiredRoles({
    files: commit.files ?? [],
    title: pull.title ?? "",
    body: pull.body ?? "",
    codeowners: commit.codeowners ?? "",
    plan: commit.plan ?? "",
  });
  const reviews = latestReviews(commit.comments ?? []);
  for (const role of roles) {
    if (reviews.get(role) !== "APPROVED") {
      problems.push({
        commit: sha,
        problem: `missing REVIEW ${role}: APPROVED`,
      });
    }
  }
  return problems;
}

export function requiredRoles({ files, title, body, codeowners, plan }) {
  const roles = new Set();
  for (const file of files) {
    const match = codeownerFor(codeowners, file);
    if (!match) continue;
    for (const role of match.split(",")) {
      const name = role.trim();
      if (ROLES.includes(name)) roles.add(name);
    }
  }
  const task = taskId(title);
  if (task && (task.startsWith("M0-") || task === "M8-T03")) {
    roles.add("Project Lead");
  }
  if (bodyDeliversAc(body) || planHasAc(plan, task)) roles.add("QA");
  return [...roles];
}

export function latestReviews(comments) {
  const found = new Map();
  for (const comment of comments) {
    const match = REVIEW.exec(comment.body ?? "");
    if (match) found.set(match[1], match[2]);
  }
  return found;
}

export function guardBody(problems) {
  const lines = [
    "main-guard found a problem on main.",
    ...problems.map((item) => `- ${item.commit}: ${item.problem}`),
    "Fix: revert through a pull request, or confirm and close this issue.",
  ];
  return lines.join("\n");
}

export function redBody({ jobs, runUrl, number }) {
  const failed = jobs.length > 0 ? jobs.join(", ") : "unknown";
  return [
    "ci.yml failed on main.",
    `Failed jobs: ${failed}`,
    `Run: ${runUrl}`,
    `Fix: open a fix-main pull request whose body says Fixes #${number}.`,
  ].join("\n");
}

export function planGuardIssue({ openIssues, label, title, body }) {
  const labelled = (openIssues ?? []).filter(
    (issue) => !issue.pull_request && (issue.labels ?? []).includes(label),
  );
  const open = labelled.find((issue) => issue.state === "open");
  if (open) return { action: "comment", number: open.number, body };
  if (label === "main-red") {
    const closed = labelled.find((issue) => issue.state === "closed");
    if (closed) return { action: "reopen", number: closed.number, body };
  }
  return { action: "open", title, body, labels: [label] };
}

export function taskId(title) {
  return TASK_ID.exec(title ?? "")?.[1] ?? "";
}

function bodyDeliversAc(body) {
  const delivered = /Delivered:\s*([^\n]*)/.exec(body ?? "");
  return Boolean(delivered && /AC-[A-Z]+-\d+/.test(delivered[1]));
}

function planHasAc(plan, task) {
  if (!plan || !task) return false;
  const owners = taskOwners(plan);
  const base = task.replace(/[a-z]$/, "");
  const ids = base === task ? [task] : [task, base];
  for (const id of ids) {
    for (const owner of owners.values()) {
      if (owner.primary === id || owner.also.includes(id)) return true;
    }
  }
  return false;
}

function codeownerFor(text, file) {
  let found = null;
  for (const raw of text.split("\n")) {
    if (raw.length === 0 || raw.startsWith("#")) continue;
    const tab = raw.indexOf("\t");
    if (tab === -1) continue;
    const pattern = raw.slice(0, tab).trim();
    const role = raw.slice(tab + 1).trim();
    if (codeownerMatch(pattern, file)) found = role;
  }
  return found;
}

function codeownerMatch(pattern, file) {
  if (pattern.endsWith("/")) return file.startsWith(pattern);
  if (pattern.includes("*")) return globMatch(pattern, file);
  return file === pattern;
}
