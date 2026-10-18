# ADR 0005: Windows app: Electron wrapping the shared Console UI

**Status:** Accepted (Oct 6, 2026). Revised Oct 6, 2026 for team decision T15 (deep links) and B1 (Windows builds on releases only). Revised Oct 6, 2026 for T28 (app-level unread badge). Revised Oct 6, 2026 for T33/T34. Revised Oct 6, 2026 for T35.

## Context
The Windows app is the primary internal client. **Nobody on the project owns a Windows machine**, and code is written and tested by agents on Linux. The app needs online access only (A2). Android may follow.

## Decision
Build the staff UI once as a React SPA (`apps/console`) and package it for Windows with **Electron** (`apps/desktop`): bundled files served from `app://console`, hardened (`contextIsolation`, `sandbox`, no Node in renderer, navigation locked), bearer token kept in the main process and encrypted with `safeStorage` (DPAPI). Package with **electron-builder** (NSIS, per-user install) and update with **electron-updater** from our own server.

**Deep links (T15):** the installer registers the `helpdesk://` scheme per user via electron-builder `protocols`, and the app calls `app.setAsDefaultProtocolClient("helpdesk")` at startup. `app.requestSingleInstanceLock()` routes links from new launches (`second-instance` argv) to the running window; cold starts read `process.argv`. The main process accepts only `helpdesk://ticket/HD-XXXXXX` (strict reference format) and passes just the reference to the renderer, which loads the ticket through the authenticated API after login. Because mail clients like Gmail may not make custom-scheme links clickable, alert emails link to an https hand-off page on the server (`/open/ticket/{reference}`) that triggers the deep link and explains the manual fallback.

**App-level unread badge (T27, T28):** the renderer polls `GET /internal/me/attention-count` every 60 s (and refreshes on window focus and after the user's own actions that can clear the flag), then passes only an integer to the main process (`setAttentionCount(n)`, 0–9999). The main process shows a taskbar overlay badge (`BrowserWindow.setOverlayIcon`, build-time images `1`–`99` and `99+`; `app.setBadgeCount` doesn't work on Windows) and puts the count in the window title, `({n}) {site_name}` (DESIGN 4.7, confirmed in DESIGN rev 6). Per **T33**, counts over 99 show `99+` (badge) and `(99+) {site_name}` (title), and both are hidden at 0 and whenever no count is known (signed out, loading, server unreachable). What sets and clears the flag: T34 (opening a ticket or adding a note doesn't clear it) and T35 (every move into Closed or Cancelled clears it, so those tickets never count; ARCHITECTURE §4). The count uses the same visibility scope as the ticket list (ARCHITECTURE §4).

Testing: almost everything is tested on Linux (the Console in Chromium via Playwright, and the Electron app itself under `xvfb` via Playwright's Electron support). GitHub **`windows-latest`** runners (on releases, plus a manual debug run, per B1) build the installer, run unit tests, install it silently, launch it with Playwright against a Prism mock API, test the `helpdesk://` protocol handler (cold and warm start), and upload screenshots.

## Alternatives considered
- **WPF / WinUI 3 / .NET MAUI:** native look, but a second language, Windows-only builds and UI tests (WinAppDriver/FlaUI), no code reuse with the web.
- **Tauri:** small installers, but adds Rust, and uses WebView2 on Windows vs WebKitGTK on Linux, so Linux tests are less representative.
- **Browser-only (PWA):** simplest, but the requirements name a Windows application.

## Consequences
- Large installer (about 100 MB) and higher memory than native; acceptable for one or a few staff.
- The same Console runs in a browser (useful for testing; off in production by default) and can later be wrapped for Android with Capacitor.
- Electron needs regular version bumps for security (Dependabot + Windows CI make that routine).
