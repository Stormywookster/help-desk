# Help Desk: Requirements Discovery Log

**Owner:** Project Lead | **Product owner:** Brandon Trout | **Phase:** 1, requirements discovery (no architecture or code yet)
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
- **Q3 LOCKED, admin alerts:** The system emails the admin on new tickets, customer replies, and reopens. *PROPOSED (pending confirmation): also an unread indicator in the Windows app.*
- **Q4 LOCKED, attachments:** Both directions. Images, PDF, plain text/log files, ZIP. 10 MB per file, 5 files per message. Malware scan before staff can open. Kept for the life of the ticket.
- **Q5 LOCKED, hosting constraints:** Self-hosted. Runs in Docker container(s) on a Linux server shared with other services. Pre-launch development/staging on an Ubuntu VM; a dedicated Linux Mint machine on Brandon's local network is an option if needed. No paid cloud platform assumed. *OPEN follow-ups: domain, how the public site is exposed to the internet, outbound email sending method, backups.*
- **Q6 LOCKED, products:** Launch with Device Monitor only. *PROPOSED: keep the admin-managed product list in the data model so more products can be added later; when only one product exists, the form pre-selects it and hides the dropdown. No "Other" option at launch.*

## Round 1.5: hosting follow-ups (asked Oct 6, 2026)
- H1 OPEN: Domain for the public support site (existing domain/subdomain, or buy one)? - I will purchase one when it goes live, in the mean time i have a personal one we can use if needed
- H2 OPEN: How customers reach a home-hosted site from the internet. Proposed: a tunnel service (e.g. Cloudflare Tunnel, free) so no ports are opened on the home router; alternative is port forwarding behind an existing reverse proxy. - when goes live will be on a vps
- H3 OPEN: Outbound email method. Home internet IPs are usually blocked by mail providers, so proposed: send through a transactional email service on its free tier, or an existing mailbox's SMTP. Need the sending address. - Clarify question
- H4 OPEN: Backups. Proposed: nightly database + attachment backup to a second location Brandon controls. - agree

## Round 2: needed before Phase 1 closes (proposed defaults Brandon can accept in bulk)

**Workflow / lifecycle (§10, §11)**
- P1 PROPOSED: A customer reply on a **Resolved** ticket counts as a reopen (back to Open) while inside the 14-day window. *(Baseline only says the customer "may reopen"; it doesn't say whether replying does it.)* - the ticket must be intentionally reopened, I don't want a ticket reopening for a "thank you" message
- P2 PROPOSED: A customer reply on **New / Open / In Progress** adds the message with no status change and flags the ticket "customer replied" internally. - agree
- P3 PROPOSED: Customers can cancel while New, Open, In Progress, or Waiting on Customer. Not from Resolved (it closes on its own), Closed, or Cancelled. *(§11 says "eligible" without defining it.)* - agree
- P4 PROPOSED: Auto-close fires 14 x 24 hours after the most recent move into Resolved; a reopen resets the clock. Checked at least hourly. - agree
- P5 OPEN: Is there a cap on how many times a customer can reopen? - no
- P6 PROPOSED: Waiting on Customer has no automatic timeout in v1 (staff resolve manually). - agree
- P7 PROPOSED: When Admin reopens a Closed ticket or restores a Cancelled one, it goes to Open. *(Baseline doesn't name the target state.)* - agree
- P8 PROPOSED: Customer gets an email when the ticket is Resolved (with "reopen" link) and when auto-Closed. - agree, with the expection of closed, they don't need to get 2 emails, a resolved then closed

**Submission form (§7, §13, §19)**
- P9 PROPOSED: Fields: name (optional), email (required), product (required), subject (required, max 150 chars), description (required, max 10,000 chars), customer-reported impact (optional), attachments (optional). Categories: none in v1. - agree
- P10 PROPOSED: Customer impact field: "Just a question / Something isn't working / I can't use the product at all". Visible to staff only as a hint; never sets priority. - agree
- P11 PROPOSED: Internal priority: Low, Normal (default), High, Urgent.
- P12 PROPOSED: Spam protection: CAPTCHA plus rate limiting per IP and per email. - agree
- P13 PROPOSED: Reference number: non-sequential, human-friendly, e.g. `HD-7K3M9Q` (no ambiguous characters). Doesn't reveal ticket volume. - agree

**Internal operations (§5, §19)**
- P14 PROPOSED: Search by reference #, customer email, subject/body text. Filter by status, priority, product, assignee, date range. Default view: my open tickets + unassigned New.- agree
- P15 PROPOSED: No dashboard/reporting in v1 beyond counts per status in the main view. - agree
- P16 PROPOSED: Out of v1 (designed not to block later): knowledge base, SLAs/escalation, canned responses, satisfaction surveys, Agent role UI. - agree
- P17 PROPOSED: Agent role is modeled now (role-based permissions in the backend) but only Administrator is usable in v1. Admin-only actions: settings, user management, reopen Closed, restore Cancelled, hard delete. - agree
- P18 PROPOSED: Initial Administrator created by a one-time setup step on first run; MFA required for internal users. - no MFA for now for other internal users, users can only be intentionally created by me with a password set, I can manage users and reset passwords
- P19 OPEN: Admin account recovery if the only admin loses access. (Proposed: a documented server-side recovery procedure, no self-service reset with only one admin.) - agree
- P20 PROPOSED: Admin-configurable settings in v1: product list, support email sender name/address, reopen window length (default 14 days), attachment limits. - agree

**Data / privacy (§12, §16, §19)**
- P21 PROPOSED: Keep tickets, history, and attachments indefinitely in v1. Admin can permanently delete a ticket (for privacy requests); deletion itself is logged without content. - agree
- P22 OPEN: Are any customers in the EU/UK or California such that formal data-subject requests (GDPR/CCPA) must be supported at launch? - unknown, app is internet hosted so possibly, assume worst case
- P23 PROPOSED: Audit history is append-only and never editable, including by Admin. - agree
- P24 PROPOSED: Customer-visible history shows: submitted, replies (both sides), status changes in customer terms. Hides assignment, priority, internal notes. - agree except internal notes, those should stay internal

## Assumptions (true unless Brandon says otherwise)
- A1: English only, one support timezone (America/New_York) for display. - true
- A2: Windows app requires an internet connection; no offline mode. - true
- A3: Customer-visible status names match the internal lifecycle names (could be softened, e.g. "Received" for New, if Brandon prefers). - agree
- A4: Brandon is the initial Administrator and the only internal user at launch. - true
- A5: Public website must work on phones as well as desktop. - true

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
