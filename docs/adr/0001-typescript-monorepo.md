# ADR 0001: TypeScript everywhere, in one monorepo

**Status:** Accepted (Oct 6, 2026; updated Oct 6, 2026: repo already exists, private)

## Context
All code is written by AI coding agents on Linux VMs. Brandon doesn't code. There are four deliverables: an API server, a public website, an internal website, and a Windows app, with Android possible later. Bots need consistent conventions and the ability to build and test everything from one checkout.

## Decision
Use **TypeScript** for every component (Node.js server, React web apps, Electron desktop app). Keep them in **one GitHub repository**: the existing **private** repo `Stormywookster/help-desk` (has `main` with a README; Cursor has access; stays private per B1) using **npm workspaces** (`apps/*`, `packages/*`). Shared business rules, validation schemas, and the generated API client live in `packages/` and are imported by every app.

## Alternatives considered
- **C#/.NET backend + WPF/WinUI desktop + React web:** strong Windows tooling, but two languages, Windows-only UI tests, and no code sharing with the web.
- **Separate repositories per app:** more coordination, version drift, harder for one agent to make an end-to-end change.
- **pnpm / Nx / Turborepo:** good tools, but extra moving parts; npm workspaces come with Node.

## Consequences
- One toolchain (Node 24, npm) for bots to learn; one `npm run verify` runs everything.
- Status and permission rules are written once and used by server and UIs.
- TypeScript type-checking catches many mistakes before tests run.
- If performance ever becomes an issue (unlikely at this volume), Node is the limiting factor, but that is far beyond expected load.
