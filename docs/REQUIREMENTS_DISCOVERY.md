# Help Desk: Requirements Discovery Log

**Owner:** Project Lead | **Product owner:** Brandon Trout | **Phase:** 1 CLOSED Oct 6, 2026. Phase 2 (architecture + design) started.
**Source:** `HELP_DESK_PRODUCT_REQUIREMENTS_BASELINE.md` (the baseline). Section refs like §10 point there.

Labels used on every item:
- **LOCKED**: stated in the baseline or confirmed by Brandon. Not to be changed without Brandon.
- **PROPOSED**: a recommended product default. Not in effect until Brandon accepts it.
- **ARCH**: an architecture/implementation decision. Owned by the team, made only after Phase 1 closes.
- **ASSUMPTION**: something we're treating as true unless Brandon says otherwise.
- **OPEN**: a product question only Brandon can answer.

---

## Round 1: blocking questions (asked and answered Oct 6, 2026)

- **Q1 LOCKED, ticket lookup:** Customer enters reference # + email; the system emails a short-lived secure link to that address. Every customer-facing email carries that ticket's secure link.
- **Q2 LOCKED, customer email:** Outbound email for submission confirmation, each support reply, Waiting on Customer, Resolved, and auto-Closed. No inbound reply-by-email in v1; customers reply on the website via the secure link.
- **Q3 LOCKED, admin alerts:** The system emails the admin on new tickets, customer replies, and reopens. *Team decision T27: an unread indicator in the Windows app is in v1.*
- **Q4 LOCKED, attachments:** Both directions. Images, PDF, plain text/log files, ZIP. 10 MB per file, 5 files per message. Malware scan before staff can open. Kept for the life of the ticket.
- **Q5 LOCKED, hosting constraints:** Self-hosted. Runs in Docker container(s) on a Linux server shared with other services. Pre-launch development/staging on an Ubuntu VM; a dedicated Linux Mint machine on Brandon's local network is an option if needed. No paid cloud platform assumed. *OPEN follow-ups: domain, how the public site is exposed to the internet, outbound email sending method, backups.*
- **Q6 LOCKED, products:** Launch with Device Monitor only. *PROPOSED: keep the admin-managed product list in the data model so more products can be added later; when only one product exists, the form pre-selects it and hides the dropdown. No "Other" option at launch.*

## Round 1.5: hosting follow-ups (answered Oct 6, 2026)
- H1 LOCKED: Pre-launch uses Brandon's existing personal domain if needed; a dedicated domain is purchased at go-live.
- H2 LOCKED: Production runs on a VPS (Linux, Docker, shared with other services). Pre-launch runs on Brandon's local Ubuntu VM. This refines Q5.
- H3 OPEN (Brandon asked for clarification, re-asked in Round 3): outbound email sending method and sender address.
- H4 LOCKED: Nightly backup of database + attachments to a second location Brandon controls.

## Round 2: answered Oct 6, 2026 (Brandon's original answers saved in brandon-answers-round2-2026-10-06.md)

**Workflow / lifecycle**
- P1 LOCKED (Brandon changed it): A customer reply does **not** reopen a Resolved ticket. Reopening needs a deliberate customer action (an explicit Reopen button), so a "thank you" doesn't reopen it. *Reply-on-Resolved behavior is in Round 3 (R1).*
- P2 LOCKED: A customer reply on New / Open / In Progress adds the message, doesn't change status, and flags "customer replied" internally.
- P3 LOCKED: Customers can cancel from New, Open, In Progress, or Waiting on Customer. They can't cancel from Resolved, Closed, or Cancelled.
- P4 LOCKED: Auto-close fires N x 24 hours after the most recent move into Resolved, where N is the reopen window (default 14, configurable 1-14 under T2). A reopen resets the clock. Checked at least hourly.
- P5 LOCKED: No cap on customer reopens.
- P6 LOCKED: Waiting on Customer has no automatic timeout in v1.
- P7 LOCKED: When Admin reopens a Closed ticket or restores a Cancelled one, it goes to Open.
- P8 LOCKED (Brandon changed it): The customer gets an email when the ticket is Resolved, with a reopen link. **No email on auto-close.** This supersedes the "auto-Closed" email in Q2. The Resolved email says the ticket closes automatically after N days (the reopen window, T2).

