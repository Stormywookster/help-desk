import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "vitest";

const root = join(import.meta.dirname, "..");

const labelNames = [
  "full-ci",
  "security-review",
  "needs-qa",
  "needs-design",
  "needs-support-ops",
  "blocked",
  "human-step",
  "beta-bug",
  "main-guard",
  "main-red",
  "fix-main",
] as const;

const evidenceHeadings = [
  "### 1. Task ID and the ACs delivered",
  "### 2. npm run verify",
  "### 3. pr-meta and fast",
  "### 4. UI screenshots",
  "390 px",
  "### 5. Email samples",
  "rendered samples (text + HTML)",
  "### 6. openapi.json diff",
  "### 7. Security-sensitive changes",
  "ARCHITECTURE §15",
  "### 8. Not verified",
];

describe("repo rules", () => {
  it("records the ADR 0019 bot rules and the plan §5 branch and PR rules", () => {
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
    for (const phrase of [
      "Every change goes through a pull request, including docs-only changes.",
      "Squash merge only",
      "REVIEW <role>: APPROVED",
      "Conventional Commit",
      "Never push or force-push to `main`.",
      "main-red",
      "main-guard",
      "fix-main",
      "Fixes #N",
      "ADR 0018",
      "cursor/<task-id>-<short-slug>",
      "One task = one branch = one PR.",
      "^(feat|fix|test|docs|ci|chore|refactor)",
      "Author: Engineer",
      "full-ci",
      "[AC-XXX-nn]",
    ]) {
      assert.ok(agents.includes(phrase), phrase);
    }
  });

  it("gives the pull request template every §6.3 evidence heading", () => {
    const template = readFileSync(
      join(root, ".github/pull_request_template.md"),
      "utf8",
    );
    for (const heading of evidenceHeadings) {
      assert.ok(template.includes(heading), heading);
    }
    assert.match(template, /^## Author\n\nAuthor:/m);
    assert.match(template, /Also exercised:/);
    assert.match(template, /Docs\/OpenAPI updated/);
    assert.match(template, /Security\/privacy-sensitive/);
    assert.match(template, /## Reviewers/);
    assert.match(template, /## Follow-ups/);
  });

  it("maps paths to reviewing roles in advisory CODEOWNERS", () => {
    const text = readFileSync(join(root, "CODEOWNERS"), "utf8");
    assert.match(text, /[Aa]dvisory/);
    assert.doesNotMatch(text, /@/);
    const roles = new Map<string, string>();
    for (const line of text.split("\n")) {
      if (line.length === 0 || line.startsWith("#")) continue;
      const [path, role] = line.split("\t");
      assert.ok(path);
      assert.ok(role, line);
      roles.set(path, role);
    }
    assert.equal(roles.get("deploy/"), "Architect");
    assert.equal(roles.get(".github/"), "Architect");
    assert.equal(roles.get(".githooks/"), "Architect");
    assert.equal(roles.get(".gitleaks.toml"), "Architect");
    assert.equal(roles.get("apps/portal/"), "Designer");
    assert.equal(roles.get("apps/console/"), "Designer");
    assert.equal(roles.get("docs/runbooks/"), "Support Ops");
    assert.equal(roles.get("docs/EMAIL_AND_WORDING.md"), "Support Ops");
    assert.equal(roles.get("docs/ACCEPTANCE_CRITERIA.md"), "QA");
    assert.equal(roles.get("AGENTS.md"), "Project Lead");
    assert.equal(roles.get("apps/desktop/"), "Designer, Architect");
  });

  it("installs hooks from the prepare script", () => {
    const pkg = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
    };
    assert.equal(
      pkg.scripts["hooks:install"],
      "git config core.hooksPath .githooks",
    );
    assert.equal(pkg.scripts.prepare, "npm run hooks:install");
    for (const name of ["pre-commit", "pre-push"] as const) {
      const path = join(root, ".githooks", name);
      assert.equal(statSync(path).isFile(), true);
      assert.notEqual(statSync(path).mode & 0o111, 0);
    }
    const preCommit = readFileSync(join(root, ".githooks/pre-commit"), "utf8");
    assert.match(preCommit, /gitleaks protect --staged/);
    const prePush = readFileSync(join(root, ".githooks/pre-push"), "utf8");
    assert.match(prePush, /refs\/heads\/main/);
  });

  it("does not allowlist a broad path in .gitleaks.toml", () => {
    const toml = readFileSync(join(root, ".gitleaks.toml"), "utf8");
    assert.match(toml, /useDefault = true/);
    assert.doesNotMatch(toml, /^\s*paths\s*=/m);
    assert.doesNotMatch(toml, /\[allowlist\]/);
  });

  it("lists the M0-T02 labels", () => {
    const file = JSON.parse(
      readFileSync(join(root, "scripts/labels.json"), "utf8"),
    ) as { labels: { name: string; description: string }[] };
    assert.deepEqual(
      file.labels.map((label) => label.name).sort(),
      [...labelNames].sort(),
    );
    for (const label of file.labels) {
      assert.ok(label.description.length > 0);
      assert.ok(label.description.length <= 100, label.name);
    }
  });

  it("refuses a push to main and allows a push to another branch", () => {
    const hook = join(root, ".githooks/pre-push");
    const toMain = runHook(hook, "refs/heads/main");
    assert.notEqual(toMain.status, 0);
    assert.match(toMain.stderr, /refusing push to main/);

    const force = runHook(hook, "refs/heads/main");
    assert.notEqual(force.status, 0);

    const other = runHook(hook, "refs/heads/cursor/m0-t02-repo-rules");
    assert.equal(other.status, 0, other.stderr);
  });

  it("refuses the commit when gitleaks is not installed", () => {
    const result = spawnSync(join(root, ".githooks/pre-commit"), [], {
      encoding: "utf8",
      env: { ...process.env, PATH: "/usr/bin:/bin" },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /gitleaks is not installed/);
  });

  it("[AC-OPS-34] full history has no secrets and a fake secret commit is refused", (t) => {
    const gitleaks = findGitleaks();
    if (gitleaks === undefined) {
      // A fresh clone may not have the binary yet. The hook still refuses
      // every commit in that case, which the test above covers.
      t.skip("gitleaks is not on PATH");
      return;
    }
    const detect = spawnSync(
      gitleaks,
      [
        "detect",
        "--source",
        root,
        "--config",
        join(root, ".gitleaks.toml"),
        "--redact",
        "--no-banner",
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(detect.status, 0, detect.stderr);

    const dir = mkdtempSync(join(tmpdir(), "hd-secret-"));
    const secret = fakeAccessKey();
    try {
      git(dir, ["init"]);
      git(dir, ["config", "user.email", "hook-test@example.com"]);
      git(dir, ["config", "user.name", "hook-test"]);
      git(dir, ["config", "core.hooksPath", join(root, ".githooks")]);
      copyFileSync(join(root, ".gitleaks.toml"), join(dir, ".gitleaks.toml"));
      writeFileSync(join(dir, "readme.txt"), "no secret here\n");
      git(dir, ["add", "readme.txt", ".gitleaks.toml"]);
      const ok = git(dir, ["commit", "-m", "chore: baseline"]);
      assert.equal(ok.status, 0, ok.stderr);

      writeFileSync(join(dir, "leak.txt"), `aws_access_key_id=${secret}\n`);
      git(dir, ["add", "leak.txt"]);
      const refused = git(dir, ["commit", "-m", "chore: should be refused"]);
      assert.notEqual(refused.status, 0);
      const output = `${refused.stdout}\n${refused.stderr}`;
      assert.match(output, /refusing the commit/);
      assert.equal(output.includes(secret), false);
      const log = git(dir, ["log", "--oneline"]);
      assert.equal(log.stdout.includes("should be refused"), false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

function runHook(
  hook: string,
  remoteRef: string,
): { status: number | null; stderr: string } {
  const local = "a".repeat(40);
  const remote = "b".repeat(40);
  const result = spawnSync(
    hook,
    ["origin", "https://example.invalid/help-desk.git"],
    {
      encoding: "utf8",
      input: `refs/heads/topic ${local} ${remoteRef} ${remote}\n`,
    },
  );
  return { status: result.status, stderr: result.stderr };
}

function git(
  cwd: string,
  args: string[],
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function findGitleaks(): string | undefined {
  const found = spawnSync("sh", ["-c", "command -v gitleaks"], {
    encoding: "utf8",
  });
  const fromPath = found.stdout.trim();
  if (found.status === 0 && fromPath.length > 0) return fromPath;
  return undefined;
}

function fakeAccessKey(): string {
  // AWS access-key shape used by the built-in gitleaks rule: AKIA plus 16 base32 characters.
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = randomBytes(16);
  let body = "";
  for (const byte of bytes) body += alphabet[byte % alphabet.length];
  return `AKIA${body}`;
}
