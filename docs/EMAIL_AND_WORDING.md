# Help Desk: Email Templates and Wording

**Author role:** Help Desk Support Ops | **Product owner:** Brandon Trout | **Last updated:** 2026-10-06 (reconciliation pass)
**Status:** **Single source of truth for all email text (T4).** Screen copy lives in `DESIGN.md`; mechanics (sending, links, jobs) live in `ARCHITECTURE.md`. Where an email template in `DESIGN.md` §3.14/§4.16 differs from this file, this file wins for wording (T4).
Decision IDs (Q/H/P/R/B/T/A) refer to `REQUIREMENTS_DISCOVERY.md`; § numbers refer to the baseline unless prefixed "ARCH" (`ARCHITECTURE.md`) or "DESIGN".

Status labels used below: **RESOLVED** (with the deciding ID), **SUPERSEDED** (replaced by a later decision), **DEFERRED** (parked until go-live), **OPEN** (still needs a decision). Nothing has been deleted; resolved items stay listed with their outcome.

---

## 0. Change log

**2026-10-06, pass 5** (CONSISTENCY_REPORT CR-17 to CR-22; decisions T22, T23, T25, T26a, T26b; ARCH G35):
- **CR-17 (T22, T26b):** Sign-offs are **unchanged**. Every customer email is still signed `{{sender_name}}` (default "Help Desk", T21). "Support team" is now the **author label on every quoted staff reply** in C3, C4, and C5 ("Support team wrote:"). Checked: no customer template or customer-safe variable carries an individual staff name. Staff alerts may still show the assignee (T11). PROPOSED-20 RESOLVED by T22/T26b (section 8.2 and the index).
- **T26a:** Customers see "ticket", never "request". Customer subject is now `Your {{product_name}} support ticket`. C1 and C5 wording is fixed.
- **T23:** Checked. Customer-facing text uses only "ticket number" (no "reference" or "ticket ID"). Variable names are unchanged.
- **CR-18 (T22):** The CAPTCHA-on-lookup part of PROPOSED-5 is RESOLVED by T22 (CAPTCHA covers both submit and lookup).
- **CR-19:** PROPOSED-36, 41, and 42 changed from OPEN to **DEFERRED (go-live)** (REQUIREMENTS "DEFERRED" entry). PROPOSED-33 and 45 now read as **later features (not v1)**.
- **CR-20:** Section 10 item 8 RESOLVED. DESIGN no longer says "72 hours". OQ-16 unchanged.
- **CR-21:** The OQ-2 auto-reply part now reads SUPERSEDED (T4/T17), matching the other mentions.
- **CR-22 (ARCH G35):** The `{{company_name}}` default is now **"Your Company"** (a setting; live value DEFERRED). Added a go-live checklist (section 11) requiring it to be set before production. The "drop lines that use it if empty" rule still applies if an admin clears the value. No current template uses `{{company_name}}`.
- **T25:** Confirms the C3 two-link design on Resolved tickets (main link 7 days, reopen link until auto-close). Cited in C3; nothing else changed.

**2026-10-06, pass 4** (against T18, T19, T21 and ARCH §6.6 / §11):
- **T18:** Default link lifetimes now follow ARCH: lookup link **60 minutes**, notification links **7 days** (confirmation, support reply, Waiting on Customer, the new-link email, and the resend after an email correction), and the reopen link **until auto-close**. 14 days is the **cap**, not the default (R9/T9). Expiry lines, the glossary, and the rules table are updated. OQ-16 RESOLVED; R9 notes corrected.
- **ARCH §6.6:** The alert link is now `{{admin_open_url}}` = `https://<server>/open/ticket/HD-XXXXXX`, a hand-off page that tries the app and falls back to "search for the ID". No template shows `helpdesk://` any more. `{{admin_ticket_url}}` is renamed to `{{admin_open_url}}`.
- **T19:** The ~500-char customer-message preview is **always on** (not a setting). The glossary now carries T19's exact cut rule.
- **T21:** Default sender display name is **"Help Desk"**. The live address and live display name stay DEFERRED.
- **T21 (units):** The size note uses binary units (10 MB = 10,485,760 bytes).
- **Status tags:** PROPOSED-32/46/47/48 now cite their deciding IDs, and every item in the section 10 gaps list is marked RESOLVED or tied to the decision that covers it. PROPOSED-14's auto-reply part is SUPERSEDED by T4/T17.
- **Alert footer:** now reads "Or open the {{site_name}} app and search for {{ticket_id}}" (ARCH §11).

**2026-10-06, pass 3** (against Team decisions T11–T17 and the DEFERRED entry):
- **T11:** B8's no-internal-info rule covers customer emails only. Staff alerts now show status, priority, assignee, and impact again, but never internal note text. Glossary 4.2/4.3 fixed. OQ-14 RESOLVED; PROPOSED-37 RESOLVED.
- **T12:** After a B9 email correction, old links are revoked and C1 is resent to the new address. OQ-15 RESOLVED, and the PROPOSED-32 resend part RESOLVED.
- **T13:** Staff cancels send no customer email. OQ-17 RESOLVED.
- **T14:** New alert **A5 "Cancelled by customer"**, routed per B7. OQ-9 and PROPOSED-46 RESOLVED.
- **T15:** Every ticket alert (A1–A5) now includes a ~500-character preview of the customer's message and a clickable **https** link to the ticket (`{{admin_ticket_url}}`; the Architect builds the mechanics). The `helpdesk://` link is no longer in the templates, and the "search for the ID" fallback stays. OQ-11, PROPOSED-17, and PROPOSED-47 RESOLVED.
- **T16:** Every email sent outside production gets a `[TEST] ` subject tag (`{{test_tag}}`). PROPOSED-48 RESOLVED.
- **T17:** The S1 test email goes to the signed-in admin's own address. v1 has no automated bounce processing; bounces land in the monitored mailbox. PROPOSED-32 (bounce part) RESOLVED (manual only).
- **DEFERRED:** OQ-5 (live sender address and display name) and OQ-18 (company and site names) are deferred to go-live.

**2026-10-06, reconciliation pass** (against Round 4 R9/R10, Round 5 B1–B10, Team decisions T1–T10, ARCH §4/§8/§11/§19):
- **B8:** Support-reply emails now always include the reply text. Waiting on Customer / Resolved emails include it when they were sent with a reply. The glossary gained a "never in any email" list. PROPOSED-16 (link-only default) is SUPERSEDED.
- **B8 (interpretation):** "Internal information never goes in any email" is applied to admin alerts too, so priority and assignee were removed from the alert bodies. Confirmation is OQ-14.
- **B6:** Section 6 now says explicitly that there are no customer emails on cancel (customer or staff), admin reopen of a Closed ticket, or admin restore of a Cancelled ticket. OQ-8 RESOLVED.
- **B7:** Each alert now has its recipients set: new ticket → every active Administrator; customer reply, reopen, reply on Resolved → the assignee, or every active Administrator if unassigned. OQ-3 and PROPOSED-35 RESOLVED.
- **T4 (+ ARCH §4):** A staff reply on a Resolved ticket emails the customer. The "last email" line in C5 was rewritten, and C3 got a Resolved-ticket block. OQ-6 and PROPOSED-27 RESOLVED.
- **T4/T10:** One fixed subject per ticket for customer ticket-event emails. Lookup and fresh-link emails get their own subjects. Admin alerts use `[Help Desk] <Event> <ID>: <subject>`. PROPOSED-8 RESOLVED, PROPOSED-9 SUPERSEDED.
- **T10 / ARCH §8:** Added **C2b "Fresh link"** (the "Email me a new link" email) with its own subject.
- **R9/T9/T2:** Customer secure links (lookup, notification, reopen) default to 14 days and can never be set longer. *(Corrected in pass 4: 14 days is the cap, not the default; defaults are set by T18.)* The reopen window is 1–14 days and auto-close follows it. PROPOSED-1 SUPERSEDED. OQ-1 and OQ-7 RESOLVED.
- **R10:** The test sender is `support.trouthomelab@gmail.com` (test only). The sender stays configurable (P20, T6), and everything sent during testing is test data. OQ-5 partly resolved.
- **B10:** Removed the privacy-notice footer from every template. PROPOSED-22 SUPERSEDED, OQ-13 SUPERSEDED.
- **B5 / CONTEXT:** No invented names anywhere. Added `{{site_name}}` (default "Help Desk", B5) and `{{company_name}}` (placeholder, unset). *(Pass 5: default is now "Your Company" per ARCH G35.)*
- **ARCH:** Applied ARCH mechanics to the templates: monitored Reply-To (T4), `helpdesk://` alert link (OQ-4), reopen can carry an optional message and keeps the assignee (OQ-10), one email per combined action (OQ-12).
- **T3:** Lookup emails are limited to 3 per hour per email address. Recorded in C2a.
- **T5:** The confirmation page shows the email in full. PROPOSED-31 RESOLVED.
- **B9:** Staff can correct a customer's email (logged). PROPOSED-32 partly resolved; the follow-up emails are OQ-15.
- **New:** Added section 7b with system emails that ARCH requires but that had no wording yet: test email (T6), account lockout alert, system health alert.
- **New:** Added OQ-14 to OQ-18 and PROPOSED-47 and PROPOSED-48. Updated the conflicts list (section 10).