**Submission form**
- P9 LOCKED: Name (optional), email (required), product (required; pre-selected and hidden while only one product exists), subject (required, max 150), description (required, max 10,000), customer-reported impact (optional), attachments (optional). No categories in v1.
- P10 LOCKED: Impact options are "Just a question", "Something isn't working", and "I can't use the product at all". Staff see it as a hint only; it never sets priority.
- P11 OPEN (not answered, re-asked in Round 3): Priority levels Low / Normal (default) / High / Urgent.
- P12 LOCKED: CAPTCHA plus rate limiting per IP and per email.
- P13 LOCKED: Non-sequential reference number, e.g. `HD-7K3M9Q`.

**Internal operations**
- P14 LOCKED: Search by reference #, email, and subject/body. Filter by status, priority, product, assignee, and date range. Default view is my open tickets plus unassigned New.
- P15 LOCKED: No dashboard/reporting beyond counts per status.
- P16 LOCKED: Out of v1: knowledge base, SLAs/escalation, canned responses, satisfaction surveys. *Agent role UI: see the conflict in Round 3 (R3).*
- P17 LOCKED: Role-based permissions in the backend. Admin-only actions: settings, user management, reopen Closed, restore Cancelled, hard delete.
- P18 LOCKED (Brandon changed it): Initial Administrator is created by a one-time setup step. Brandon creates internal users intentionally with a password (no self-signup), and he can manage users and reset their passwords. No MFA "for now" for other internal users. *Admin MFA scope: Round 3 (R2).*
- P19 LOCKED: Admin recovery uses a documented server-side procedure; no self-service reset.
- P20 LOCKED: Admin settings are the product list, email sender name/address, reopen window (default 14 days), and attachment limits.

**Data / privacy**
- P21 LOCKED: Tickets, history, and attachments are kept indefinitely. Admin can permanently delete a ticket, and the deletion is logged without content.
- P22 LOCKED (direction): Customer location is unknown, so **assume GDPR/CCPA obligations apply.** *Specific features: Round 3 (R4).*
- P23 LOCKED: Audit history is append-only and can't be edited, even by Admin.
- P24 LOCKED: Customer-visible history shows submission, replies from both sides, and status changes. Assignment, priority, and internal notes stay hidden. (Brandon confirmed internal notes stay internal, which matches the proposal.)

## Assumptions
- A1 LOCKED: English only; America/New_York display timezone.
- A2 LOCKED: Windows app requires internet; no offline mode.
- A3 LOCKED: Customer-visible status names match the internal lifecycle names.
- A4 LOCKED: Brandon is the initial Administrator and the only internal user at launch.
- A5 LOCKED: Public site is mobile-friendly.

## Round 3: final clarifications (answered Oct 6, 2026)
- R1 LOCKED: A customer reply on a Resolved ticket adds the message. Status stays Resolved and the 14-day clock keeps running. The admin gets an email and a "customer replied" flag. Closed tickets are read-only for customers.
- R2 LOCKED: No MFA for anyone in v1, including the Administrator. (ARCH note: the design should keep MFA easy to add later.)
- R3 LOCKED: User management is in v1. Brandon creates users with a password and can reset passwords. There are two fixed roles: Administrator, and Agent (all ticket work; no settings, no user management, no reopening Closed, no restoring Cancelled, no hard delete). No configurable permission matrix.
- R4 LOCKED: A privacy notice link and acknowledgement on the submission form; admin tools to export all data for an email and to permanently delete all tickets for an email; no tracking or analytics cookies. Brandon supplies the notice text.
- R5 LOCKED (resolves H3): Start by sending through a Gmail-style mailbox over SMTP. Moving to Amazon SES or another provider later must be simple, so email sending has to be swappable through configuration. Principle: **start small, expand later.**
- R6 LOCKED (resolves P11): Priority levels are Low, Normal (default), High, and Urgent.
- R7 LOCKED: No tech preferences. **Brandon has no coding knowledge**, so choose mainstream, well-documented, low-maintenance technology that agents can build and operate with minimal human steps.
- R8 LOCKED: Code lives on GitHub in Brandon's account (`Stormywookster`), in a new repository.
- PROJECT GOAL (LOCKED): The real point of the project is to test how much the bot team can build on its own. Minimize steps that need Brandon, and when one is unavoidable, make it short and exact.

