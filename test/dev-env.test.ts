import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";

const root = join(import.meta.dirname, "..");

describe("dev environment", () => {
  it("sets up PostgreSQL 17, Mailpit, and a dev compose file", () => {
    const setup = readFileSync(join(root, "scripts/dev-setup.sh"), "utf8");
    assert.match(setup, /PG_VERSION=17/);
    assert.match(setup, /mailpit/i);
    assert.match(setup, /helpdesk_test/);
    const compose = readFileSync(join(root, "deploy/compose.dev.yaml"), "utf8");
    assert.match(compose, /postgres:17/);
    assert.match(compose, /axllent\/mailpit/);
    assert.match(compose, /clamav\/clamav:stable/);
    const environment = readFileSync(
      join(root, ".cursor/environment.json"),
      "utf8",
    );
    assert.match(environment, /scripts\/dev-setup\.sh/);
  });

  it("labels empty verify steps as no-ops", () => {
    const verify = readFileSync(join(root, "scripts/verify.sh"), "utf8");
    assert.match(verify, /integration: no-op \(no integration tests yet\)/);
    assert.match(
      verify,
      /openapi drift: no-op \(openapi\/openapi\.json is not generated yet\)/,
    );
    assert.match(verify, /check-branding\.mjs/);
  });
});
