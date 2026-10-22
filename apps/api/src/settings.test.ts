import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  ATTACHMENT_MAX_BYTES_DEFAULT,
  ATTACHMENT_MAX_FILES_DEFAULT,
  REOPEN_WINDOW_DAYS_DEFAULT,
  exampleValue,
  loadExampleEnv,
  resolveSeedSettings,
} from "./settings.js";

const example = loadExampleEnv();

function words(...parts: string[]): string {
  return parts.join(" ");
}

describe("first-start settings", () => {
  it("uses the documented placeholders when the environment is empty", () => {
    const settings = resolveSeedSettings({}, example);
    assert.equal(settings.site_name, words("Help", "Desk"));
    assert.equal(settings.company_name, words("Your", "Company"));
    assert.equal(settings.site_name, exampleValue(example, "BRAND_SITE_NAME"));
    assert.equal(
      settings.company_name,
      exampleValue(example, "BRAND_COMPANY_NAME"),
    );
    assert.equal(settings.brand_primary_color, "#2563EB");
    assert.equal(settings.brand_logo_key, "");
    assert.equal(settings.portal_footer_text, "");
    assert.equal(settings.email_from_name, settings.site_name);
    assert.equal(
      settings.email_from_address,
      exampleValue(example, "EMAIL_FROM_ADDRESS"),
    );
    assert.equal(settings.email_reply_to, settings.email_from_address);
    assert.equal(settings.support_email_display, settings.email_from_address);
    assert.equal(settings.reopen_window_days, REOPEN_WINDOW_DAYS_DEFAULT);
    assert.equal(settings.reopen_window_days, 14);
    assert.equal(settings.attachment_max_bytes, ATTACHMENT_MAX_BYTES_DEFAULT);
    assert.equal(settings.attachment_max_files, ATTACHMENT_MAX_FILES_DEFAULT);
    assert.equal(settings.privacy_notice_enabled, false);
    assert.equal(settings.privacy_notice_text, "");
    assert.equal(settings.privacy_notice_version, "");
  });

  it("lets a first-start environment override the example file", () => {
    const settings = resolveSeedSettings(
      { BRAND_SITE_NAME: "Example Site", BRAND_PRIMARY_COLOR: "#112233" },
      example,
    );
    assert.equal(settings.site_name, "Example Site");
    assert.equal(settings.brand_primary_color, "#112233");
  });

  it("treats a blank override as unset", () => {
    const settings = resolveSeedSettings({ BRAND_SITE_NAME: "" }, example);
    assert.equal(settings.site_name, exampleValue(example, "BRAND_SITE_NAME"));
  });

  it("refuses a color that is not #RRGGBB", () => {
    assert.throws(
      () => resolveSeedSettings({ BRAND_PRIMARY_COLOR: "blue" }, example),
      /BRAND_PRIMARY_COLOR/,
    );
  });

  it("refuses a privacy flag that is not true or false", () => {
    assert.throws(
      () => resolveSeedSettings({ PRIVACY_NOTICE_ENABLED: "yes" }, example),
      /PRIVACY_NOTICE_ENABLED/,
    );
  });
});
