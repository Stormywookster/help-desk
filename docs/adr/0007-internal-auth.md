# ADR 0007: Internal auth: passwords + server-side sessions, MFA-ready

**Status:** Accepted (Oct 6, 2026). Revised Oct 6, 2026 for Round 5 (B1–B10) and team decisions (T1–T10). Revised again Oct 6, 2026 for team decisions T18–T27 and the Doc Steward's consistency report.

## Context
Two fixed roles (Administrator, Agent; R3). Admin creates users and resets passwords; no self-signup; admin recovery is a server-side procedure (P19). No MFA for anyone in v1, but MFA must be easy to add (R2). Clients: browser Console, Windows app, future Android.

## Decision
- Passwords hashed with **Argon2id**; minimum **15 characters** (confirmed by the security owner; G25 resolved, DESIGN's 12 is superseded) + breached/common list check; no forced rotation.
- **Server-side opaque sessions** (256-bit random token; only an HMAC hash stored). Browser: HttpOnly Secure SameSite=Strict cookie + custom-header CSRF guard. Native apps: `Authorization: Bearer`. Configurable idle/absolute lifetimes; revocation on password change/reset/deactivation.
- Lockout values follow DESIGN OQ-24: 10 failures per account+IP → 15-minute lock; 12 h idle sign-out.
- **User lifecycle (T22, T26c):** users are created with a temporary password, edited (name, role), deactivated, never deleted; the last active Administrator can't be deactivated or demoted. A user's email can't be edited in v1: to fix a wrong address, deactivate the user and create a new one.
- Throttling per IP and per account+IP, short account-wide lockout at high volume, admin alerts, CLI unlock/reset.
- First admin created through a one-time **setup code** printed by the server installer and entered in the Windows app's first-run screen (DESIGN W-02); setup endpoints disappear once an Administrator exists. CLI `hd create-admin` is the fallback.
- **MFA extension point:** `user_mfa_factors`, `users.mfa_required`, `sessions.auth_methods/mfa_verified_at` created now but unused; login returns a union result (`authenticated` | reserved `mfa_required`) so TOTP/WebAuthn add a step, not a redesign.

## Alternatives considered
- **JWT access/refresh tokens:** stateless but hard to revoke; no benefit for a single server.
- **External identity provider (Keycloak, Auth0, Clerk):** more moving parts or cost; overkill for a handful of users.
- **Auth libraries (Lucia, Better Auth):** viable, but the needed surface is small and well-defined; a small in-house module with tests is clearer for bots.

## Consequences
- Sessions are instantly revocable and visible to users.
- Single-factor login is an accepted residual risk until MFA is added.
- The setup code is short-lived (7 days), hashed, rate-limited, and invalidated after 10 wrong tries.
- No email-based reset reduces attack surface but means admin recovery needs server access.
