import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";

const root = join(import.meta.dirname, "..");

const workspaces = [
  ["apps/api", "@helpdesk/api"],
  ["apps/portal", "@helpdesk/portal"],
  ["apps/console", "@helpdesk/console"],
  ["apps/desktop", "@helpdesk/desktop"],
  ["packages/shared", "@helpdesk/shared"],
  ["packages/api-client", "@helpdesk/api-client"],
  ["packages/ui", "@helpdesk/ui"],
] as const;

describe("monorepo scaffold", () => {
  it("[AC-OPS-09] repository holds the application source workspaces", () => {
    const rootPkg = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8"),
    ) as {
      workspaces: string[];
    };
    assert.deepEqual(rootPkg.workspaces, ["apps/*", "packages/*"]);
    for (const [dir, name] of workspaces) {
      const pkg = JSON.parse(
        readFileSync(join(root, dir, "package.json"), "utf8"),
      ) as {
        name: string;
        private: boolean;
      };
      assert.equal(pkg.name, name);
      assert.equal(pkg.private, true);
      assert.equal(statSync(join(root, dir, "src", "index.ts")).isFile(), true);
    }
  });

  it("pins Node.js 24", () => {
    assert.equal(readFileSync(join(root, ".nvmrc"), "utf8").trim(), "24");
    const rootPkg = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8"),
    ) as {
      engines: { node: string };
    };
    assert.equal(rootPkg.engines.node, ">=24 <25");
  });

  it("typechecks with TypeScript strict", () => {
    const base = JSON.parse(
      readFileSync(join(root, "tsconfig.base.json"), "utf8"),
    ) as {
      compilerOptions: { strict: boolean };
    };
    assert.equal(base.compilerOptions.strict, true);
  });

  it("keeps Phase 2 docs under docs/", () => {
    assert.equal(countMd(join(root, "docs")), 34);
    assert.equal(
      statSync(join(root, "docs/IMPLEMENTATION_PLAN.md")).isFile(),
      true,
    );
    assert.equal(
      statSync(join(root, "docs/HUMAN_STEPS_LOG.md")).isFile(),
      true,
    );
    assert.equal(
      readdirSync(join(root, "docs/adr")).filter((name) => name.endsWith(".md"))
        .length,
      19,
    );
  });

  it("ships deploy/env.example placeholders and no .env file", () => {
    const example = readFileSync(join(root, "deploy/env.example"), "utf8");
    for (const key of [
      "POSTGRES_PASSWORD",
      "DATABASE_URL",
      "HD_TOKEN_PEPPER",
      "HD_DATA_ENCRYPTION_KEY",
      "ALTCHA_HMAC_KEY",
      "SMTP_PASSWORD",
      "RESTIC_PASSWORD",
    ]) {
      assert.match(example, new RegExp(`^${key}=.*change-me`, "m"), key);
    }
    assert.doesNotMatch(
      example,
      /ghp_|AKIA|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY/,
    );
    assert.deepEqual(dotenvFiles(root), []);
  });
});

function countMd(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) count += countMd(full);
    else if (entry.name.endsWith(".md")) count += 1;
  }
  return count;
}

function dotenvFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) dotenvFiles(full, acc);
    else if (/(^|\/)\.env($|\.)/.test(full.slice(root.length + 1)))
      acc.push(full);
  }
  return acc;
}
