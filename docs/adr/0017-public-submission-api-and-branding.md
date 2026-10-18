# ADR 0017: Public submission API ready for embedding; branding as settings

**Status:** Accepted (Oct 6, 2026; Round 5, B5)

## Context
B5 (LOCKED): "Help Desk" is the placeholder site name. In the future, not v1, the help form will live on the official company website, so ticket submission must stay reachable through the public API and the branding/name must stay configurable. The company isn't registered or named yet, so every company name, logo, and legal text must be a configurable placeholder (Round 5 context). Submission already requires CAPTCHA plus rate limits (P12).

## Decision
- **Public submission is a documented API**, not just the Portal's back end. `GET /public/config`, `GET /public/captcha/challenge`, `POST /public/tickets`, and `POST /public/lookup` are tagged `public-submission` in OpenAPI with examples and every error, and `docs/runbooks/embed-form.md` shows a minimal external form.
- **CORS allow-list by env var:** `PUBLIC_CORS_ORIGINS` (exact `https://` origins, empty by default, wildcards refused at startup) enables CORS on those endpoints only. Credentials are never allowed. Customer, auth, internal, and admin routes are never cross-origin.
- **CAPTCHA from an external page:** ALTCHA with a cross-origin `challengeurl`; challenges are short-lived and single-use (ADR 0015).
- **Idempotency key:** optional `Idempotency-Key` header on `POST /public/tickets`. It is stored hashed for 24 h with a request fingerprint, only after the CAPTCHA passes:
  - same key and same request → original `201` (no duplicate ticket or email);
  - same key and different request → `422 IDEMPOTENCY_KEY_REUSED`;
  - same key while the first is in flight → `409 IDEMPOTENCY_IN_PROGRESS`.
- **Rate limits** are identical to the Portal's (per IP, per email). Calls go directly from the visitor's browser. Secure links always point to the Help Desk Portal (`HD_PUBLIC_URL`).
- **Branding is data:** `site_name` ("Help Desk"), `company_name` ("Your Company"), logo (placeholder until uploaded; PNG/JPEG/WebP only, ≤ 512 KB = 524,288 bytes per T21, re-encoded), `brand_primary_color`, `portal_footer_text`, `email_from_name` (default "Help Desk", T21), `support_email_display` are admin settings, seeded from `BRAND_*` env vars on first start. The portal URL in emails comes from `HD_PUBLIC_URL`. Templates and UI read them through `/public/config` or template variables. A build test fails on a hard-coded site or company name.
- **Not built in v1:** an iframe embed page (`/embed/submit` with `frame-ancestors` from the allow-list) and a server-to-server API key for sites that relay submissions. Both are small additions later.

## Alternatives considered
- **Iframe-only embedding:** easiest for a website builder, but couples the company site to our page layout and needs `frame-ancestors` relaxation; kept as a later option.
- **Allow any origin (`*`):** simpler, but invites drive-by use of our API from arbitrary sites; an explicit allow-list costs nothing.
- **Hard-code the placeholder name and replace it later:** a search-and-replace across code, templates, and the desktop build once the company exists; settings avoid a release for a rename.
- **API keys for all public callers now:** unnecessary while the only caller is our own Portal; can be added for server-to-server use later.

## Consequences
- Moving the form to the company site later means setting `PUBLIC_CORS_ORIGINS` (H-20), setting branding (H-19), and writing the company page. No Help Desk code change.
- Threat model gains TM-26 (cross-origin abuse) and TM-27 (branding injection). CAPTCHA, rate limits, size limits, and idempotency remain the real protection, since CORS doesn't stop non-browser clients.
- Renaming the Windows installer file still needs a release build; everything else changes instantly.
