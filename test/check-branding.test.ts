import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "vitest";
import {
  findHardCodedNames,
  placeholderNames,
  reportHits,
} from "../scripts/check-branding.mjs";

const root = join(import.meta.dirname, "..");
const site = ["Help", "Desk"].join(" ");
const company = ["Your", "Company"].join(" ");

describe("branding check", () => {
  it("[AC-GEN-11] branding check fails on a hard-coded site or company name", () => {
    const names = [site, company];
    const hits = findHardCodedNames(
      fixture(`export const title = ${JSON.stringify(site)};\n`),
      names,
    );
    assert.equal(hits.length, 1);
    assert.match(reportHits(hits), /branding check failed/);

    const companyHits = findHardCodedNames(
      fixture(`export const legal = ${JSON.stringify(company)};\n`),
      names,
    );
    assert.equal(companyHits.length, 1);

    const clean = fixture("export const title = siteName;\n");
    assert.deepEqual(findHardCodedNames(clean, names), []);
    assert.equal(reportHits([]), "branding check passed\n");
  });

  it("reads placeholder names from settings and the repo has none hard-coded", () => {
    const names = placeholderNames(
      `BRAND_SITE_NAME=${site} # placeholder\nBRAND_COMPANY_NAME=${company} # placeholder\n`,
    );
    assert.deepEqual(names, [site, company]);
    assert.deepEqual(
      findHardCodedNames(
        root,
        placeholderNames(
          readFileSync(join(root, "deploy/env.example"), "utf8"),
        ),
      ),
      [],
    );
  });
});

function fixture(source: string) {
  const dir = mkdtempSync(join(tmpdir(), "branding-"));
  mkdirSync(join(dir, "apps/api/src"), { recursive: true });
  writeFileSync(join(dir, "apps/api/src/ui.ts"), source);
  return dir;
}
