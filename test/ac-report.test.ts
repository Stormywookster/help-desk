import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";
import {
  coverageReport,
  definedAcs,
  taggedTests,
  taskOwners,
} from "../scripts/ac-report.mjs";

const root = join(import.meta.dirname, "..");

describe("AC report", () => {
  it("reads both acceptance-criteria id formats", () => {
    const ids = definedAcs(
      [
        "- **AC-GEN-11** given",
        "| AC-AUD-01 | Ticket creation |",
        "| Not an id |",
      ].join("\n"),
    );
    assert.deepEqual(ids, ["AC-AUD-01", "AC-GEN-11"]);
  });

  it("compares the 513 criteria with tagged tests", () => {
    const defined = definedAcs(
      readFileSync(join(root, "docs/ACCEPTANCE_CRITERIA.md"), "utf8"),
    );
    const owners = taskOwners(
      readFileSync(join(root, "docs/IMPLEMENTATION_PLAN.md"), "utf8"),
    );
    const tests = taggedTests(root);
    assert.equal(defined.length, 513);
    assert.equal(defined.filter((id) => !owners.get(id)?.primary).length, 0);
    assert.equal(owners.get("AC-GEN-11")?.primary, "M0-T03");
    const report = coverageReport({ defined, owners, tests, task: "M0-T03" });
    assert.match(report, /AC-GEN-11\s+yes/);
    assert.match(report, /Uncovered in M0-T03: none/);
    const summary = coverageReport({ defined, owners, tests });
    assert.match(summary, /defined\s+513/);
    assert.doesNotMatch(summary, /\(unmapped\)/);
    assert.match(summary, /AC-GEN-11/);
  });
});
