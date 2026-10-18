# ADR 0016: Desktop distribution and updates served by our own server; unsigned in v1

**Status:** Accepted (Oct 6, 2026; context updated Oct 6, 2026: repo confirmed private). Revised Oct 6, 2026 for Round 5 (B1–B10) and team decisions (T1–T10). Revised again Oct 6, 2026 for team decisions T18–T27 and the Doc Steward's consistency report. Revised Oct 6, 2026 for ADR 0018 (plain SemVer tags, forward-only updates).

## Context
The Windows app needs a download location and auto-updates. The repo **is private** (and stays private, B1; it may become public if CI minutes run out), so GitHub Releases can't serve as a public download/update feed without putting a token in the app. That makes the server-hosted feed below required, not just convenient. Code-signing certificates cost money. **B3 (LOCKED): no code signing for now.** **B1 (LOCKED): installer builds run only on releases.** **T20: a manual Windows debug build that publishes nothing is allowed.**

## Decision
- The release pipeline builds the NSIS installer on `windows-latest`, stores it as a (private) GitHub Release asset for CI hand-off, and **bakes it plus `latest.yml` into the `helpdesk-web` image**, served at `/downloads/desktop/`. electron-updater uses the **generic** provider pointing at the server the app is connected to, so the server always offers the desktop version matching its API.
- The API enforces `HD_MIN_DESKTOP_VERSION` with `426`, and the app offers to update.
- **Unsigned** (B3). Installs show SmartScreen's "Windows protected your PC" / "Unknown publisher" prompt (More info → Run anyway). Signing could be added later by adding CI secrets only, if the decision changes.
- The installer is built only in `release.yml`, for plain `vX.Y.Z` tags only (B1, ADR 0018); electron-updater keeps `allowPrerelease = false` and `allowDowngrade = false`; `edge` images carry the latest release's installer. The installer uses the placeholder product name "Help Desk" (`HD_DESKTOP_PRODUCT_NAME`); the app displays the server's `site_name` setting once connected (B5).

## Alternatives considered
- **GitHub Releases as update feed:** simplest for a public repo, but breaks with a private repo and decouples app version from server version.
- **Microsoft Store / MSIX:** store review, developer account, and packaging constraints; overkill for internal staff.
- **Buy an OV certificate:** costly, and hardware-token requirements complicate CI.

## Consequences
- No extra hosting, and no token in the desktop app; works on the home VM and the VPS alike, private repo or public. (Servers themselves need the GHCR download token while private, ADR 0012.)
- The installer is built only on release tags (B1). `edge` images carry the latest release's installer, so between releases an `edge` server may offer the previous release's desktop app; `HD_MIN_DESKTOP_VERSION` and the versioned API cover this (ARCH G36). The manual debug build (T20) publishes nothing and never reaches a server.
- First install shows a SmartScreen warning ("More info → Run anyway").
- Updates are not signature-verified by Windows until signing is added (they are still delivered over HTTPS from our own server in production).
