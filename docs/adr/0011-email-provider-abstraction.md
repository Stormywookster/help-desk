# ADR 0011: Swappable outbound email (Gmail SMTP now, Amazon SES later)

**Status:** Accepted (Oct 6, 2026). Revised Oct 6, 2026 for Round 5 (B1–B10) and team decisions (T1–T27).

## Context
Outbound email only (Q2). Start with a Gmail-style mailbox over SMTP; moving to SES or another provider must be a configuration change (R5). Principle: start small, expand later. R10: during testing `support.trouthomelab@gmail.com` is both the mailbox and the From address; the live address doesn't exist yet and must be easy to switch at go-live.

## Decision
- An `EmailTransport` interface; implementations `smtp` (Nodemailer) and `log` (dev). Selected by `EMAIL_TRANSPORT`. Optional `ses-api` later.
- **Gmail:** `smtp.gmail.com:587` STARTTLS, full address as username, **App Password** (requires 2-Step Verification). Respect Gmail limits (about 500/day personal, 2,000 Workspace) with `EMAIL_MAX_PER_DAY=400` and queueing.
- **SES later:** SES SMTP interface, so only `SMTP_*` and `EMAIL_FROM_ADDRESS` change; domain DKIM/SPF/DMARC set up at that time.
- **Sender changes (T6, T17):** a new From address is saved only after a test email, sent through the configured transport **to the signed-in Admin's own address**, succeeds; on failure the error is shown and the previous sender stays. The address must be the mailbox or a verified "Send mail as" alias.
- **Sender name:** default "Help Desk" (T21). Quoted staff replies in customer emails are labelled "Support team"; no staff name, user ID, or staff email address appears in any customer email (T26b). Customer copy says "ticket", never "request" (T23, T26a).
- **Links per email (T25):** a staff reply on an already-Resolved ticket carries both `{{secure_link}}` (notification, 7 days) and `{{reopen_link}}` (until auto-close); see ADR 0008.
- **Content rules:** reply text always included in customer emails, and no internal information in customer emails (B8, scoped by T11); no customer email on cancel, Admin reopen, or restore (B6); fixed subject per ticket for customer ticket-event emails, separate subjects for lookup/new-link emails, alerts `[{site_name}] <Event> <ID>: <subject>` (T4, T10); Reply-To is a monitored mailbox (T4). Branding values (site name, company name, sender display name, portal URL) are template variables, never literals (B5).
- **Alert routing (B7, T14):** new ticket → all active Administrators; customer reply/reopen/**cancel** → assignee, or all Administrators if unassigned. One function in `packages/shared`, run by the `staff-alert` worker job.
- **Staff alert content (T11, T15):** may show status, priority, assignee, impact hint, customer name/email, and a preview of the customer's message cut per **T19** (whitespace collapsed; text over 500 characters is cut at the last word boundary at or before character 500, a single word longer than 500 is hard-cut at 500, then "…" is appended and not counted; always on; `EMAIL_ALERT_PREVIEW_CHARS` can't exceed 500); never internal note text or customer secure links. Wording: EMAIL_AND_WORDING A1–A5 (T14). Every alert carries an https "Open ticket" link to `/open/ticket/{reference}`, a static hand-off page that tries `helpdesk://`, offers a button, a search fallback, and a download link, and shows only the reference. Raw `helpdesk://` links aren't used in emails because Gmail may not make them clickable.
- **`[TEST]` tag (T16):** outside production, a `TestTagTransport` decorator, always applied by the transport factory (the only way to obtain a transport), prefixes every subject with `EMAIL_TEST_SUBJECT_TAG` (default `[TEST]`). Nothing can bypass it, and it is a no-op in production.
- **Bounces (T17):** no automated processing in v1; they land in the monitored mailbox.
- Dev/test emails go to **Mailpit**; E2E tests read secure links from it.

## Alternatives considered
- **Transactional providers' HTTP APIs (Postmark, Resend, SendGrid):** good deliverability, but accounts/costs and provider-specific code; SMTP keeps them all reachable by config anyway.
- **Running our own mail server (Postfix):** deliverability problems, especially from home/VPS IPs.
- **Gmail OAuth2 (XOAUTH2):** more secure than App Passwords but needs a Google Cloud project and consent setup: too many human steps for v1.

## Consequences
- Switching providers is about five lines in `.env` + restart, and the `[TEST]` tag follows automatically because it wraps every transport.
- With an `@gmail.com` sender, From is fixed to that mailbox (or verified alias).
- If Gmail's daily limit is reached, emails are delayed, not lost.
