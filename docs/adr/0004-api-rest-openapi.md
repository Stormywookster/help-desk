# ADR 0004: REST API at /api/v1 with a generated OpenAPI contract

**Status:** Accepted (Oct 6, 2026). Revised Oct 6, 2026 for Round 5 (B1–B10) and team decisions (T1–T10). Revised again Oct 6, 2026 for team decisions T18–T27 and the Doc Steward's consistency report.

## Context
The backend must not assume the Windows app is the only client (§2); a future Android app must work without backend rework. Several bots build clients in parallel and need a reliable contract.

## Decision
- **REST + JSON**, URL-versioned under **`/api/v1`**; additive changes stay in v1, breaking changes go to `/api/v2` side by side.
- Route groups by audience: `/public`, `/customer`, `/auth`, `/internal`, `/admin`, each with one auth hook.
- **OpenAPI 3.1 is generated from code** into `openapi/openapi.json`, committed; CI fails on drift. Clients use a generated typed client (`openapi-typescript` + `openapi-fetch`); Android can generate Kotlin from the same file; Prism serves mocks for UI work and Windows smoke tests.
- **Errors use RFC 9457 Problem Details** with a stable `code` and `requestId`.
- **Over-limit uploads (T7): `413 Content Too Large`, code `UPLOAD_LIMIT_EXCEEDED`**, with `limit.kind` = `file_size` | `file_count` | `request_size`, plus `maxBytes`/`maxFiles` and the offending file name. The whole request is rejected (nothing stored, no email). Chosen over 422 because RFC 9110's 413 means "content larger than the server is willing to process", which fits both too-large and too-many files; reverse proxies already answer 413, so clients need one handling path; 422 stays for field validation.
- **Public submission is a first-class, documented API** (B5): OpenAPI tag `public-submission` with examples, optional `Idempotency-Key` header on `POST /public/tickets` (`422 IDEMPOTENCY_KEY_REUSED`, `409 IDEMPOTENCY_IN_PROGRESS`), and CORS for an env allow-list only (ADR 0017).
- **Customer-facing schemas carry no staff identity (T26b):** `/public` and `/customer` responses expose `authorType: customer|support` and a server-computed `authorDisplay` ("You" / "Support team"), never staff names, user IDs, or emails; the serializer drops fields not in the schema, and a canary contract test enforces it.
- **No delete for users or products (T22); staff email not editable (T26c):** `PATCH /admin/users/{id}` accepts name, role, and active only (`422` on `email`); `409 LAST_ACTIVE_ADMIN` protects the last active Administrator.
- `409 TICKET_READ_ONLY` for staff changes on Closed/Cancelled tickets (T1); `422 SENDER_TEST_FAILED` when a new sender's test email fails (T6).
- Optimistic concurrency via `version`/`expectedVersion`; `426` for too-old desktop clients.

## Alternatives considered
- **GraphQL:** flexible, but more concepts, harder caching/authorization per field, less suited to file uploads.
- **tRPC:** excellent for TS-only clients, but ties clients to TypeScript (bad for native Android).
- **Hand-written OpenAPI (contract-first):** clear, but drifts from code unless heavily tooled.
- **T7 alternatives:** `422 VALIDATION_FAILED` with a field error (mixes size limits into validation and differs from what proxies return); accepting the allowed files and dropping the rest (T7 requires rejecting the whole request).

## Consequences
- Any language can be a client.
- Every endpoint must declare request/response schemas (enforced by review and lint).
- Breaking changes are visible as diffs in `openapi.json` during PR review.
