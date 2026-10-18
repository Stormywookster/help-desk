import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, it } from "vitest";
import { versionsToDelete } from "../scripts/ci/cleanup-images.mjs";
import { LIST_PATH, classify, readList } from "../scripts/ci/docs-only.mjs";
import { fastRuns, fullRuns, scheduledRuns } from "../scripts/ci/gates.mjs";
import {
  commitFollowsGuard,
  handlePush,
  handleStatus,
} from "../scripts/ci/main-guard.mjs";
import { gitleaksArgs, titleOk } from "../scripts/ci/pr-meta.mjs";
import {
  evaluateCommit,
  evaluatePush,
  planGuardIssue,
  requiredRoles,
} from "../scripts/ci/provenance.mjs";
import {
  RELEASE_TAG,
  RELEASE_TAG_PATTERN,
} from "../scripts/ci/release-tag.mjs";

const root = join(import.meta.dirname, "..");
const workflowDir = join(root, ".github/workflows");
const listText = readList(root);
const codeowners = readFileSync(join(root, "CODEOWNERS"), "utf8");
const plan = readFileSync(join(root, "docs/IMPLEMENTATION_PLAN.md"), "utf8");

function workflowFiles() {
  return readdirSync(workflowDir).filter((name) => name.endsWith(".yml"));
}

function workflowText(name: string) {
  return readFileSync(join(workflowDir, name), "utf8");
}

function workflow(name: string) {
  return parse(workflowText(name)) as {
    on: Record<string, unknown>;
    permissions: Record<string, string>;
    jobs: Record<string, Record<string, unknown>>;
  };
}

function needs(job: Record<string, unknown>, name: string) {
  const value = job.needs;
  const list = Array.isArray(value) ? value : [value];
  return list.includes(name);
}

function walk(value: unknown, visit: (key: string) => void) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      visit(key);
      walk(child, visit);
    }
  }
}

function runGit(args: string[], cwd: string) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
}

describe("docs-only classifier", () => {
  it("[AC-OPS-56] docs/x.md and README.md are docs-only", () => {
    assert.equal(classify(["docs/x.md", "README.md"], listText), true);
  });

  it("[AC-OPS-56] an empty change is not docs-only", () => {
    assert.equal(classify([], listText), false);
  });

  it("[AC-OPS-56] acceptance criteria are not docs-only", () => {
    assert.equal(classify(["docs/ACCEPTANCE_CRITERIA.md"], listText), false);
  });

  it("[AC-OPS-56] a runbook is not docs-only", () => {
    assert.equal(classify(["docs/runbooks/install.md"], listText), false);
  });

  it("[AC-OPS-56] the list file is not docs-only", () => {
    assert.equal(classify([LIST_PATH], listText), false);
    assert.equal(classify([LIST_PATH], `+ ${LIST_PATH}\n`), false);
  });

  it("[AC-OPS-56] a mix with apps is not docs-only", () => {
    assert.equal(
      classify(["docs/x.md", "apps/api/src/index.ts"], listText),
      false,
    );
  });

  it("treats the other included docs files as docs-only", () => {
    assert.equal(classify(["AGENTS.md"], listText), true);
    assert.equal(classify(["CHANGELOG.md"], listText), true);
    assert.equal(classify(["LICENSE"], listText), true);
    assert.equal(classify(["scripts/ci/docs-only.mjs"], listText), false);
    assert.equal(classify(["deploy/env.example"], listText), false);
    assert.equal(classify(["openapi/openapi.json"], listText), false);
    assert.equal(classify(["packages/shared/src/index.ts"], listText), false);
    assert.equal(classify([".github/workflows/ci.yml"], listText), false);
  });

  it("reads the list file only from the classifier", () => {
    const hits: string[] = [];
    const needle = LIST_PATH;
    const walkDir = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walkDir(full);
        else if (readFileSync(full, "utf8").includes(needle))
          hits.push(full.slice(root.length + 1));
      }
    };
    for (const dir of ["scripts", ".github", "test"]) walkDir(join(root, dir));
    assert.deepEqual(hits, ["scripts/ci/docs-only.mjs"]);
  });
});

