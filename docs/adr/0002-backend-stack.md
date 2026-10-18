# ADR 0002: Backend stack: Node.js 24 + Fastify + Zod + Prisma

**Status:** Accepted (Oct 6, 2026)

## Context
We need an HTTP API for three or more clients (Portal, Console/Windows, future Android), with strong input validation, an OpenAPI contract, database migrations, and background jobs. It must be mainstream, well documented, and easy for AI agents to work in.

## Decision
- **Node.js 24 LTS** runtime.
- **Fastify** web framework, with **Zod** schemas via `fastify-type-provider-zod`; schemas validate input, filter output, and generate OpenAPI (`@fastify/swagger`).
- **Prisma ORM** for schema, migrations, and queries; hand-written SQL inside Prisma migrations for triggers (append-only history) and full-text indexes; `$queryRaw` for search.
- The same codebase has several entrypoints: `api`, `worker`, `backup`, and a `cli`.

## Alternatives considered
- **Express:** most popular but older; validation and OpenAPI are bolt-ons.
- **NestJS:** well structured and popular, but heavier (decorators, DI) than this small app needs.
- **Hono:** modern and small, but less training data and fewer plugins for multipart, rate limiting, and so on.
- **Drizzle / Kysely:** good SQL-first options; Prisma has the largest presence and the most readable schema for non-experts.

## Consequences
- Response schemas strip unknown fields, which is a structural guard against leaking internal fields to customers.
- Prisma needs the occasional raw SQL migration; this is documented in `AGENTS.md`.
- Native modules (`argon2`) mean the server image uses Debian slim (glibc), not Alpine.
