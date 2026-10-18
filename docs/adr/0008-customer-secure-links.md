# ADR 0008: Customer access via emailed secure links

**Status:** Accepted (Oct 6, 2026). Revised Oct 6, 2026 for Round 5 (B1–B10) and team decisions (T1–T10). Revised again Oct 6, 2026 for team decisions T18–T27 and the Doc Steward's consistency report.

## Context
Customers have no accounts (§4). Lookup is reference # + email, after which the system emails a short-lived secure link; every customer email carries the ticket's link (Q1). The Resolved email's reopen link must work during the reopen window (P8). R9 (LOCKED): links may stay valid for up to 14 days. T9: lifetimes stay configurable, but the server refuses anything over 14 days. T2: the reopen window is limited to 1–14 days.

## Decision
- Tokens: 32 random bytes, base64url; stored only as `HMAC-SHA256(pepper, token)`; created by the worker at send time (raw tokens never at rest).
- Link format `https://<domain>/t#<token>` (token in the fragment, so it never reaches server or proxy logs); the Portal exchanges it via `POST /public/access` for a ticket-scoped `hd_cust` cookie session (2 h idle / 24 h max).
- Token purposes and expiry (T18): **`lookup` 60 min, `notification` 7 days, `reopen` until that ticket's auto-close time**, **never more than 14 days** (R9/T9). The Resolved email carries one `reopen` link; **a staff reply on an already-Resolved ticket carries two links, a `notification` link (7 days) and a `reopen` link (until auto-close) (T25)**. A `reopen` link opens the ticket with the Reopen dialog showing (`/public/access` returns `purpose` and `showReopenDialog`); nothing changes until the customer clicks; multi-use until expiry (email scanners pre-click links); revocable per ticket; expired-link page offers "email me a fresh link" (sent only to the address on file).
- **14-day ceiling enforced three ways:** startup validation of `SECURE_LINK_LOOKUP_TTL_MINUTES` / `SECURE_LINK_NOTIFICATION_TTL_DAYS`; settings validation of `reopen_window_days` (1–14); `expires_at` clamped to creation + 14 days. Customer sessions never outlive link creation + 14 days. Lookup/notification lifetimes are startup config only (no settings UI).
- Revocation also happens automatically when staff correct a customer's email address (B9); the confirmation email (with a new link) is resent to the new address only (T12).
- Customer sessions never expose staff identity: staff messages show as "Support team" (T26b, ADR 0004).
- The submission confirmation page gives no direct access; the emailed link is the only way in (confirms the address).
- Lookup/resend always return the same response; CAPTCHA and rate limits (lookup: 3/hour per email (T3), 5/hour per reference, 10/hour per IP).

## Alternatives considered
- **Reference # + email shows the ticket directly:** emails are guessable/known; fails §16.
- **Signed stateless tokens (JWT/HMAC URLs):** can't be revoked individually without a denylist; DB-stored hashes are simple at this scale.
- **Single-use links:** broken by corporate link scanners.
- **One-time codes typed on the site:** more friction for customers; can be added later.

## Consequences
- Anyone the customer forwards an email to can view that ticket until the link expires (mitigated by expiry, scope, and revocation).
- Requires working email for customer access, which is already a locked dependency.
