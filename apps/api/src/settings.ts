/**
 * First-start settings from ARCHITECTURE §5.
 * Placeholder names are read from deploy/env.example or the process environment.
 * They are not written as literals here: the branding check forbids that.
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

export const EXAMPLE_ENV_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../deploy/env.example",
);

export function exampleValue(exampleText: string, key: string): string {
  const line = exampleText
    .split("\n")
    .find((entry) => entry.startsWith(`${key}=`));
  if (line === undefined) {
    throw new Error(`missing ${key} in the example environment`);
  }
  const raw = line.slice(key.length + 1);
  const commentAt = raw.search(/[ \t]#/);
  return (commentAt === -1 ? raw : raw.slice(0, commentAt)).trim();
}

export function loadExampleEnv(path: string = EXAMPLE_ENV_PATH): string {
  return readFileSync(path, "utf8");
}

export type SeedSettingValue = string | number | boolean;

export function resolveSeedSettings(
  env: Record<string, string | undefined>,
  exampleText: string,
): Record<string, SeedSettingValue> {
  const fromEnvOrExample = (key: string): string => {
    const value = env[key];
    if (value !== undefined && value !== "") return value;
    return exampleValue(exampleText, key);
  };

  const fromAddress = fromEnvOrExample("EMAIL_FROM_ADDRESS");
  const privacy = fromEnvOrExample("PRIVACY_NOTICE_ENABLED");
  if (privacy !== "true" && privacy !== "false") {
    throw new Error("PRIVACY_NOTICE_ENABLED must be true or false");
  }

  const color = fromEnvOrExample("BRAND_PRIMARY_COLOR");
  if (!COLOR_PATTERN.test(color)) {
    throw new Error("BRAND_PRIMARY_COLOR must match #RRGGBB");
  }

  return {
    email_from_name: fromEnvOrExample("EMAIL_FROM_NAME"),
    email_from_address: fromAddress,
    email_reply_to: fromAddress,
    reopen_window_days: REOPEN_WINDOW_DAYS_DEFAULT,
    attachment_max_bytes: ATTACHMENT_MAX_BYTES_DEFAULT,
    attachment_max_files: ATTACHMENT_MAX_FILES_DEFAULT,
    site_name: fromEnvOrExample("BRAND_SITE_NAME"),
    company_name: fromEnvOrExample("BRAND_COMPANY_NAME"),
    brand_logo_key: "",
    brand_primary_color: color,
    portal_footer_text: "",
    support_email_display: fromAddress,
    privacy_notice_enabled: privacy === "true",
    privacy_notice_text: "",
    privacy_notice_version: "",
  };
}