---

## 1. Purpose

This doc holds the exact wording, trigger, recipients, and variables for every email the Help Desk sends in v1. It also has a practicality review from the customer's side and the technician's side. Developers build the templates straight from this file.

## 2. Source docs (in order of authority)

1. `REQUIREMENTS_DISCOVERY.md`: authoritative (LOCKED items, R9/R10, B1–B10, T1–T26).
2. `ARCHITECTURE.md`: mechanics of sending, links, jobs (team-owned ARCH decisions).
3. `HELP_DESK_PRODUCT_REQUIREMENTS_BASELINE.md`: the baseline.
4. `DESIGN.md`: screen copy (its email drafts are replaced by this file, T4).
5. `brandon-answers-round2-2026-10-06.md`: Brandon's verbatim Round 2 answers (a historical record, not authoritative).

## 3. Rules that shape these emails

| Rule | Source |
|---|---|
| Ticket ID is non-sequential, like `HD-7K3M9Q` (not a secret; access always needs a link) | P13, ARCH §4 |
| Lookup: reference # + email gets a secure link emailed to that address. Every customer email carries the ticket's secure link | Q1 |
| Default link lifetimes: **lookup link 60 minutes**; **notification links 7 days** (confirmation, support reply, Waiting on Customer, new-link email, resend after an email correction); **reopen link until auto-close**. All configurable, and **14 days is the hard cap** (R9 counts 14 days as "short-lived"); the server refuses anything longer | T18, R9, T9, ARCH §8/§11 |
| Reopen window is 1–14 days (default 14). Auto-close follows the same setting, fixed at the moment of resolution | P20, T2, ARCH §4 |
| Customer emails: confirmation, each support reply, Waiting on Customer, Resolved | Q2, P8 |
| **Every** customer-visible staff reply emails the customer, including on Resolved tickets | Q2, T4, ARCH §4 |
| Customer emails **include the support reply text**. **Internal information never goes in any email** | B8 |
| **No email** on auto-close | P8 |
| **No customer email** on cancel (customer or staff), admin reopen of Closed, or admin restore of Cancelled | B6, T13 |
| After a staff email correction: old links revoked, C1 resent to the new address | B9, T12 |
| A reply plus a status change in one staff action sends **one** email (the status email, with the reply included) | ARCH §4/§11 |
| No inbound email processing. Reply-To is the monitored sending mailbox, and every customer email says replies aren't added to the ticket | Q2, T4, ARCH §11 |
| Admin alerts: new ticket, customer reply, customer reopen, customer reply on Resolved, customer cancel | Q3, R1, T14 |
| Alert recipients: new ticket → every active Administrator; reply, reopen, and customer cancel → the assignee, or every active Administrator if unassigned (or the assignee is inactive, ARCH §11) | B7, T14 |
| Staff alerts may show status, priority, assignee, and impact, but **never internal note text**. The no-internal-info rule (B8) covers customer emails | T11 |
| Staff alerts always include a ~500-char preview of the customer's message (cut per T19; not a setting) and the https open link `https://<server>/open/ticket/HD-XXXXXX` (never a raw `helpdesk://` link) | T15, T19, ARCH §6.6 |
| Every email sent outside production gets a `[TEST]` subject tag | T16 |
| No automated bounce processing in v1; bounces land in the monitored mailbox | T17 |
| Customer-reply alerts are combined: at most one per ticket per 10 minutes | ARCH §11 |
| Subjects: one fixed subject per ticket for customer ticket-event emails; lookup and fresh-link emails have their own subjects; alerts use `[Help Desk] <Event> <ID>: <subject>` | T4, T10 |
| Reply on Resolved: message added, stays Resolved, clock keeps running. Closed is read-only | R1 |
| Reply on Waiting on Customer returns the ticket to Open | §10, §11 |
| Reopen: deliberate button press, optional message, assignee kept, unlimited | P1, P5, ARCH §4 |
| Customer can cancel from New / Open / In Progress / Waiting on Customer | P3 |
| Customers never see internal notes, priority, or the assigned technician. Individual staff names are never shown to customers | §6, §8, P24, T26b |
| Customer-facing wording: "ticket" (never "request") and "ticket number", in bodies **and subjects** | T23, T26a |
| Customer emails are signed `{{sender_name}}` (default "Help Desk"). Quoted staff replies inside emails carry the author label **"Support team"** | T22, T26b, T21 |
| CAPTCHA covers both the submit form and the lookup form | T22 |
| Attachments are never emailed (downloads only, after a clean malware scan). Size limits use binary units: 10 MB = 10,485,760 bytes | Q4, ARCH §9, T21 |
| Statuses shown to customers use the internal names | A3 |
| English; times in ET, labeled "ET" | A1, ARCH G19 |
| Test sender and From: `support.trouthomelab@gmail.com`. Not the live address. Easy to change. Test sends are test data. Default sender display name: **"Help Desk"**. The live address and live display name are DEFERRED to go-live | R10, T21, DEFERRED |
| A new From address is saved only after a test email succeeds | T6 |
| No privacy notice in v1 (switchable later); export/delete tools and no-tracking rule still apply | B10, R4 |
| Company has no name yet. Branding and names are configurable placeholders; "Help Desk" is the placeholder site name | B5, CONTEXT |
| Provider swappable by configuration (Gmail SMTP first) | R5 |

## 4. Variables glossary

### 4.1 Customer-safe variables (allowed in customer emails)

