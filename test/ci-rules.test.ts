import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
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
import { gitleaksArgs, titleOk } from "../scripts/ci/pr-meta.mjs";
import {
  RELEASE_TAG,
  RELEASE_TAG_PATTERN,
} from "../scripts/ci/release-tag.mjs";

const root = join(import.meta.dirname, "..");
const workflowDir = join(root, ".github/workflows");
const listText = readList(root);

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
    }
    const searched = spawnSync(
      "rg",
      ["-n", "paths:|paths-ignore", ".github/workflows"],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(searched.status, 1);
    assert.equal(searched.stdout, "");
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
