/**
 * Branding variable names (ADR 0017). Values are settings, not source literals.
 * Logo rules: PNG, JPEG, or WebP, at most 524,288 bytes, no SVG (ADR 0017, T21).
 * Color must match #RRGGBB (ARCHITECTURE §5, TM-27).
 */

export const BRANDING_SETTING_KEYS = [
  "site_name",
  "company_name",
  "brand_primary_color",
  "portal_footer_text",
  "email_from_name",
  "support_email_display",
] as const;

export const BRANDING_ENV_KEYS = [
  "BRAND_SITE_NAME",
  "BRAND_COMPANY_NAME",
  "BRAND_PRIMARY_COLOR",
] as const;

export const PORTAL_URL_ENV_KEY = "HD_PUBLIC_URL";

export const LOGO_FORMATS = ["png", "jpeg", "webp"] as const;

export const LOGO_MAX_BYTES = 524_288;

export const BRAND_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