describe("pull request title", () => {
  it("[AC-OPS-55] accepts a Conventional Commit title", () => {
    assert.equal(titleOk("fix: correct typo in lookup page"), true);
    assert.equal(titleOk("feat(portal): add cancel dialog"), true);
    assert.equal(
      titleOk(
        "ci(github): ci.yml pr-meta/fast/full, docs-only classifier, Dependabot [M0-T04a]",
      ),
      true,
    );
  });

  it("[AC-OPS-55] rejects a title that is not a Conventional Commit", () => {
    assert.equal(titleOk("Update stuff"), false);
    assert.equal(titleOk("fixed the bug"), false);
    assert.equal(titleOk("feat:"), false);
  });
});

describe("job gates", () => {
  it("[AC-OPS-57] a docs-only pull request skips fast and full", () => {
    const input = {
      prMeta: "success",
      docsOnly: true,
      event: "pull_request",
      isPrivate: true,
      fullCi: false,
    };
    assert.equal(fastRuns(input), false);
    assert.equal(fullRuns(input), false);
  });

  it("[AC-OPS-57] a non-docs pull request runs fast", () => {
    assert.equal(fastRuns({ prMeta: "success", docsOnly: false }), true);
    assert.equal(
      fullRuns({
        prMeta: "success",
        docsOnly: false,
        event: "pull_request",
        isPrivate: true,
        fullCi: false,
      }),
      false,
    );
  });

  it("[AC-OPS-57] workflow_dispatch runs full on a docs-only commit", () => {
    assert.equal(
      fullRuns({
        prMeta: "success",
        docsOnly: true,
        event: "workflow_dispatch",
        isPrivate: true,
        fullCi: false,
      }),
      true,
    );
    assert.equal(fastRuns({ prMeta: "success", docsOnly: true }), false);
  });

  it("runs full on main and on a private pull request labelled full-ci", () => {
    assert.equal(
      fullRuns({
        prMeta: "success",
        docsOnly: false,
        event: "push",
        isPrivate: true,
        fullCi: false,
      }),
      true,
    );
    assert.equal(
      fullRuns({
        prMeta: "success",
        docsOnly: false,
        event: "pull_request",
        isPrivate: true,
        fullCi: true,
      }),
      true,
    );
    assert.equal(
      fullRuns({
        prMeta: "success",
        docsOnly: false,
        event: "pull_request",
        isPrivate: false,
        fullCi: false,
      }),
      true,
    );
  });

  it("runs the weekly schedule on Sunday when private and nightly when public", () => {
    assert.equal(
      scheduledRuns({ isPrivate: true, schedule: "0 6 * * 0" }),
      true,
    );
    assert.equal(
      scheduledRuns({ isPrivate: true, schedule: "0 6 * * 1-6" }),
      false,
    );
    assert.equal(
      scheduledRuns({ isPrivate: false, schedule: "0 6 * * 1-6" }),
      true,
    );
  });
});

describe("image cleanup", () => {
  it("keeps the newest 30 sha tags and leaves other tags alone", () => {
    const versions = [];
    for (let index = 0; index < 32; index += 1) {
      versions.push({
        id: index,
        created_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
        metadata: { container: { tags: [`sha-${index}`] } },
      });
    }
    versions.push({
      id: 100,
      created_at: "2020-01-01T00:00:00Z",
      metadata: { container: { tags: ["edge"] } },
    });
    const stale = versionsToDelete(versions);
    assert.deepEqual(
      stale.map((version: { id: number }) => version.id),
      [1, 0],
    );
  });
});

function commit(over: Record<string, unknown>) {
  return {
    sha: "abc123",
    pulls: [
      {
        merged: true,
        merge_commit_sha: "abc123",
        title: "ci(github): workflows [M0-T04]",
      },
    ],
    checks: { "pr-meta": "success", fast: "success" },
    files: [".github/workflows/ci.yml"],
    comments: [
      { body: "REVIEW Architect: APPROVED" },
      { body: "REVIEW Project Lead: APPROVED" },
      { body: "REVIEW QA: APPROVED" },
    ],
    listText,
    codeowners,
    plan,
    ...over,
  };
}

