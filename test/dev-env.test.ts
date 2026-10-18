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

  it("checks the Mailpit download against a pinned SHA-256 before extracting it", () => {
    const setup = readFileSync(join(root, "scripts/dev-setup.sh"), "utf8");
    const gitleaks = readFileSync(
      join(root, "scripts/ci/install-gitleaks.sh"),
      "utf8",
    );
    assert.match(gitleaks, /sha256sum -c -/);
    assert.match(setup, /sha256sum -c -/);
    assert.match(
      setup,
      /10fa12ccc610f653d4ed4df848c1817f9935dcf4e9a6a458a19ab0fa02093f91/,
    );
    assert.match(
      setup,
      /de07955b783236d9129da76da9a5970f1777834a18b2c07611de957be784dafe/,
    );
    const check = setup.indexOf(
      'echo "$sum  $tmp/mailpit.tar.gz" | sha256sum -c -',
    );
    const extract = setup.indexOf(
      'sudo tar -C /usr/local/bin -xzf "$tmp/mailpit.tar.gz" mailpit',
    );
    assert.ok(check > 0);
    assert.ok(extract > check);
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