## Round 4: Phase 2 decisions (Oct 6, 2026)
- R9 LOCKED (Brandon, via Support Ops): Customer secure links, including the Resolved reopen link, can stay valid for 14 days. For Brandon, 14 days counts as "short-lived" (resolves the Q1 vs reopen-window conflict).
- R10 LOCKED (Brandon, via Support Ops): For testing, `support.trouthomelab@gmail.com` is both the sending mailbox and the From address. It is not the live address, which hasn't been created yet. The sender has to be easy to change at go-live. All emails and links sent during testing are test data.

## Round 5: Phase 2 batch answered by Brandon (Oct 6, 2026, 3:29 PM)
- B1 LOCKED: The repo stays private. If CI minutes run out, Brandon is fine making it public, so no secrets may ever be committed and the history must be safe to publish. Windows installer builds run only on releases.
- B2 LOCKED: For beta, Brandon handles and stores backups himself. The system must include an automatic scheduled backup to a configurable location (e.g. a local path or mounted drive). An off-site target such as Backblaze B2 is optional and later. Default retention is 7 daily / 4 weekly / 12 monthly (configurable; Brandon didn't object).
- B3 LOCKED: No Windows code signing for now. Installs show an "unknown publisher" warning.
- B4 LOCKED: Beta does not run on the VPS, and the beta machine has enough RAM for the virus scanner. VPS sizing is revisited before go-live.
- B5 LOCKED: "Help Desk" is the placeholder site name. FUTURE (not v1): the help form will later live on the official company website, so ticket submission must stay reachable through the public API and the branding/name must stay configurable.
- B6 LOCKED: No customer emails on cancel, admin reopen of a Closed ticket, or restore of a Cancelled ticket.
- B7 LOCKED (for now; revisit when more roles are in use): New-ticket alerts go to every active Administrator. Reply and reopen alerts go to the assignee, or to all Administrators if the ticket is unassigned.
- B8 LOCKED: Customer emails include the support reply text. Internal information never goes in any email.
- B9 LOCKED: Staff can correct a customer's email address. The change is logged in ticket history.
- B10 LOCKED (amends R4): No privacy notice or acknowledgement in v1/beta; Brandon will handle privacy policy and terms when the company is formed. Build the notice link + required checkbox so it can be switched on later through configuration. R4's export/delete tools and the no-tracking-cookies rule still apply.
- CONTEXT: Brandon is starting a software development company in Georgia (US). It isn't registered or named yet, so all company names, branding, and legal text must be configurable placeholders.

## Team decisions by Project Lead (Oct 6, 2026; conflict resolution only, none overrides a LOCKED item; Brandon may veto)
- T1: Closed and Cancelled tickets are read-only for staff (no priority, status, assignment, or reply changes) until an Admin reopens or restores them. Internal notes can still be added (baseline §11: "internal notes remain available at all times").
- T2: The reopen-window setting (P20) is capped at 1-14 days so links never outlive R9's 14-day maximum. Auto-close follows the same setting.
- T3: The per-email lookup rate limit is 3/hour (the stricter of the two ARCH figures).
- T4: Wording source of truth is EMAIL_AND_WORDING.md for email text and DESIGN.md for screen copy, both updated to match R9 and ARCH. ARCH governs mechanics (monitored Reply-To mailbox; a staff reply on a Resolved ticket emails the customer). Subject style: one fixed subject per ticket so Gmail threads it.
- T5: The confirmation page shows the email address in full so the customer can catch typos. It's shown only to the person who just typed it.
- T6: A new From address isn't saved until a test email succeeds. On failure, show the error and keep the previous sender.
- T7: An upload request over the limit is rejected entirely with a clear message; the Architect picks the error code.
- T8: The Project Lead signs off on R7 and PROJECT GOAL, using a running log of every human step Brandon performed. Brandon gives final acceptance at user testing.
- T9: Every link lifetime can stay configurable, but the server refuses any value over 14 days at startup and in settings, enforcing R9.
- T10: Only the customer ticket-event emails share the per-ticket subject so they thread. Lookup and "email me a new link" emails get their own subject, and admin alerts use the `[Help Desk] <Event> <ID>: <subject>` format (per EMAIL_AND_WORDING).
- T11: B8's "no internal information in any email" covers customer-facing emails, which is where the question was asked. Staff alerts go to internal users and may show status, priority, assignee, and the impact hint, but never internal note text.
- T12: After a B9 email correction, the system revokes the old links and resends the confirmation to the new address.
- T13: B6 also covers cancellations made by staff, so the customer gets no email for those either.
- T14: A customer cancel sends a staff alert, routed by the B7 rule (assignee, or all Admins if unassigned).
- T15: Staff alerts include a preview of the customer's message (first ~500 characters) plus a link to open the ticket, because a `helpdesk://` link may not be clickable in Gmail. The Architect should provide a clickable https link that opens the app or explains how to open the ticket.
- T16: Every email sent outside production gets a `[TEST]` subject tag.
- T17: The T6 test email goes to the signed-in admin's own address. v1 has no automated bounce processing; bounces land in the monitored mailbox.
- T18: Default link lifetimes follow ARCH: lookup link 60 minutes, notification links 7 days, reopen link until auto-close. All of them are capped at 14 days (R9/T9). EMAIL_AND_WORDING copy must match.
- T19: Alert previews cut at the last word boundary at or before character 500, and a single word longer than 500 is hard-cut at 500. The "…" is appended and not counted.
- T20: A manual Windows debug build that publishes nothing is allowed under B1. The Engineer triggers it only when needed.
- T21: The default sender display name is "Help Desk". All size limits use binary units (10 MB = 10,485,760 bytes; 512 KB = 524,288 bytes).
- T22: Adopt the Designer's defaults: customer timeline labels "You" / "Support team" / "Status changed to..." (OQ-17); WCAG 2.2 AA (OQ-21); users are deactivated, never deleted, and the last active Admin is protected (OQ-26); products can be added, renamed, or turned off, never deleted, with no "Other" (OQ-35, consistent with Q6); staff can't edit the customer's name or the product in v1, only the email per B9 (OQ-41); the audit log page per DESIGN (OQ-43). Staff replies are signed "Support team" (EMAIL PROPOSED-20). CAPTCHA covers both submit and lookup (EMAIL PROPOSED-5).
- T23: Customer-facing term is "ticket number" everywhere (screens and emails), matching the baseline's "ticket reference number".
- T24: After an email correction, privacy export and delete for an address also find tickets that previously used that address (ARCH G37 wins; privacy-protective).
- T25: When staff reply on a Resolved ticket, the email carries the main ticket link (7 days) and the reopen link (valid until auto-close).
- T26: Clarifies T22/T23. (a) Customers see "ticket" everywhere, never "request" (screens, emails, subjects). (b) "Support team" is the author label for staff messages, on screen and in the quoted reply inside emails; individual staff names are never shown to customers. Customer emails are still signed with the configurable sender name (default "Help Desk", T21). (c) Admins can't edit a staff user's email in v1, matching ARCH and AC RC-16. To fix a wrong email, deactivate the user and create a new one.
- T27: The unread indicator in the Windows app (Q3 PROPOSED) is in v1; every doc already builds it.
- T28: T27 includes an app-level badge as well as the per-ticket "● Needs attention" flag (renamed from "Customer replied" under T34; W-06 shows the reason). The Windows app shows the number of tickets marked needs_attention that the signed-in user can see, as a taskbar badge and in the window title. It is hidden when the count is 0.
- T29: EMAIL_ALERT_PREVIEW_CHARS must be between 100 and 500. The server refuses to start on any value outside that range, with a clear error, the same way it already handles values over 500.
- T30: PR and commit titles use Conventional Commits (IMPLEMENTATION_PLAN Q-P1).
- T31: All bots share one GitHub identity: Cursor's GitHub connection on Brandon's account. Reviews are therefore `REVIEW <role>: APPROVED` comments, not GitHub approvals.
- T32: Beta bug reports: Brandon describes the problem to the Project Lead in chat, with a screenshot if he can. The Project Lead files a GitHub issue and routes it to the Engineer. The plan includes a one-command support bundle on the VM (version, health status, recent logs with secrets redacted) that Brandon can run and send when asked. Each run counts as a human step in HUMAN_STEPS_LOG.
- T33: Adopts DESIGN OQ-48. When more than 99 tickets need attention, the badge shows "99+" and the window title shows "(99+) {site name}". While the count is unknown, there is no badge and the title is just "{site name}".
- T34: What sets and clears needs_attention, so every doc and the T28 badge count the same thing. A ticket is flagged when it is newly created, when the customer replies, or when the customer reopens it. The flag clears when staff send a public reply, change the ticket's status, or use "Mark as seen". Just opening a ticket, or adding an internal note, does NOT clear it.
- T35 (settles ARCH G53): Any move into Closed or Cancelled clears needs_attention automatically, whether it's an auto-close, a customer cancel or a staff action. Closed and Cancelled tickets never count toward the badge, so T1's read-only rule stays as it is, with no Mark as seen on them. A customer cancel still alerts staff (T14). Also confirmed: accepting or assigning a new ticket moves it to Open, which is a status change, so it clears the flag. That's intended, because someone has picked the ticket up.
- T36 (AC OQ-19): When auto-close or a customer cancel clears needs_attention, the history entry's actor is "System". The cancel entry itself is still credited to the customer.
- T37 (AC OQ-20): Alert subjects cut at 60 characters follow T19's rule: cut at the last word boundary at or before character 60, hard-cut a single longer word, and add "…", which isn't counted.
- T38 (AC OQ-21): ADR 0018 wins, so there are no pre-releases of any kind. Remove "desktop-edge" from ARCH §20. Windows testing between releases uses the manual debug build (T20).
- T39 (AC OQ-22): For SUPPORT_BUNDLE_DIR and --to, symlinks are resolved to the real path before the backup-target check. A bad value is refused both at startup and when the command runs, as the plan already says.
- DEFERRED: alerts to a separate or +alerts address (EMAIL PROPOSED-36) and go-live domain/email authentication (PROPOSED-41/42) are revisited at go-live.
- Naming: threat-model rows are renamed TM-n (no fixed upper bound) so they don't collide with team decisions T-n.
- DEFERRED to go-live: the live sender address and display name, and the company/site names (Brandon hasn't picked them yet).

## Architecture items (deferred to Phase 2; listed so nothing is missed)
Language/framework, database, API style (must serve Windows + future Android + web), Windows UI framework, hosting, email provider, file storage + malware scanning, internal auth provider, background job for auto-close, repo/Git workflow (GitHub or Cursor Origin), CI/CD, testing frameworks.

## Decisions log
| Date | Item | Decision | By |
|------|------|----------|----|
| Oct 6, 2026 | Q1 lookup verification | Reference # + email, emailed secure link | Brandon |
| Oct 6, 2026 | Q2 customer email | Outbound only, replies via website | Brandon |
| Oct 6, 2026 | Q3 admin alerts | Email to admin | Brandon |
| Oct 6, 2026 | Q4 attachments | Proposed default accepted | Brandon |
| Oct 6, 2026 | Q5 hosting | Self-hosted Docker on Linux; Ubuntu VM pre-launch | Brandon |
| Oct 6, 2026 | Q6 products | Device Monitor only at launch | Brandon |
| Oct 6, 2026 | H1-H4 hosting follow-ups | Personal domain pre-launch; VPS at go-live; nightly backups | Brandon |
| Oct 6, 2026 | Round 2 P1-P24 (except P11) | Accepted with changes to P1, P8, P18, P22 | Brandon |

| Oct 6, 2026 | Round 3 R1-R8 | All proposed defaults accepted; Gmail SMTP first (swappable); no MFA; no coding knowledge; GitHub | Brandon |
| Oct 6, 2026 | Phase 1 | Closed; requirements sufficiently defined | Project Lead |
| Oct 6, 2026 | R9 link lifetime | Secure links valid up to 14 days | Brandon |
| Oct 6, 2026 | R10 test sender | support.trouthomelab@gmail.com for testing only | Brandon |
| Oct 6, 2026 | Round 5 B1-B10 | Private repo (public OK later); self-managed beta backups with auto-backup to a location; no code signing; no emails on cancel/reopen/restore; reply text in emails; staff can fix customer email; privacy notice deferred | Brandon |
