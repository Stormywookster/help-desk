# ADR 0014: Testing and CI on GitHub Actions, Windows runners for the desktop app

**Status:** Accepted (Oct 6, 2026; amended Oct 6, 2026: repo is private, CI tiered to the free minute budget). Revised Oct 6, 2026 for Round 5 (B1–B10) and team decisions (T1–T10). Revised again Oct 6, 2026 for T20 (manual Windows debug run allowed). Revised Oct 6, 2026 for ADR 0018/0019 and T30–T31. Revised Oct 6, 2026 for CR-35 (`pr-meta`).

## Context
Agents on Linux must be able to build and test everything end to end. Nobody owns a Windows PC, but a Windows installer is required. The repo is **private** on GitHub Free: 2,000 Actions minutes/month with Windows minutes counted ×2, 500 MB shared artifact/package storage, no branch protection/rulesets, and no free CodeQL or push protection. B1 (LOCKED): the repo stays private; Brandon is fine making it public if minutes run out, so no secrets may ever be committed and the history must be safe to publish; **Windows installer builds run only on releases.**

## Decision
- **Vitest** for unit and integration tests (real PostgreSQL), **Playwright** for web E2E and for the Electron app under `xvfb`, **Prism** for OpenAPI mocks, **Mailpit** for email assertions. `npm run verify` runs the whole Linux suite locally and in CI.
- **GitHub Actions:** `ci.yml` on `ubuntu-latest` (lint, types, unit, contract drift, integration with Postgres/Mailpit/ClamAV service containers, E2E, Electron E2E, image build + compose smoke, backup/restore test); `desktop-windows.yml` on **`windows-latest`** (unit tests, `electron-builder --win`, silent NSIS install, Playwright smoke against the installed app, screenshots as artifacts, uninstall); `release.yml` (installer + images + GitHub Release); `scheduled.yml` (full E2E, ZAP baseline, Trivy, audit); Dependabot; gitleaks.
- **Visibility-aware triggers** (`github.event.repository.private`), so no edits are needed if visibility changes:
  - *Private (current):* `fast` job (gitleaks, lint, types, unit, contract, integration; about 6 min) on every PR; `full` job on pushes to `main` and PRs labeled `full-ci`; scheduled suite weekly; **Semgrep CE** for static analysis; artifacts kept 3 days. Budget estimate about **1,620 of 2,000 minutes**; at 75% the `full` job on `main` drops to every 3 hours.
  - *Public (if it happens):* same, plus nightly schedule and **CodeQL**.
  - **Windows (both cases, B1):** the installer build + silent install + Playwright smoke run **only inside `release.yml`** (the release stops if they fail). The Windows smoke test also covers the `helpdesk://` protocol handler (T15): registry key present, cold start with a link argument, warm start via `Start-Process` routed to the running window (single instance), malformed links ignored, key removed on uninstall. A manual `desktop-windows.yml` (allowed by T20; triggered only when needed) lets a bot reproduce a Windows problem without a release; it publishes nothing.
- **No-secrets gate (B1):** gitleaks as a pre-commit hook, in every CI run, and as a weekly full-history scan; a full-history pass is required before any visibility change.
- **Merge gate:** enforced by a ruleset only if public or on GitHub Pro; while private on Free it's a written convention in `AGENTS.md` (PR only, required checks green, `REVIEW <role>: APPROVED` comments because all bots share one identity (T31), Conventional Commit titles (T30), no direct pushes to `main`), backed by **`main-guard.yml`**, which detects and alerts but never auto-reverts (ADR 0019). An always-on **`pr-meta`** job (title check T30, gitleaks on the diff, docs-only classification) runs on every PR and `main` push. `fast` and `full` skip only when `pr-meta` classifies the change as docs-only, using one list in `.github/docs-only-paths.txt`. Bots merge only when `pr-meta` is green and `fast` is green or skipped by that rule (CR-35).
- **Releases:** `release.yml` runs only for plain `vX.Y.Z` tags, and a `gate` job checks the tag, the commit, the CI result, and that no `main-red`/`main-guard` issue is open (ADR 0018).

## Alternatives considered
- **Self-hosted Windows runner / Windows VM:** someone would have to own and maintain Windows.
- **Cross-building the installer on Linux with Wine:** possible, but can't prove the app actually starts on Windows.
- **Jest / Cypress:** viable; Vitest fits Vite projects, Playwright covers both browsers and Electron.
- **Running the full suite on every PR while private:** would exceed 2,000 minutes in a busy month.
- **Paid minutes or GitHub Pro:** costs money (Brandon's decision); not needed for the design to work.

## Consequences
- Windows-specific bugs are caught by CI smoke tests, with screenshots for review.
- Windows-specific regressions surface only when a release is built (Linux Electron E2E still runs on every `main` push); full E2E feedback arrives after merge, not on each PR; regressions are fixed forward. If minutes run out, Actions pauses until the next month (no charge without a payment method/budget).
- No enforced branch protection while private on Free; relies on bot discipline plus post-merge CI on `main`.
- Public: CI, Windows runs, CodeQL, and rulesets all free.
