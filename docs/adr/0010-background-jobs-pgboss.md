# ADR 0010: Background jobs with pg-boss in a worker process

**Status:** Accepted (Oct 6, 2026)

## Context
We need: reliable outbound email with retries, attachment scanning, auto-close at least hourly (P4), periodic health checks and cleanup. Fewer moving parts preferred.

## Decision
Run a **`worker`** container from the same server image using **pg-boss** (jobs and cron schedules stored in PostgreSQL). Email uses the **transactional outbox** pattern (row written in the same transaction as the ticket change). Auto-close runs every 15 minutes, closing each due ticket with a conditional `UPDATE … WHERE status='resolved' AND auto_close_due_at <= now()`, so it is idempotent and safe if run twice or concurrently. Jobs accept an injectable clock for tests.

## Alternatives considered
- **BullMQ + Redis:** popular, but adds Redis to run, secure, and back up.
- **OS cron / systemd timers calling scripts:** no retries/visibility; harder to test.
- **setInterval inside the API:** jobs would die with API restarts and compete with requests.

## Consequences
- Emails are never lost if SMTP is down: they wait and retry.
- One extra container from the same image (no new technology).
- Job state lives in the database, so it is backed up and visible on the health page.
