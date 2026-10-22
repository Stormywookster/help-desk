/**
 * First-start settings from ARCHITECTURE §5.
 * Placeholder strings live in settings-defaults.json, which ships with the
 * app. Environment variables still override them on first start.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export const SEEDED_PRODUCT_NAME = "Device Monitor";
export const SEEDED_PRODUCT_SORT_ORDER = 0;

export const REOPEN_WINDOW_DAYS_DEFAULT = 14;
export const ATTACHMENT_MAX_BYTES_DEFAULT = 10_485_760;
export const ATTACHMENT_MAX_FILES_DEFAULT = 5;

export const SETTINGS_DEFAULTS_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "settings-defaults.json",
);

export type BundledDefaults = {
  email_from_name: string;
  email_from_address: string;
  site_name: string;
  company_name: string;
  brand_primary_color: string;
  privacy_notice_enabled: boolean;
};

export function loadBundledDefaults(
  path: string = SETTINGS_DEFAULTS_PATH,
): BundledDefaults {
  return JSON.parse(readFileSync(path, "utf8")) as BundledDefaults;
}

export type SeedSettingValue = string | number | boolean;

function overridden(
  env: Record<string, string | undefined>,
  key: string,
  fallback: string,
): string {
  const value = env[key];
  if (value !== undefined && value !== "") return value;
  return fallback;
}

export function resolveSeedSettings(
  env: Record<string, string | undefined> = process.env,
  bundled: BundledDefaults = loadBundledDefaults(),
): Record<string, SeedSettingValue> {
  const fromAddress = overridden(
    env,
    "EMAIL_FROM_ADDRESS",
    bundled.email_from_address,
  );
  const privacyText = env.PRIVACY_NOTICE_ENABLED;
  let privacy = bundled.privacy_notice_enabled;
  if (privacyText !== undefined && privacyText !== "") {
    if (privacyText !== "true" && privacyText !== "false") {
      throw new Error("PRIVACY_NOTICE_ENABLED must be true or false");
    }
    privacy = privacyText === "true";
  }

  const color = overridden(
    env,
    "BRAND_PRIMARY_COLOR",
    bundled.brand_primary_color,
  );
  if (!COLOR_PATTERN.test(color)) {
    throw new Error("BRAND_PRIMARY_COLOR must match #RRGGBB");
  }

  return {
    email_from_name: overridden(
      env,
      "EMAIL_FROM_NAME",
      bundled.email_from_name,
    ),
    email_from_address: fromAddress,
    email_reply_to: fromAddress,
    reopen_window_days: REOPEN_WINDOW_DAYS_DEFAULT,
    attachment_max_bytes: ATTACHMENT_MAX_BYTES_DEFAULT,
    attachment_max_files: ATTACHMENT_MAX_FILES_DEFAULT,
    site_name: overridden(env, "BRAND_SITE_NAME", bundled.site_name),
    company_name: overridden(env, "BRAND_COMPANY_NAME", bundled.company_name),
    brand_logo_key: "",
    brand_primary_color: color,
    portal_footer_text: "",
    support_email_display: fromAddress,
    privacy_notice_enabled: privacy,
    privacy_notice_text: "",
    privacy_notice_version: "",
  };
}
