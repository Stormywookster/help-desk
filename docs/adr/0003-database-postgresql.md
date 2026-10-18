# ADR 0003: Database: PostgreSQL 17

**Status:** Accepted (Oct 6, 2026)

## Context
Low volume, one admin, self-hosted in Docker. Needs: reliable transactions, concurrent writes from API + worker, full-text search (P14), safe job locking for auto-close, append-only enforcement (P23), and easy nightly dumps (H4).

## Decision
Use **PostgreSQL 17** (official `postgres:17` image, minor version pinned), only reachable on an internal Docker network. Job queue (pg-boss) and full-text search (`tsvector` + GIN) also live in PostgreSQL, so no Redis or search server is needed.

## Alternatives considered
- **SQLite:** fewest moving parts and would handle the volume, but has a single-writer limit across API + worker processes, weaker locking primitives for jobs, and makes later scaling or a separate worker host harder.
- **MySQL/MariaDB:** fine, but PostgreSQL has better JSON, full-text, trigger, and Prisma support.
- **Managed cloud DB:** ruled out (self-hosted, no paid platform).

## Consequences
- One more container (about 100 to 300 MB RAM at this size).
- `pg_dump`/`pg_restore` give simple, well-understood backups.
- Major version upgrades (e.g. 17 → 18) are done later by dump and restore, using the same backup tooling.
