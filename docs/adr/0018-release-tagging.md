# ADR 0018: Plain SemVer release tags only; `stable` moves forward only; pin to roll back

**Status:** Accepted (Oct 6, 2026). Answers IMPLEMENTATION_PLAN Q-P3 (architect decision). Revised Oct 6, 2026 for CR-35 (docs-only tip needs a manual `full`).

## Context
- The beta VM runs `hd update stable` every hour (ARCHITECTURE §12.4, B4), so **every release reaches Brandon's VM within an hour** with nobody watching.
- `release.yml` was triggered by `v*.*.*`. That glob also matches `v1.2.0-rc.1` and similar, so a test tag would build the installer, move `stable`, and land on the VM.
- The repo is private on GitHub Free, so tags can't be protected by rulesets, and anyone (any bot) who can push can create a tag. The guard has to be in the workflows and on the server.
- The Windows installer is built only by `release.yml` (B1). A manual debug build that publishes nothing is allowed (T20). All bots share one GitHub identity (T31), and PR titles follow Conventional Commits (T30).

## Decision
1. **Only plain SemVer tags `vX.Y.Z` are releases.** The `release.yml` trigger is `tags: ['v[0-9]+.[0-9]+.[0-9]+']`, and its first job (`gate`) re-checks `GITHUB_REF_NAME` against `^v[0-9]+\.[0-9]+\.[0-9]+$` and fails on anything else, so a suffix (`-rc.1`, `-beta`, `+build`) can never publish. There are **no rc or pre-release tags**, and the workflow never creates GitHub pre-releases or drafts that stay drafts.
2. **The `gate` job also refuses a tag when:** the tagged commit isn't on `main`; `ci.yml` `full` didn't succeed for that exact commit; an issue labelled `main-red` or `main-guard` is open (ADR 0019); or the version isn't strictly greater than the latest published release (no re-use, no going backwards). If `full` didn't run on that commit (for example in the 75%-budget mode where `full` on `main` runs every 3 hours, ARCHITECTURE §16.3), the releasing bot first runs `ci.yml` manually (`workflow_dispatch`) on it. The same applies when the tip of `main` is a docs-only commit, where `full` was skipped: a manual run always runs `full`. The gate needs only the `GITHUB_TOKEN` with `contents: read`, `checks: read`, `issues: read`, and `actions: read`.
3. **What the image tags mean:**
   - `X.Y.Z` (immutable) and `stable` are pushed **only** by `release.yml`, and `stable` is moved **last**, after the Windows smoke test, both image builds, and the release assets have all succeeded. `stable` = the newest fully passed release.
   - `edge` and `sha-<commit>` are pushed by `ci.yml` `full` on `main`, only when `full` passes. `edge` = the newest green `main` commit. It bundles the installer from the latest release, so its desktop app can be one release behind (G36). No Brandon-run server tracks `edge`; it's for bots' own test servers and CI stack smoke runs.
4. **The server updater moves forward only.** The hourly timer runs `hd update --auto`, which acts only when the server tracks the channel (`HD_IMAGE_TAG=stable`). After pulling, it reads the image's `org.opencontainers.image.version` label, refuses anything that isn't plain `X.Y.Z`, and refuses to auto-install a version lower than or equal to the one running. Electron's updater keeps `allowPrerelease = false` and `allowDowngrade = false`, and its feed is the server's own `/downloads/desktop/`, so the desktop app always follows the server.
5. **Rollback:**
   - Automatic: an update whose health check fails rolls back to the previous image tag (existing behavior, ARCHITECTURE §12.4).
   - Manual pin: `sudo hd update 0.3.1` (or `v0.3.1`) sets `HD_IMAGE_TAG=0.3.1`, takes the usual pre-update backup, and installs that version. While pinned, the hourly timer does nothing. `sudo hd update stable` un-pins. Going down asks for confirmation and warns that database migrations are only guaranteed backward-compatible for one release (expand-then-contract). For anything older, restore the pre-update backup (`sudo hd restore <snapshot>`).
   - A bad release is normally **fixed forward**: a new patch tag (`v0.3.2`) reaches the VM within the hour. `stable` is never moved backwards, because the forward-only updater would ignore it anyway.
6. **Testing before a release (instead of rc tags):** `full` green on the exact commit; the `edge` images from that commit in the CI stack smoke run; and, if Windows code changed since the last release, a manual `desktop-windows.yml` run on that commit (T20; its installer is a 3-day artifact that publishes nothing). Then the release-notes PR merges and a bot tags it.
7. **Version numbers (T30):** while in `0.x`, `feat` and breaking changes bump the minor version and `fix` bumps the patch. Release notes are generated from the Conventional Commit titles of the PRs merged since the last tag.

## Alternatives considered
- **`-rc` tags that skip `stable`:** possible, but the trigger, the updater, and the image tags would all need exceptions, and one mistake would put an rc build on the unattended VM. A manual debug run plus `edge` covers the same need.
- **Draft or pre-release GitHub Releases as candidates:** servers never read GitHub Releases (they pull from GHCR), so this would add a second channel with no consumer.
- **Moving `stable` back on a bad release:** fights the forward-only updater, and a pin or a patch release is simpler.

## Consequences
- An accidental or suffixed tag publishes nothing. A plain tag publishes only when `main` is green and the gate passes.
- Brandon's VM only ever moves forward to fully tested releases. Pinning a version is a rare, optional human step (ARCHITECTURE H-21).
- No extra CI minutes. The `gate` job runs about 1 minute per release (about 4 per month).
