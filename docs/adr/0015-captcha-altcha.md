# ADR 0015: CAPTCHA: self-hosted ALTCHA by default, Turnstile optional

**Status:** Accepted (Oct 6, 2026). Revised Oct 6, 2026 for Round 5 (B1–B10) and team decisions (T1–T10).

## Context
CAPTCHA plus rate limiting is required on submission (P12); also useful on lookup. No tracking or analytics cookies (R4). Minimize human setup steps.

## Decision
Default **ALTCHA** (open-source proof-of-work widget; challenges signed with `ALTCHA_HMAC_KEY` and verified by our API; no third party, no cookies, no account). A `CaptchaVerifier` interface allows switching to **Cloudflare Turnstile** (`CAPTCHA_PROVIDER=turnstile` + keys) if spam gets through. `none` is allowed only in dev/test.
- **Usable from an external page (B5, future embedded form):** the ALTCHA widget's `challengeurl` can point at `https://<support-domain>/api/v1/public/captcha/challenge`, which sends CORS headers for origins in `PUBLIC_CORS_ORIGINS` only. Challenges are short-lived (expiry in the signed salt) and **single-use**: solved challenges are recorded in `captcha_spent` until expiry, so a solution can't be replayed. Verification happens server-side on submit and lookup regardless of where the form lives.

## Alternatives considered
- **Google reCAPTCHA:** tracking/cookie concerns, conflicts with R4's spirit.
- **hCaptcha / Turnstile as default:** stronger bot detection, but requires creating an external account and keys (a human step) and sends visitor data to a third party.

## Consequences
- Zero setup at install time; GDPR-friendly.
- Proof-of-work slows bots but doesn't stop determined ones; rate limits and per-email caps are the second layer; Turnstile is a config switch away.