function headSha(dir: string) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: dir,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

describe("provenance", () => {
  it("[AC-OPS-58] passes when pr-meta and fast are green and the review is present", () => {
    assert.deepEqual(evaluateCommit(commit({})), []);
  });

  it("[AC-OPS-58] fails when pr-meta is red", () => {
    const problems = evaluateCommit(
      commit({ checks: { "pr-meta": "failure", fast: "success" } }),
    );
    assert.ok(problems.some((item) => item.problem.includes("pr-meta")));
  });

  it("[AC-OPS-58] fails when fast is red", () => {
    const problems = evaluateCommit(
      commit({ checks: { "pr-meta": "success", fast: "failure" } }),
    );
    assert.ok(
      problems.some((item) => item.problem.includes("fast was not green")),
    );
  });

  it("[AC-OPS-58] passes a docs-only pull request whose fast job was skipped", () => {
    const problems = evaluateCommit(
      commit({
        pulls: [
          {
            merged: true,
            merge_commit_sha: "abc123",
            title: "docs: correct a typo",
          },
        ],
        checks: { "pr-meta": "success", fast: "skipped" },
        files: ["docs/x.md", "README.md"],
        comments: [],
      }),
    );
    assert.deepEqual(problems, []);
  });

  it("[AC-OPS-58] fails when fast was skipped and the files are not docs-only", () => {
    const problems = evaluateCommit(
      commit({
        checks: { "pr-meta": "success", fast: "skipped" },
        files: ["apps/api/src/index.ts"],
      }),
    );
    assert.ok(problems.some((item) => item.problem.includes("not docs-only")));
  });

  it("[AC-OPS-58] fails when a required REVIEW comment is missing", () => {
    const problems = evaluateCommit(commit({ comments: [] }));
    assert.ok(
      problems.some((item) =>
        item.problem.includes("REVIEW Architect: APPROVED"),
      ),
    );
  });

  it("[AC-OPS-59] a direct push and a force push fail provenance", () => {
    const direct = evaluatePush({
      commits: [commit({ pulls: [], files: [], comments: [] })],
    });
    assert.equal(direct.ok, false);
    assert.match(direct.problems[0]?.problem ?? "", /no merged pull request/);
    const forced = evaluatePush({
      forced: true,
      after: "def456",
      commits: [],
    });
    assert.equal(forced.ok, false);
    assert.match(forced.problems[0]?.problem ?? "", /force push/);
  });

  it("requires Project Lead and QA for an M0 task that delivers criteria", () => {
    const roles = requiredRoles({
      files: ["AGENTS.md"],
      title: "ci(github): workflows [M0-T04]",
      codeowners,
      plan,
    });
    assert.ok(roles.includes("Project Lead"));
    assert.ok(roles.includes("QA"));
  });

  it("checks a commit only after the workflow is already on a parent", () => {
    const dir = mkdtempSync(join(tmpdir(), "guard-"));
    try {
      runGit(["init"], dir);
      runGit(["config", "user.email", "test@example.com"], dir);
      runGit(["config", "user.name", "test"], dir);
      writeFileSync(join(dir, "README.md"), "before\n");
      runGit(["add", "README.md"], dir);
      runGit(["commit", "-m", "before"], dir);
      const before = headSha(dir);
      mkdirSync(join(dir, ".github/workflows"), { recursive: true });
      writeFileSync(join(dir, ".github/workflows/main-guard.yml"), "name: x\n");
      runGit(["add", ".github/workflows/main-guard.yml"], dir);
      runGit(["commit", "-m", "land"], dir);
      const land = headSha(dir);
      writeFileSync(join(dir, "README.md"), "after\n");
      runGit(["add", "README.md"], dir);
      runGit(["commit", "-m", "after"], dir);
      const after = headSha(dir);
      assert.equal(commitFollowsGuard(before, dir), false);
      assert.equal(commitFollowsGuard(land, dir), false);
      assert.equal(commitFollowsGuard(after, dir), true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("guard issues", () => {
  it("[AC-OPS-59] a simulated direct push opens one main-guard issue", async () => {
    const created: { title?: string; body?: string; labels?: string[] }[] = [];
    const github = {
      async compare() {
        return { status: "ahead", commits: [{ sha: "abc123" }] };
      },
      async listIssues() {
        return [];
      },
      async apply(planIssue: {
        action: string;
        title?: string;
        body?: string;
        labels?: string[];
      }) {
        assert.equal(planIssue.action, "open");
        created.push(planIssue);
      },
    };
    const result = await handlePush(
      { forced: false, deleted: false, before: "aaa", after: "abc123" },
      {
        github,
        followsGuard: () => true,
        loadCommit: async () => commit({ pulls: [], files: [], comments: [] }),
      },
    );
    assert.equal(result.ok, false);
    assert.equal(created.length, 1);
    assert.deepEqual(created[0]?.labels, ["main-guard"]);
    assert.match(created[0]?.body ?? "", /abc123/);
    assert.match(created[0]?.body ?? "", /no merged pull request/);
    assert.match(created[0]?.body ?? "", /revert through a pull request/);
  });

  it("[AC-OPS-59] a commit from before the workflow does not open an issue", async () => {
    let loaded = false;
    let applied = false;
    const result = await handlePush(
      { forced: false, deleted: false, before: "aaa", after: "old" },
      {
        github: {
          async compare() {
            return { status: "ahead", commits: [{ sha: "abc123" }] };
          },
          async listIssues() {
            return [];
          },
          async apply() {
            applied = true;
          },
        },
        followsGuard: () => false,
        loadCommit: async () => {
          loaded = true;
          return commit({ pulls: [], files: [], comments: [] });
        },
      },
    );
    assert.equal(result.ok, true);
    assert.equal(loaded, false);
    assert.equal(applied, false);
  });

  it("[AC-OPS-59] a second violation comments on the open main-guard issue", () => {
    const planIssue = planGuardIssue({
      openIssues: [
        {
          number: 7,
          state: "open",
          labels: ["main-guard"],
          pull_request: undefined,
        },
      ],
      label: "main-guard",
      title: "main-guard: push to main failed provenance",
      body: "again",
    });
    assert.equal(planIssue.action, "comment");
    assert.equal(planIssue.number, 7);
  });

  it("[AC-OPS-60] a simulated red run opens one main-red issue", async () => {
    const created: { labels?: string[]; body?: string }[] = [];
    const result = await handleStatus(
      {
        workflow_run: {
          conclusion: "failure",
          id: 9,
          html_url: "https://example.test/run/9",
        },
      },
      {
        github: {
          async jobs() {
            return [{ name: "fast", conclusion: "failure" }];
          },
          async listIssues() {
            return [];
          },
          async apply(planIssue: { labels?: string[]; body?: string }) {
            created.push(planIssue);
          },
        },
      },
    );
    assert.equal(result.action, "open");
    assert.deepEqual(created[0]?.labels, ["main-red"]);
    assert.match(created[0]?.body ?? "", /fast/);
    assert.match(created[0]?.body ?? "", /https:\/\/example\.test\/run\/9/);
    assert.match(created[0]?.body ?? "", /Fixes #N/);
  });

  it("[AC-OPS-60] a successful run does not open an issue", async () => {
    let called = false;
    const result = await handleStatus(
      { workflow_run: { conclusion: "success", id: 1, html_url: "" } },
      {
        github: {
          async jobs() {
            called = true;
            return [];
          },
          async listIssues() {
            return [];
          },
          async apply() {
            called = true;
          },
        },
      },
    );
    assert.deepEqual(result, { action: "none" });
    assert.equal(called, false);
  });

  it("reopens a closed main-red issue on the next failure", () => {
    const planIssue = planGuardIssue({
      openIssues: [
        {
          number: 4,
          state: "closed",
          labels: ["main-red"],
          pull_request: undefined,
        },
      ],
      label: "main-red",
      title: "main-red: ci.yml failed on main",
      body: "again",
    });
    assert.equal(planIssue.action, "reopen");
    assert.equal(planIssue.number, 4);
  });
});

describe("workflows", () => {
  const expected: Record<
    string,
    {
      workflow: Record<string, string>;
      jobs: Record<string, Record<string, string> | null>;
    }
  > = {
    "ci.yml": {
      workflow: { contents: "read" },
      jobs: {
        "pr-meta": null,
        fast: { contents: "read" },
        full: { contents: "read" },
      },
    },
    "scheduled.yml": {
      workflow: { contents: "read" },
      jobs: { weekly: { contents: "read" } },
    },
    "cleanup-images.yml": {
      workflow: { contents: "read", packages: "write" },
      jobs: { cleanup: null },
    },
    "main-guard.yml": {
      workflow: {
        contents: "read",
        "pull-requests": "read",
        checks: "read",
        actions: "read",
        issues: "write",
      },
      jobs: { provenance: null, status: null },
    },
  };

  it("[AC-OPS-54] pr-meta has no if, and fast and full need it", () => {
    const ci = workflow("ci.yml");
    assert.equal(ci.jobs["pr-meta"]?.if, undefined);
    assert.equal(needs(ci.jobs.fast ?? {}, "pr-meta"), true);
    assert.equal(needs(ci.jobs.full ?? {}, "pr-meta"), true);
    assert.match(String(ci.jobs.fast?.if), /docs_only/);
    assert.match(String(ci.jobs.full?.if), /docs_only/);
    assert.match(String(ci.jobs.full?.if), /workflow_dispatch/);
    assert.ok(ci.on.pull_request);
    const push = ci.on.push as { branches: string[] };
    assert.deepEqual(push.branches, ["main"]);
  });

  it("[AC-OPS-35] no workflow job uses a Windows runner", () => {
    for (const name of workflowFiles()) {
      assert.doesNotMatch(workflowText(name), /windows-latest/);
      const doc = workflow(name);
      for (const [jobName, job] of Object.entries(doc.jobs)) {
        assert.equal(
          String(job["runs-on"]).includes("windows"),
          false,
          `${name} ${jobName}`,
        );
      }
    }
    const releasePath = join(workflowDir, "release.yml");
    const exists = workflowFiles().includes("release.yml");
    if (exists) {
      const release = workflow("release.yml");
      const push = release.on.push as { tags?: string[]; branches?: string[] };
      assert.deepEqual(push.tags, [RELEASE_TAG_PATTERN]);
      assert.equal(push.branches, undefined);
      assert.equal(release.on.pull_request, undefined);
      assert.equal(release.on.schedule, undefined);
    } else {
      assert.equal(releasePath.endsWith("release.yml"), true);
    }
  });

  it("[AC-OPS-60] status starts only after ci.yml fails on main", () => {
    const guard = workflow("main-guard.yml");
    const run = guard.on.workflow_run as {
      workflows: string[];
      branches: string[];
    };
    assert.deepEqual(run.workflows, ["ci"]);
    assert.deepEqual(run.branches, ["main"]);
    assert.match(String(guard.jobs.status?.if), /failure/);
    assert.doesNotMatch(String(guard.jobs.status?.if), /success/);
    assert.match(String(guard.jobs.provenance?.if), /push/);
  });

  it("[AC-OPS-61] main-guard permissions are the five listed scopes", () => {
    const guard = workflow("main-guard.yml");
    assert.deepEqual(guard.permissions, expected["main-guard.yml"]?.workflow);
    assert.equal(guard.jobs.provenance?.permissions, undefined);
    assert.equal(guard.jobs.status?.permissions, undefined);
    const texts = [
      workflowText("main-guard.yml"),
      readFileSync(join(root, "scripts/ci/main-guard.mjs"), "utf8"),
      readFileSync(join(root, "scripts/ci/provenance.mjs"), "utf8"),
    ];
    for (const text of texts) {
      assert.doesNotMatch(text, /git push|git revert|git tag/);
      assert.doesNotMatch(text, /contents:\s*write/);
    }
  });

  it("matches the workflow permissions and has no trigger filters", () => {
    for (const name of workflowFiles()) {
      const doc = workflow(name);
      const spec = expected[name];
      assert.ok(spec, name);
      assert.deepEqual(doc.permissions, spec.workflow);
      for (const [jobName, jobPermissions] of Object.entries(spec.jobs)) {
        assert.deepEqual(
          doc.jobs[jobName]?.permissions ?? null,
          jobPermissions,
        );
      }
      const keys: string[] = [];
      walk(doc, (key) => keys.push(key));
      assert.equal(keys.includes("paths"), false, name);
      assert.equal(keys.includes("paths-ignore"), false, name);
      assert.equal(keys.includes("pull_request_target"), false, name);
      assert.doesNotMatch(workflowText(name), /secrets\./);
      assert.doesNotMatch(workflowText(name), /paths:|paths-ignore/);
    }
  });

  it("leaves the Semgrep step for M0-T04c", () => {
    const text = workflowText("ci.yml");
    assert.match(text, /TODO\(M0-T04c\)/);
    assert.doesNotMatch(text, /semgrep scan/);
  });

  it("keeps gitleaks in pr-meta and fails the command when there is a finding", () => {
    assert.match(workflowText("ci.yml"), /scripts\/ci\/pr-meta\.mjs/);
    assert.match(workflowText("scheduled.yml"), /gitleaks detect/);
    const fast = workflow("ci.yml").jobs.fast;
    assert.equal(JSON.stringify(fast).includes("gitleaks detect"), false);
    const args = gitleaksArgs({
      name: "pull_request",
      pull_request: { base: { sha: "base" }, head: { sha: "head" } },
    });
    const exit = args.indexOf("--exit-code");
    assert.equal(args[exit + 1], "1");
    assert.equal(args.at(-1), "base..head");
  });

  it("uses a three-day artifact retention and cancels superseded runs", () => {
    for (const name of workflowFiles()) {
      const text = workflowText(name);
      assert.match(text, /cancel-in-progress:\s*true/);
      if (text.includes("retention-days")) {
        assert.match(text, /retention-days:\s*3\b/);
        assert.doesNotMatch(text, /retention-days:\s*(?!3\b)\d+/);
      }
    }
  });
});

describe("release tag", () => {
  it("accepts a plain SemVer tag and rejects a suffix", () => {
    assert.equal(RELEASE_TAG.test("v1.2.3"), true);
    for (const tag of ["v1.2.3-rc.1", "v1.2", "1.2.3", "v1.2.3+b"]) {
      assert.equal(RELEASE_TAG.test(tag), false, tag);
    }
    assert.equal(RELEASE_TAG_PATTERN, "v[0-9]+.[0-9]+.[0-9]+");
  });
});

describe("gitleaks", () => {
  it("[AC-OPS-34] the full history scan is clean and a fake secret is blocked", () => {
    const history = spawnSync(
      "gitleaks",
      [
        "detect",
        "--source",
        root,
        "--config",
        join(root, ".gitleaks.toml"),
        "--redact",
        "--no-banner",
      ],
      { encoding: "utf8" },
    );
    assert.equal(history.status, 0, history.stdout + history.stderr);
    const tracked = spawnSync("git", ["ls-files"], {
      cwd: root,
      encoding: "utf8",
    });
    const files = tracked.stdout.split("\n");
    assert.equal(
      files.some((file) => file === ".env" || file.endsWith("/.env")),
      false,
    );
    assert.equal(files.includes("deploy/env.example"), true);
    const hook = readFileSync(join(root, ".githooks/pre-commit"), "utf8");
    assert.match(hook, /gitleaks protect --staged/);

    const dir = mkdtempSync(join(tmpdir(), "gitleaks-"));
    try {
      runGit(["init"], dir);
      const token = [
        "xoxb-",
        "123456789012",
        "-",
        "123456789012",
        "-",
        "abcdefghijklmnopqrstuvwx",
      ].join("");
      writeFileSync(join(dir, "leak.txt"), `slack=${token}\n`);
      const scan = spawnSync(
        "gitleaks",
        ["detect", "--no-git", "--source", dir, "--no-banner", "--redact"],
        { encoding: "utf8" },
      );
      assert.notEqual(scan.status, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