| Variable | Meaning | Notes |
|---|---|---|
| `{{ticket_id}}` | Reference number, e.g. `HD-7K3M9Q` | P13 |
| `{{greeting_name}}` | Customer's name, or `there` | P9 (name optional). Plain text, trimmed |
| `{{ticket_subject}}` | The customer's own subject (max 150) | Body only, never in the email subject line |
| `{{product_name}}` | e.g. `Device Monitor` | Q6; admin-managed |
| `{{site_name}}` | Site/brand name. Default `Help Desk` (placeholder) | B5; configurable |
| `{{company_name}}` | Company name. **Default `Your Company`** (ARCH G35; a setting, live value DEFERRED). Must be set before production (section 11). If an admin clears it, drop any line that uses it. No current template uses it | CONTEXT, B5, G35 |
| `{{sender_name}}` | Sender display name **and the sign-off on every customer email**. **Default `Help Desk`** (T21, T26b). It's a settings value, not hard-coded text; the live name is DEFERRED. It must never be a person's name (T26b) | P20, T21, T26b |
| `{{sender_address}}` | From address. **Testing:** `support.trouthomelab@gmail.com` | R10, T6 |
| `{{secure_link}}` | The ticket's secure link (`https://<domain>/t#<token>`) | Q1, ARCH §8 |
| `{{secure_link_expires_at}}` | When **this email's** link expires, in ET, e.g. `Oct 13, 2026, 3:00 PM ET`. Defaults by link type: lookup = sent + 60 min; notification = sent + 7 days; reopen = `auto_close_at`. Never more than 14 days | T18, R9, T9 |
| `{{link_lifetime_text}}` | Human wording of the lifetime, e.g. `60 minutes` or `7 days`, taken from the setting (not hard-coded) | T18 |
| `{{reopen_link}}` | Secure link that opens the ticket page at the Reopen dialog. It never reopens on click. Valid **until `auto_close_at`** (T18), never more than 14 days | P1, ARCH §8, T18 |
| `{{reopen_window_days}}` | Reopen window, 1–14, default 14 | P20, T2 |
| `{{auto_close_at}}` | `resolved_at + reopen_window_days × 24 h`, in ET | P4, ARCH §4 |
| `{{lookup_page_url}}` | Public lookup page | Q1 |
| `{{new_ticket_url}}` | Public submission form | §2 |
| `{{support_site_url}}` | Public site root (domain chosen at go-live, H1) | H1 |
| `{{staff_reply_text}}` | **Full text of the customer-visible staff reply only.** Never an internal note. Always shown under the author label "Support team wrote:", never the staff member's name (T22, T26b) | B8, T22, T26b |
| `{{staff_attachment_count}}` | Number of files on that reply | Q4 |
| `{{test_tag}}` | `[TEST] ` outside production, empty in production. Prefixed to **every** email subject (customer, alert, system) | T16 |

### 4.2 Staff-alert variables (admin alerts only, never in customer emails)

| Variable | Meaning |
|---|---|
| `{{alert_recipients}}` | Set per B7 (see each alert) |
| `{{ticket_subject_short}}` | Customer subject cut to 60 chars for alert subject lines, per T37: cut at the last word boundary at or before char 60, hard-cut a single longer word, then add "…" (not counted) |
| `{{customer_name_or_none}}` | Name, or `(no name given)` |
| `{{customer_email}}` | Customer's email (customer-supplied contact data) |
| *(no variable)* | **No customer-safe variable carries a staff name.** `assignee_name_or_unassigned` is staff-alert only (T11, T26b) | T26b |
| `{{customer_impact}}` | Customer-chosen impact, or `Not given` (P10; hint only) |
| `{{ticket_status}}` | Current status (A3 names; visible to customers too) |
| `{{status_change_note}}` | e.g. `Moved from Waiting on Customer to Open automatically.` or empty |
| `{{attachment_summary}}` | e.g. `2 files (malware scan pending)` / `None` |
| `{{event_time}}` | When it happened, in ET |
| `{{resolved_at}}` | Last move to Resolved, in ET |
| `{{hours_until_close}}` | Hours left before auto-close |
| `{{priority}}` | Low / Normal / High / Urgent (R6). Allowed in alerts (T11) |
| `{{assignee_name_or_unassigned}}` | Current assignee, or `Unassigned`. Allowed in alerts (T11) |
| `{{previous_status}}` | Status just before a cancel (A5) |
| `{{admin_open_url}}` | The https open link, URL pattern `https://<server>/open/ticket/HD-XXXXXX` (ARCH §6.6). The page tries the app hand-off, offers an "Open in the {{site_name}} app" button, and falls back to "search for the ID". It shows only the reference number. It replaces any raw `helpdesk://` link (T15) |
| `{{message_preview}}` | **Always included** (T19; not a setting). The **customer's** own message for that event: the description (A1), the reply (A2, A4), the optional reopen message (A3), or the optional cancel reason (A5). Plain text, whitespace collapsed, HTML-escaped (ARCH §11). **Cut rule (T19):** if longer than 500 characters, cut at the last word boundary at or before character 500; a single word longer than 500 is hard-cut at 500. Then append `…`, which doesn't count toward the 500. Messages of 500 or fewer characters are shown whole, with no `…`. Empty message → `(no message)`. Never staff text and never internal notes (T11) |

### 4.3 What's excluded (B8, T11)

**Never in any email, customer or staff:** internal note text (T11).
**Never in customer emails (B8, §6, §8, P24):** internal notes; internal priority; assignee or any staff name; first-accepted-by and assignment history; internal flags (`needs_attention`, unread); audit-log internals; admin settings; malware signature names.
**Allowed in staff alerts (T11):** status, priority, assignee, impact hint, plus the customer's own text and contact details used by the templates below.
Formatting for every variable: plain text, HTML-escaped in the HTML part, CR/LF stripped from anything that goes into a header (ARCH §11).

## 5. Open questions

- **OQ-1, link lifetime:** RESOLVED by R9/T9 (14-day cap) and T18 (defaults: 60 min / 7 days / until auto-close).
- **OQ-2, customer hits Reply:** RESOLVED by T4 / ARCH §11 (Reply-To is the monitored sending mailbox, and emails say replies aren't added to the ticket). The auto-reply part is **SUPERSEDED (T4/T17)**: stray replies are checked by hand in the monitored mailbox (see PROPOSED-14).
- **OQ-3, alert recipients:** RESOLVED by B7.
- **OQ-4, alert link target:** RESOLVED by T15 + ARCH §6.6: `https://<server>/open/ticket/HD-XXXXXX` (`{{admin_open_url}}`), plus the "search for the ID" fallback line. (The earlier `helpdesk://` deep link is used only inside that page, never shown in an email.)
- **OQ-5, sender details:** RESOLVED for testing by R10 (`support.trouthomelab@gmail.com`). Default display name RESOLVED by T21 ("Help Desk"). The live address (and any live display name other than the default) is **DEFERRED** to go-live (REQUIREMENTS_DISCOVERY "DEFERRED" entry).
- **OQ-6, staff reply on a Resolved ticket:** RESOLVED by T4 / ARCH §4 (yes, it emails the customer).
- **OQ-7, reopen window vs auto-close:** RESOLVED by T2 (one setting, 1–14 days).
- **OQ-8, emails on cancel / admin reopen / restore:** RESOLVED by B6 (none).
- **OQ-9, admin alert on customer cancel:** RESOLVED by T14 (yes, routed per B7; see A5).
- **OQ-10, reopen details:** RESOLVED by ARCH §4 (optional message, assignee kept).
- **OQ-11, message text in email:** RESOLVED by B8 for customer emails (included) and by T15/T19 for staff alerts (~500-char preview, always on).
- **OQ-12, combined actions:** RESOLVED by ARCH §4/§11 (one email).
- **OQ-13, privacy notice URL/text:** SUPERSEDED by B10 (no privacy notice in v1).
- **OQ-14, does B8 cover staff alerts?** RESOLVED by T11: B8 covers customer emails only. Alerts may show status, priority, assignee, and impact, but never internal note text.
- **OQ-15, emails after a staff email correction (B9):** RESOLVED by T12: old links are revoked and C1 is resent to the new address. Nothing is sent to the old address; T12 doesn't call for it.
- **OQ-16, link lifetime defaults:** RESOLVED by T18. The ARCH defaults stand: lookup 60 minutes, notification 7 days, reopen until auto-close, all capped at 14 days (R9/T9).
- **OQ-17, staff cancel:** RESOLVED by T13 (no customer email for staff cancels either).
- **OQ-18, branding values:** **DEFERRED** to go-live (REQUIREMENTS_DISCOVERY "DEFERRED" entry; B5, CONTEXT). The values of `{{company_name}}`, `{{site_name}}` (default "Help Desk"), and `{{sender_name}}` stay placeholders until then.

---

## 6. Customer emails

**Shared conventions:**
- **From:** `{{sender_name}} <{{sender_address}}>`. During testing that's `support.trouthomelab@gmail.com` (R10). Never a staff member's name.
- **Reply-To:** the same monitored mailbox (T4, ARCH §11).
- **Subject (T4/T10, T16, T26a):** every ticket-event email (C1, C3, C4, C5) uses the same subject, `{{test_tag}}[{{ticket_id}}] Your {{product_name}} support ticket`, with `In-Reply-To`/`References` pointing at C1's Message-ID, so Gmail keeps one conversation per ticket. The first body line names the event, so it shows in the inbox preview. C2a and C2b have their own subjects.
- Plain text is the master copy. HTML is optional: single column, a button plus the raw URL under it, no images, no tracking pixels or tracked links (ARCH §11).
- Links sit on their own line. Attachments are never included.
- **Link lifetimes (T18):** each email states its own link's real expiry. Lookup link 60 minutes (C2a); notification links 7 days (C1, C2b, C3, C4); reopen link until auto-close (C5, and the Resolved block in C3). Never over 14 days (R9/T9).
- Sign-off: `{{sender_name}}` (default "Help Desk") on every customer email (T26b). **No privacy footer** (B10).
- **Quoted staff replies** are always introduced with the author label `Support team wrote:`, never a staff member's name (T22, T26b).
- **Wording (T23, T26a):** "ticket" and "ticket number" only. Never "request", "reference", or "ticket ID" in customer text.
- Never include anything from 4.3.

**`[TEST]` tag (T16):** every subject in this file starts with `{{test_tag}}`: `[TEST] ` outside production, nothing in production. Every subject line below includes it.

**Not sent, by decision:** an auto-close / Closed email (P8); any customer email on cancel, whether by the customer or by staff (B6, T13); admin reopen of a Closed ticket or admin restore of a Cancelled ticket (B6). In those cases a staff public reply is the way to contact the customer, and it sends C3 as usual (ARCH G6).

### C1. Submission confirmation

**To:** the email entered on the form. **Trigger:** ticket created (after CAPTCHA and rate limits, P12). Sent once per ticket, and again to the new address after a staff email correction (B9), at which point the old links are revoked (T12).

**Subject:** `{{test_tag}}[{{ticket_id}}] Your {{product_name}} support ticket`

```
Hi {{greeting_name}},

We got your message and opened a support ticket. Your ticket number is {{ticket_id}}.

Your ticket: "{{ticket_subject}}"

To check on it, add details or files, or reply to us, open your ticket here:
{{secure_link}}

This link works for {{link_lifetime_text}}, until {{secure_link_expires_at}}. Keep it private: anyone with it can see your ticket. Need a new one? Go to:
{{lookup_page_url}}
You'll need your ticket number and this email address.

Replying to this email won't add anything to your ticket. Please use the link above.

We'll email you when we reply.

{{sender_name}}

---
Someone opened a support ticket at {{support_site_url}} using this email address. If that wasn't you, you can ignore this email.
```

**Variables:** `ticket_id`, `product_name`, `greeting_name`, `ticket_subject`, `secure_link`, `link_lifetime_text`, `secure_link_expires_at`, `lookup_page_url`, `sender_name`, `support_site_url`
**Link:** notification link, default 7 days (T18); also 7 days when resent after an email correction (T12, ARCH §11).

### C2a. Secure lookup link

**To:** the email on file for the ticket. **Trigger:** the lookup form gets a reference # and email that match (Q1). On a mismatch nothing is sent, and the page shows the same response either way (ARCH §8). Rate limits: 3/hour per email (T3), plus ARCH §8 per-IP and per-reference limits.

**Subject:** `{{test_tag}}Your secure link for ticket {{ticket_id}}` (own subject, not threaded, T10)

```
Hi {{greeting_name}},

Here's your secure link to ticket {{ticket_id}}:
{{secure_link}}

It works for {{link_lifetime_text}}, until {{secure_link_expires_at}}.

Please don't forward or share it. Anyone with the link can see your ticket.

Didn't ask for this? You can ignore it. Nothing on your ticket has changed.

{{sender_name}}
```

**Variables:** `ticket_id`, `greeting_name`, `secure_link`, `link_lifetime_text`, `secure_link_expires_at`, `sender_name`
**Link:** lookup link, default **60 minutes** (T18).

### C2b. Fresh link (new)

**To:** the email on file for the ticket only. **Trigger:** the customer presses "Email me a new link" on the expired-link page (ARCH §8, `/public/links/resend`). Same response either way; rate limit 3/hour per ticket (ARCH §8).

**Subject:** `{{test_tag}}Your new link for ticket {{ticket_id}}` (own subject, not threaded, T10)

```
Hi {{greeting_name}},

Your old link to ticket {{ticket_id}} expired, so here's a new one:
{{secure_link}}

It works for {{link_lifetime_text}}, until {{secure_link_expires_at}}.

Please don't forward or share it. Anyone with the link can see your ticket.

Didn't ask for this? You can ignore it. Nothing on your ticket has changed.

{{sender_name}}
```

**Variables:** `ticket_id`, `greeting_name`, `secure_link`, `link_lifetime_text`, `secure_link_expires_at`, `sender_name`
**Link:** notification link, default **7 days** (T18, ARCH §11 "7 days fresh link").

### C3. Support reply

**To:** the customer. **Trigger:** a staff member posts a **customer-visible reply** (never an internal note), in any status except Closed or Cancelled (those are read-only, T1, ARCH G16). **This includes Resolved tickets** (T4). If the same action also moves the ticket to Waiting on Customer or Resolved, send C4 or C5 instead, with the reply in it (ARCH §4).

**Subject:** `{{test_tag}}[{{ticket_id}}] Your {{product_name}} support ticket`

```
Hi {{greeting_name}},

We replied to your ticket {{ticket_id}}.

Support team wrote:
--------
{{staff_reply_text}}
--------

[IF staff_attachment_count > 0]
We attached {{staff_attachment_count}} file(s). You can download them from your ticket page.
[END IF]

To answer us, open your ticket here:
{{secure_link}}

[IF ticket status is Resolved]
Your ticket is still marked Resolved. If you still need help, reopen it by {{auto_close_at}} with this link (it works until then):
{{reopen_link}}
[END IF]

This link works for {{link_lifetime_text}}, until {{secure_link_expires_at}}. If it's expired, get a new one at:
{{lookup_page_url}}

Replying to this email won't add anything to your ticket. Please reply on your ticket page.

{{sender_name}}
```

**Variables:** `ticket_id`, `product_name`, `greeting_name`, `staff_reply_text`, `staff_attachment_count`, `secure_link`, `link_lifetime_text`, `secure_link_expires_at`, `lookup_page_url`, `sender_name`; on Resolved tickets also `auto_close_at`, `reopen_link`
**Links:** `secure_link` is a notification link, default 7 days (T18). On a Resolved ticket, `reopen_link` is valid until `auto_close_at` (T18), never over 14 days. This two-link design is confirmed by **T25**.

### C4. Waiting on Customer

**To:** the customer. **Trigger:** status changes to Waiting on Customer (Q2), on every move into it. If a reply was sent in the same action, it goes inside this email (ARCH §4).

**Subject:** `{{test_tag}}[{{ticket_id}}] Your {{product_name}} support ticket`

```
Hi {{greeting_name}},

We need a bit more from you before we can keep working on ticket {{ticket_id}}.

[IF sent with a reply]
Support team wrote:
--------
{{staff_reply_text}}
--------
[IF staff_attachment_count > 0] We attached {{staff_attachment_count}} file(s). You can download them from your ticket page. [END IF]
[END IF]

Reply here:
{{secure_link}}

There's no deadline, but your ticket is on hold until you reply. As soon as you do, we'll pick it back up.

No longer need help? You can cancel the ticket from the same page.

This link works for {{link_lifetime_text}}, until {{secure_link_expires_at}}. If it's expired, get a new one at:
{{lookup_page_url}}

Replying to this email won't add anything to your ticket. Please reply on your ticket page.

{{sender_name}}
```

**Variables:** `ticket_id`, `product_name`, `greeting_name`, `secure_link`, `link_lifetime_text`, `secure_link_expires_at`, `lookup_page_url`, `sender_name`; if sent with a reply, also `staff_reply_text`, `staff_attachment_count`
**Link:** notification link, default 7 days (T18).
(Basis: no timeout, P6; reply → Open, §11; cancel allowed, P3.)

### C5. Resolved

**To:** the customer. **Trigger:** status changes to Resolved, on every move into it, including after a reopen (with the new date). If a reply was sent in the same action, it goes inside this email (ARCH §4). No auto-close email follows (P8). The customer gets more email about this ticket only if they reopen it or staff post another reply (T4).

**Subject:** `{{test_tag}}[{{ticket_id}}] Your {{product_name}} support ticket`

```
Hi {{greeting_name}},

We think the issue on ticket {{ticket_id}} is fixed, so we've marked it Resolved.

[IF sent with a reply]
Support team wrote:
--------
{{staff_reply_text}}
--------
[IF staff_attachment_count > 0] We attached {{staff_attachment_count}} file(s). You can download them from your ticket page. [END IF]
[END IF]

Still having the problem? Reopen the ticket here:
{{reopen_link}}

You can reopen it until {{auto_close_at}} ({{reopen_window_days}} days from now). After that, the ticket closes automatically and can't be reopened. If you need help after that, open a new ticket at:
{{new_ticket_url}}

Just want to add a note or say thanks? You can reply on your ticket page. A reply won't reopen the ticket. Only the Reopen button does.

If everything's working, you don't need to do anything. We won't email you about this ticket again unless you reopen it or we send you a reply.

This link works until {{auto_close_at}}, when the ticket closes. To view the ticket after that, get a new link at:
{{lookup_page_url}}

{{sender_name}}
```

**Variables:** `ticket_id`, `product_name`, `greeting_name`, `reopen_link`, `auto_close_at`, `reopen_window_days`, `new_ticket_url`, `lookup_page_url`, `sender_name`; if sent with a reply, also `staff_reply_text`, `staff_attachment_count`
**Link:** reopen link, valid **until `auto_close_at`** (T18). That's never more than 14 days away, because the reopen window is 1–14 days (T2) and the cap is 14 days (R9/T9).

---

## 7. Admin alert emails

**Shared conventions:**
- **From:** the sending mailbox. **To:** per B7, listed on each alert. "Unassigned" also covers an inactive assignee (ARCH §11).
- **Subject (T10, T16):** `{{test_tag}}[{{site_name}}] <Event> {{ticket_id}}: {{ticket_subject_short}}`. With the default `site_name` this reads `[Help Desk] ...`, which matches T10. Each event type gets its own subject, so alerts don't thread; searching the ticket ID in Gmail finds all of them.
- Alerts fire only on customer actions. Customer-reply alerts are combined: at most one per ticket per 10 minutes (ARCH §11). When they're combined, the preview shows the latest reply plus "(N new replies)".
- **Content (T11):** status, priority, assignee, and impact are allowed. **Internal note text never appears.**
- **Preview (T15, T19):** always included, not a setting. The customer's own message for that event (`{{message_preview}}`), cut per T19: the last word boundary at or before character 500 (or a hard cut at 500 for one huge word), then `…`, which isn't counted.
- **Link (T15, ARCH §6.6):** the only link is the https open link `{{admin_open_url}}` = `https://<server>/open/ticket/HD-XXXXXX`. No raw `helpdesk://` link appears in any email. The fallback line is "Or open the {{site_name}} app and search for {{ticket_id}}" (ARCH §11).
- Footer: replying to the alert doesn't reach the customer.

### A1. New ticket

**To:** every active Administrator (B7). **Trigger:** a ticket is created (Q3).
**Subject:** `{{test_tag}}[{{site_name}}] New ticket {{ticket_id}}: {{ticket_subject_short}}`

```
New ticket {{ticket_id}}

Subject: {{ticket_subject}}
Product: {{product_name}}
Customer impact: {{customer_impact}} (hint only, doesn't set priority)
Priority: {{priority}}
Status: New, {{assignee_name_or_unassigned}}
From: {{customer_name_or_none}} <{{customer_email}}>
Submitted: {{event_time}}
Attachments: {{attachment_summary}}

What they wrote:
{{message_preview}}

Open the ticket:
{{admin_open_url}}
Or open the {{site_name}} app and search for {{ticket_id}}

---
Automated alert. Replying to this email does not reach the customer.
```

**Variables:** `test_tag`, `site_name`, `ticket_id`, `ticket_subject`, `ticket_subject_short`, `product_name`, `customer_impact`, `priority`, `assignee_name_or_unassigned`, `customer_name_or_none`, `customer_email`, `event_time`, `attachment_summary`, `message_preview` (description), `admin_open_url`

### A2. Customer reply

**To:** the assignee, or every active Administrator if unassigned (B7). **Trigger:** the customer replies while the ticket is New, Open, In Progress, or Waiting on Customer (Q3, P2). Combined per ARCH §11.
**Subject:** `{{test_tag}}[{{site_name}}] Customer reply {{ticket_id}}: {{ticket_subject_short}}`

```
The customer replied on {{ticket_id}}.

Subject: {{ticket_subject}}
Status: {{ticket_status}}
{{status_change_note}}
Priority: {{priority}}
Assigned to: {{assignee_name_or_unassigned}}
Customer impact: {{customer_impact}}
Customer: {{customer_name_or_none}} <{{customer_email}}>
Replied: {{event_time}}
Attachments in this reply: {{attachment_summary}}

What they wrote:
{{message_preview}}

Open the ticket:
{{admin_open_url}}
Or open the {{site_name}} app and search for {{ticket_id}}

---
Automated alert. Replying to this email does not reach the customer.
```

**Variables:** `test_tag`, `site_name`, `ticket_id`, `ticket_subject`, `ticket_subject_short`, `ticket_status`, `status_change_note`, `priority`, `assignee_name_or_unassigned`, `customer_impact`, `customer_name_or_none`, `customer_email`, `event_time`, `attachment_summary`, `message_preview` (reply), `admin_open_url`

### A3. Reopen

**To:** the assignee (kept on reopen, ARCH §4), or every active Administrator if unassigned (B7). **Trigger:** the customer presses Reopen on a Resolved ticket inside the window, and it moves to Open. Admin reopens and restores are staff actions, so they send no alert.
**Subject:** `{{test_tag}}[{{site_name}}] Reopened {{ticket_id}}: {{ticket_subject_short}}`

```
The customer reopened {{ticket_id}}. It's back to Open.

Subject: {{ticket_subject}}
Was resolved: {{resolved_at}}
Reopened: {{event_time}}
Priority: {{priority}}
Assigned to: {{assignee_name_or_unassigned}}
Customer impact: {{customer_impact}}
Customer: {{customer_name_or_none}} <{{customer_email}}>

Their message:
{{message_preview}}

The auto-close clock has stopped. It starts again when the ticket is resolved again.

Open the ticket:
{{admin_open_url}}
Or open the {{site_name}} app and search for {{ticket_id}}

---
Automated alert. Replying to this email does not reach the customer.
```

**Variables:** `test_tag`, `site_name`, `ticket_id`, `ticket_subject`, `ticket_subject_short`, `resolved_at`, `event_time`, `priority`, `assignee_name_or_unassigned`, `customer_impact`, `customer_name_or_none`, `customer_email`, `message_preview` (optional reopen message, or `(no message)`), `admin_open_url`

### A4. Customer reply on a Resolved ticket

**To:** the assignee, or every active Administrator if unassigned (B7, treated as a reply alert). **Trigger:** the customer replies while the ticket is Resolved. It stays Resolved, the clock keeps running, and the ticket is flagged (R1).
**Subject:** `{{test_tag}}[{{site_name}}] Reply on Resolved {{ticket_id}}: {{ticket_subject_short}}`

```
The customer replied on {{ticket_id}}, which is Resolved. The ticket did NOT reopen.

Status: Resolved
Auto-closes: {{auto_close_at}} (about {{hours_until_close}} hours from now)
Subject: {{ticket_subject}}
Priority: {{priority}}
Assigned to: {{assignee_name_or_unassigned}}
Customer: {{customer_name_or_none}} <{{customer_email}}>
Replied: {{event_time}}
Attachments in this reply: {{attachment_summary}}

What they wrote:
{{message_preview}}

It may just be a thank-you. If they still need help, you can move the ticket back to Open or In Progress, or reply to them. A reply emails the customer.

Open the ticket:
{{admin_open_url}}
Or open the {{site_name}} app and search for {{ticket_id}}

---
Automated alert. Replying to this email does not reach the customer.
```

**Variables:** `test_tag`, `site_name`, `ticket_id`, `ticket_subject`, `ticket_subject_short`, `auto_close_at`, `hours_until_close`, `priority`, `assignee_name_or_unassigned`, `customer_name_or_none`, `customer_email`, `event_time`, `attachment_summary`, `message_preview` (reply), `admin_open_url`

### A5. Cancelled by customer (new, T14)

**To:** the assignee, or every active Administrator if unassigned (B7, T14). **Trigger:** the customer cancels from New, Open, In Progress, or Waiting on Customer (P3). The optional reason is posted as a customer message (ARCH §4). Staff cancels send no alert and no customer email (T13). The customer gets no email for their own cancel either (B6).
**Subject:** `{{test_tag}}[{{site_name}}] Cancelled {{ticket_id}}: {{ticket_subject_short}}`

```
The customer cancelled {{ticket_id}}.

Subject: {{ticket_subject}}
Was: {{previous_status}}
Now: Cancelled
Cancelled: {{event_time}}
Priority: {{priority}}
Assigned to: {{assignee_name_or_unassigned}}
Customer: {{customer_name_or_none}} <{{customer_email}}>

Their reason:
{{message_preview}}

You can stop work on it. The ticket is now read-only, though internal notes can still be added (T1). Only an Administrator can restore it.

Open the ticket:
{{admin_open_url}}
Or open the {{site_name}} app and search for {{ticket_id}}

---
Automated alert. Replying to this email does not reach the customer.
```

**Variables:** `test_tag`, `site_name`, `ticket_id`, `ticket_subject`, `ticket_subject_short`, `previous_status`, `event_time`, `priority`, `assignee_name_or_unassigned`, `customer_name_or_none`, `customer_email`, `message_preview` (optional cancel reason, or `(no message)`), `admin_open_url`

## 7b. System emails to staff (new; triggers are from ARCH)

These have no customer content. They follow the same From and footer as the alerts, and their subjects get the `{{test_tag}}` too (T16).

### S1. Sender test email (T6)

**To:** the signed-in admin's own address, `{{signed_in_admin_email}}` (T17). **Trigger:** "Send test email" when the sender settings change. The new From address is saved only if this succeeds (T6).
**Subject:** `{{test_tag}}[{{site_name}}] Test email`

```
This is a test email from {{site_name}}.

If you're reading this, the new sender settings work:
From: {{sender_name}} <{{sender_address}}>
Sent: {{event_time}}

You don't need to do anything.
```

### S2. Account lockout alert (ARCH §7)

**To:** every active Administrator (ARCH §11). **Trigger:** an account hits the account-wide failed-login lockout (ARCH §7).
**Subject:** `{{test_tag}}[{{site_name}}] Account locked: {{locked_account_email}}`

```
The staff account {{locked_account_email}} was locked for {{lockout_minutes}} minutes after too many failed sign-ins.

Locked: {{event_time}}

If this wasn't expected, someone may be guessing the password. An Administrator can unlock the account or reset its password in the app (or on the server with the CLI).
```

### S3. System health alert (ARCH §10)

**To:** every active Administrator (ARCH §11). **Trigger:** the hourly health check finds a problem; at most once per 24 hours per issue (ARCH §10).
**Subject:** `{{test_tag}}[{{site_name}}] System problem: {{issue_summary}}`

```
The help desk found a problem: {{issue_summary}}

Since: {{issue_since}}
Details: {{issue_detail}}

Check the System health page in the app. You'll get at most one email per day about this problem.
```

**Variables (S1–S3):** `test_tag`, `site_name`, `sender_name`, `sender_address`, `event_time`, `signed_in_admin_email`, `locked_account_email`, `lockout_minutes`, `issue_summary`, `issue_since`, `issue_detail`

---

## 8. Practicality review (proposals, each with status)

### 8.1 Customer's point of view

**Links**
- **PROPOSED-1:** Separate lifetimes (short lookup, longer notification, reopen link until auto-close). First marked SUPERSEDED by R9/T9; now **RESOLVED by T18** (ARCH defaults 60 min / 7 days / until auto-close, all capped at 14 days). *Rationale: a reopen link must not die before the window ends.*
- **PROPOSED-2:** Opening a link only shows a page; links aren't single-use; reopen happens only on the button. **RESOLVED by ARCH §8 (+P1).** *Rationale: mail scanners pre-open links.*
- **PROPOSED-3:** Expired-link page offers "Email me a new link" to the address on file. **RESOLVED by ARCH §8**; wording is C2b (T10). *Rationale: one-tap recovery.*
- **PROPOSED-4:** Lookup gives the same response either way and sends nothing on a mismatch. **RESOLVED by ARCH §8.** *Rationale: no enumeration, no mailing strangers.*
- **PROPOSED-5:** CAPTCHA and rate limits on the lookup form. Rate limits **RESOLVED by T3 / ARCH §8.** CAPTCHA on lookup **RESOLVED by T22** (CAPTCHA covers both submit and lookup). *Rationale: the lookup form sends email.*
- **PROPOSED-6:** Short link URLs on their own line. **RESOLVED by ARCH §8** (`https://<domain>/t#<token>`). *Rationale: phone and plain-text wrapping.*
- **PROPOSED-7:** "Keep this link private" in every customer email. **RESOLVED by T4** (in C1, C2a, C2b; the other emails point to the same page). *Rationale: a forwarded link is full access.*

**Replies by email**
- **PROPOSED-14:** Monitored Reply-To plus an auto-reply pointing to the ticket page. Monitored Reply-To **RESOLVED by T4 / ARCH §11.** The auto-reply part is **SUPERSEDED by T4/T17**: stray replies and bounces land in the monitored mailbox and Brandon checks it by hand (ARCH §11 runbook). Every customer email already says replies aren't added to the ticket. *Rationale: customers will hit Reply anyway.*

**Wrong or typo'd email**
- **PROPOSED-31:** Confirmation page shows the full address. **RESOLVED by T5.** *Rationale: catch typos before the link goes to a stranger.*
- **PROPOSED-32:** Check bounces; staff can correct the email and resend the confirmation. **RESOLVED by B9** (correction, logged), **T12** (old links revoked, C1 resent to the new address), and **T17** (no automated bounce processing in v1; bounces land in the monitored mailbox and are checked by hand). *Rationale: without these, a typo strands the ticket.*

**Multiple tickets**
- **PROPOSED-33 (later feature, not v1):** "Email me links to all my open tickets." Not in v1; revisit after launch. *Rationale: repeat customers lose track of ticket numbers.*

**Threading**
- Gmail groups messages into a conversation when they share a subject, a matching References header, and were sent **within one week**. It splits on a subject change or after 100 messages (Gmail Help, support.google.com/mail/answer/5900). So a ticket that's quiet for more than a week may start a new conversation. That's acceptable, since the ticket ID in the subject keeps it searchable.
- **PROPOSED-8:** One fixed subject per ticket plus headers. **RESOLVED by T4/T10.** *Rationale: one conversation per ticket.*
- **PROPOSED-9:** Event in the subject (unthreaded). **SUPERSEDED by T4/T10.**
- **PROPOSED-10:** Lookup email on its own subject. **RESOLVED by T10** (fresh-link email too).
- **PROPOSED-13:** Customer's ticket subject stays out of email subject lines. **RESOLVED by T4** (adopted in templates). *Rationale: lock-screen privacy, typo'd addresses, abuse.*

**Mobile**
- **PROPOSED-43:** Plain-text master; HTML optional and degrades cleanly. **RESOLVED by ARCH §11.**
- **PROPOSED-44:** No hard-wrapping; one-to-two sentence paragraphs; action link near the top. **RESOLVED by T4** (wording owned here). *Rationale: jagged lines on phones.*

**Timing of close vs reopen**
- **PROPOSED-25:** A fresh Resolved email with the new date on every re-resolve. **RESOLVED by ARCH §4** (each move into Resolved stamps a new `auto_close_due_at`).
- **PROPOSED-26:** Dates in ET, labeled; "on or shortly after" on screen. **RESOLVED by A1 / ARCH G19** (the job runs every 15 minutes, ARCH §10).
- **PROPOSED-27:** Staff replies on Resolved tickets still email the customer. **RESOLVED by T4.**
- **PROPOSED-28:** Closed-ticket landing page with a new-request button. **SUPERSEDED by T4** (screen copy belongs to DESIGN.md; ARCH §8 keeps Closed tickets viewable read-only).
- **PROPOSED-29:** On-page note that a reply on Resolved doesn't reopen. **SUPERSEDED by T4** (screen copy → DESIGN.md). The same message is in C5.
- **PROPOSED-45 (later feature, not v1):** A reminder for tickets left in Waiting on Customer. Not in v1; revisit after launch. *Rationale: P6 has no timeout.*

**Attachments**
- **PROPOSED-18:** Never attach files to emails. **RESOLVED by ARCH §9 / DESIGN** (download only, after a clean scan).

### 8.2 Technician's point of view

- **PROPOSED-34:** At most one reply alert per ticket per 10 minutes. **RESOLVED by ARCH §11.**
- **PROPOSED-35:** Alert routing. **RESOLVED by B7** (new → all active Administrators; reply/reopen → assignee, else all Administrators). This differs from the proposal, which sent new tickets to all internal users.
- **PROPOSED-46:** Admin alert on customer cancel. **RESOLVED by T14** (alert A5, routed per B7). *Rationale: someone may be partway through the work.*
- **PROPOSED-37:** Alerts carry status, auto status-change note, assignee, priority, impact, and scan status. Briefly SUPERSEDED in part by B8; now **RESOLVED by T11** (priority and assignee restored; internal note text never included). *Rationale: triage from a phone.*
- **PROPOSED-17:** Customer-message preview in alerts. **RESOLVED by T15 + T19** (~500 characters, always on, T19 cut rule, in A1–A5). *Rationale: faster triage, but more customer data ends up in Gmail.*
- **PROPOSED-30:** Hours-left-before-close line in A4. **RESOLVED by T4** (in the template).
- **PROPOSED-11:** Alert subject format. **RESOLVED by T10.**
- **PROPOSED-36:** Send alerts to a separate or plus-address with a Gmail label. **DEFERRED (go-live)** (REQUIREMENTS "DEFERRED" entry). B7 sends to Administrators' own addresses, so this only matters if an Administrator's address is the sending mailbox. *Rationale: keeps alerts apart from stray customer replies.*
- **PROPOSED-15:** Alert footer says replying doesn't reach the customer. **RESOLVED by T4** (in templates).
- **PROPOSED-12:** Sanitize customer-written text in emails and headers. **RESOLVED by ARCH §11.**
- **PROPOSED-20:** Generic sign-off; staff don't sign replies with their own names. **RESOLVED by T22/T26b:** customer emails are signed `{{sender_name}}` (default "Help Desk"), quoted staff replies carry the author label "Support team", and individual staff names are never shown to customers. Practical note for staff: don't type your own name into reply text, since it's sent verbatim (B8). *Rationale: §6 hides the assignee from customers.*
- **PROPOSED-24:** One combined email per staff action. **RESOLVED by ARCH §4/§11.**
- **PROPOSED-47:** Make the alert link clickable in Gmail and keep the "search for the ID" fallback. **RESOLVED by T15 + ARCH §6.6:** emails carry only the https open link `https://<server>/open/ticket/HD-XXXXXX`; the `helpdesk://` hand-off happens inside that page. *Rationale: mail clients often don't make custom-scheme links clickable.*

### 8.3 Privacy and security

- **PROPOSED-16:** Customer emails link-only by default. **SUPERSEDED by B8** (reply text is included; internal information never is).
- **PROPOSED-21:** Runbook step to search and delete customer data in the Gmail mailbox for export/erase requests. **RESOLVED by ARCH G28** (runbook step). It's still needed because R4's tools stay in force (B10). Including reply text (B8) puts more customer data in Gmail's Sent folder, so this matters more now.
- **PROPOSED-19:** No tracking pixels or click tracking. **RESOLVED by ARCH §11.**
- **PROPOSED-22:** Privacy notice link in email footers. **SUPERSEDED by B10** (no privacy notice in v1). If the notice is switched on later, add a footer line `Privacy notice: {{privacy_notice_url}}`, shown only while the notice setting is on.
- **PROPOSED-23:** Template tests block internal fields in customer emails. **RESOLVED by ARCH §11.** These tests should also check that `staff_reply_text` can only come from a customer-visible reply (B8).

### 8.4 Gmail-specific risks

Verified facts (Google notes that limits can change without notice):
- **Sending limits:** about **500 messages/day** for a regular Gmail account (support.google.com/mail/answer/22839); **2,000/day** per Workspace user, counted over a rolling 24 hours (support.google.com/a/answer/166852). Going over can block sending for up to 24 hours, and that stops customer links and alerts too. The test mailbox (R10) is a regular `@gmail.com` account, so the ~500/day figure applies. ARCH caps sending at `EMAIL_MAX_PER_DAY=400` and queues the rest.
- **Authentication:** password-only "less secure app" sign-in is gone. Use OAuth or an App Password, which requires 2-Step Verification (support.google.com/a/answer/14114704, support.google.com/accounts/answer/185833). `smtp.gmail.com`, port 465 or 587 (support.google.com/a/answer/176600).
- **Sender rules:** every sender needs SPF or DKIM. Senders of about 5,000+/day need DMARC too. Form-confirmation-type transactional mail is exempt from one-click unsubscribe (support.google.com/mail/answer/81126, /14229414). With an `@gmail.com` sender, Google handles SPF/DKIM (ARCH §11).

Proposals:
- **PROPOSED-38:** Dedicated mailbox, not a personal one. **RESOLVED by R10** for testing (`support.trouthomelab@gmail.com`; default display name "Help Desk", T21). The live mailbox is **DEFERRED** to go-live (DEFERRED entry; ARCH D3).
- **PROPOSED-39:** Count sends, queue near the limit, retry on limit errors. **RESOLVED by ARCH §10/§11** (daily cap of 400, outbox retries, health alert when failures pile up).
- **PROPOSED-40:** OAuth or an App Password kept as a secret; steady pacing. **RESOLVED by ARCH §11** (App Password, `EMAIL_MAX_PER_MINUTE`).
- **PROPOSED-41:** From must be the mailbox or a verified alias; set up SPF/DKIM/DMARC on the go-live domain. The From check is **RESOLVED by T6 / ARCH G8.** The go-live domain DNS / email authentication is **DEFERRED (go-live)** (REQUIREMENTS "DEFERRED" entry; ARCH D4, H1).
- **PROPOSED-42:** Link domain matches the sender at go-live; pre-launch is test data only. Test data part **RESOLVED by R10** (plus ARCH G18). The go-live domain part is **DEFERRED (go-live)** (REQUIREMENTS "DEFERRED" entry; D4). *Rationale: links sent during testing break when the domain changes.*
- **PROPOSED-48:** `[TEST]` subject tag outside production. **RESOLVED by T16** (every email outside production; ARCH §11 applies it in the transport layer, default `[TEST]`). *Rationale: R10 makes everything sent during testing test data, and a visible tag keeps any tester from mistaking it for real support.*

## 9. PROPOSED items index

| # | One line | Status |
|---|---|---|
| 1 | Separate link lifetimes | RESOLVED (T18; 14-day cap R9/T9) |
| 2 | Links never act on open; not single-use | RESOLVED (ARCH §8, P1) |
| 3 | Expired-link "email me a new link" | RESOLVED (ARCH §8; C2b, T10) |
| 4 | Same lookup response either way | RESOLVED (ARCH §8) |
| 5 | CAPTCHA + rate limits on lookup | RESOLVED (T3 rate limits; T22 CAPTCHA) |
| 6 | Short link URLs on own line | RESOLVED (ARCH §8) |
| 7 | "Keep this link private" | RESOLVED (T4) |
| 8 | One fixed subject per ticket + headers | RESOLVED (T4/T10) |
| 9 | Event-in-subject alternative | SUPERSEDED (T4/T10) |
| 10 | Lookup email own subject | RESOLVED (T10) |
| 11 | Admin subject format | RESOLVED (T10) |
| 12 | Sanitize customer text | RESOLVED (ARCH §11) |
| 13 | Customer subject out of email subject lines | RESOLVED (T4) |
| 14 | Monitored Reply-To + auto-reply | Reply-To RESOLVED (T4); auto-reply SUPERSEDED (T4/T17, manual check) |
| 15 | Alert footer "doesn't reach customer" | RESOLVED (T4) |
| 16 | Link-only customer emails | SUPERSEDED (B8) |
| 17 | Message preview in alerts | RESOLVED (T15, T19; always on) |
| 18 | Never attach files | RESOLVED (ARCH §9) |
| 19 | No tracking | RESOLVED (ARCH §11) |
| 20 | Generic sign-off; staff don't sign names | RESOLVED (T22/T26b) |
| 21 | Gmail copies in privacy requests | RESOLVED (ARCH G28) |
| 22 | Privacy footer | SUPERSEDED (B10) |
| 23 | Template tests for internal fields | RESOLVED (ARCH §11) |
| 24 | One email per combined action | RESOLVED (ARCH §4/§11) |
| 25 | Fresh Resolved email on re-resolve | RESOLVED (ARCH §4) |
| 26 | ET dates, "shortly after" | RESOLVED (A1, ARCH G19) |
| 27 | Staff reply on Resolved emails customer | RESOLVED (T4) |
| 28 | Closed landing page | SUPERSEDED (T4 → DESIGN) |
| 29 | On-page "reply won't reopen" | SUPERSEDED (T4 → DESIGN) |
| 30 | Hours-left in A4 | RESOLVED (T4) |
| 31 | Show full email on confirmation page | RESOLVED (T5) |
| 32 | Correct email + resend + bounces | RESOLVED (B9 correction; T12 resend + revoke; T17 no bounce automation) |
| 33 | "Email me all my tickets" | Later feature (not v1) |
| 34 | Debounce reply alerts | RESOLVED (ARCH §11) |
| 35 | Alert routing | RESOLVED (B7) |
| 36 | Alerts to plus-address/label | DEFERRED (go-live) |
| 37 | Rich alert context | RESOLVED (T11) |
| 38 | Dedicated mailbox | RESOLVED for testing (R10, T21 name); live DEFERRED to go-live |
| 39 | Send counting / queue on limit | RESOLVED (ARCH §10/§11) |
| 40 | OAuth/App Password; pacing | RESOLVED (ARCH §11) |
| 41 | From = mailbox/alias; go-live DNS | From RESOLVED (T6, ARCH G8); DNS DEFERRED (go-live) |
| 42 | Link domain at go-live; test data | Test data RESOLVED (R10); domain DEFERRED (go-live) |
| 43 | Plain-text master | RESOLVED (ARCH §11) |
| 44 | No hard-wrapping, short paragraphs | RESOLVED (T4) |
| 45 | Waiting on Customer reminder | Later feature (not v1) |
| 46 | Alert on customer cancel | RESOLVED (T14; alert A5) |
| 47 | Clickable alert link; keep ID fallback | RESOLVED (T15, ARCH §6.6) |
| 48 | `[TEST]` subject tag outside production | RESOLVED (T16) |

## 10. Conflicts and gaps between the docs (as of this pass)

**Resolved since the first draft:** the auto-close email (P8); link lifetime (R9/T9); reopen window vs auto-close (T2); alert recipients (B7); staff reply on Resolved (T4); emails on cancel/reopen/restore (B6); reply text in emails (B8); subject style (T4/T10); the sender address for testing (R10); the privacy notice (B10).

**Resolved in pass 3:** B8 vs alerts (T11), email-correction emails (T12), B6 scope (T13), cancel alert (T14), test email recipient (T17).

**Gaps and conflicts list, all closed as of pass 4:**
1. Link lifetime defaults (ARCH 60 min / 7 days vs this file's 14 days): **RESOLVED by T18.** The ARCH defaults stand and 14 days is the cap.
2. Alert recipients (ARCH "all Administrators"): **RESOLVED by B7/T14.** ARCH §11 and G10 now follow B7.
3. Reply text as a pending setting: **RESOLVED by B8.** ARCH §11 says it's always included.
4. Subject/threading "pending": **RESOLVED by T4/T10.** ARCH §11 is updated.
5. Email correction not built: **RESOLVED by B9/T12** (ARCH G28 is updated).
6. Privacy notice blocking go-live: **RESOLVED by B10** (ARCH G14: off by default).
7. Lookup rate limit 5 vs 3 per email: **RESOLVED by T3** (ARCH §8 now says 3/hour).
8. DESIGN §3.14/§4.16 email drafts: **covered by T4** (this file owns email text). DESIGN's "72 hours" link text: **RESOLVED.** DESIGN no longer says it (CONSISTENCY_REPORT CR-20; DESIGN follows T18). Masked vs full email: **RESOLVED by T5** (ARCH G24).
9. B8 vs alert content, and ARCH alert content: **RESOLVED by T11/T15** (ARCH §11 now matches).
10. B6 scope for staff cancels: **RESOLVED by T13.**
11. The remaining "not defined" items: test email recipient **RESOLVED by T17**; cancel alert **RESOLVED by T14**; bounces **RESOLVED by T17** (manual, no automation); Gmail auto-reply **covered by T4/T17** (monitored mailbox, manual check; no auto-reply in v1); alert link **RESOLVED by T15 + ARCH §6.6**; preview cut rule **RESOLVED by T19**; default sender name **RESOLVED by T21**.
12. PHASE2_OPEN_QUESTIONS.md lag: **covered by the authority rule.** REQUIREMENTS_DISCOVERY.md is authoritative (it records T2, B7, T4, B6, B8). This is bookkeeping only.

## 11. Go-live checklist (email)

Do these before switching `HD_ENV` to production:
- [ ] **Set `company_name`.** The default "Your Company" (ARCH G35) must not reach real customers (CR-22). No current template uses it, but any future one would.
- [ ] Set the live sender address and, if wanted, a display name other than "Help Desk" (OQ-5, DEFERRED; T6 test email must pass).
- [ ] Set `site_name` if it should differ from "Help Desk" (OQ-18, DEFERRED).
- [ ] Go-live domain: SPF/DKIM/DMARC and the link domain (PROPOSED-41/42, DEFERRED).
- [ ] Decide on a separate or "+alerts" alert address (PROPOSED-36, DEFERRED).
- [ ] Confirm the `[TEST]` tag disappears in production (T16).
