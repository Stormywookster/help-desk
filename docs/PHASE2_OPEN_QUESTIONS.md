# Phase 2: consolidated open questions (staging, for one batch to Brandon)

## From Support Ops (EMAIL_AND_WORDING.md, Oct 6)
- S1 CLOSED (R9: links valid 14 days). Link lifetimes: lookup link short-lived; notification links longer; Resolved reopen link valid until auto-close. Expired link offers "email me a new link." (Q1 says "short-lived" but reopen needs 14 days.)
- S2 Reopen-window setting (P20) vs fixed 14-day auto-close (P4). Proposed: one setting drives both.
- S3 Alert recipients now that Agents exist (R3). Proposed: new ticket goes to all internal users; reply/reopen goes to the assignee (to all users if unassigned).
- S4 Staff reply on a Resolved ticket. Proposed: still emails the customer (Q2 wins over "Resolved is the last email").
- S5 CLOSED (R10: test sender support.trouthomelab@gmail.com; easy to change at go-live). Sender address: Gmail can only send as the mailbox or a verified alias. Proposed: the sender setting is limited to what the provider allows; use a dedicated Gmail, not personal.
- S6 Pre-launch domain links break at go-live (accepted pre-launch limitation?).
- S7 Undefined emails: customer email on cancel / admin reopen of Closed / restore of Cancelled; admin alert on cancel; where customer email replies land (Reply-To + auto-reply); bounces; what the alert link opens (Windows app); whether Reopen takes a message and keeps the assignee.
- S8 Subject style: one fixed subject per ticket so it threads (recommended) vs event in the subject.
- S9 Emails carry only a link vs include the message text.
- Note: brandon-answers-round2-2026-10-06.md is a verbatim historical record; REQUIREMENTS_DISCOVERY.md is authoritative.

## From Designer (DESIGN.md section 6, Oct 6): 38 OQs with defaults already used in the spec
OQ-2 superseded by R9 (14 days, not 72h). Items worth escalating to Brandon: OQ-1 site name, OQ-14/15 optional reopen/cancel messages, OQ-18 no emails on cancel/admin reopen/restore, OQ-20 one setting for reopen window + auto-close, OQ-24 password/lockout policy, OQ-27 alert recipients, OQ-29/30 staff status rules, OQ-34 staff can't edit customer email, OQ-38 backup retention. The rest are design-level defaults for bulk approval.
Conflict to settle with the Architect: OQ-5 CAPTCHA vs the no-tracking-cookies rule (R4).

## From Architect (ARCHITECTURE.md §19/§21, Oct 6)
D1 repo private vs public; D2 backup target (B2); D3 resolved by R10 (support.trouthomelab@gmail.com for testing); D4 domain at go-live (Brandon already said he'll buy one); D5 Windows code signing (default no); D6 VPS needs at least 4 GB free RAM for ClamAV; G33 backup retention 7d/4w/12m; G30 file types; privacy notice text.
Architect link lifetimes (lookup 60 min, other links 7 days, reopen until auto-close) fall within R9's 14-day ceiling.
Team-level (no Brandon needed): G25 password length (Architect = security owner, 15 chars), G26 http on private networks only.

## Batch sent to Brandon Oct 6 ~11:15 AM: B1-B9 (see chat)

## Status Oct 6, 3:40 PM
All S/OQ/D items resolved by R9-R10, B1-B10, and T1-T17, or deferred to go-live (live sender, company/site names). This file is now historical; REQUIREMENTS_DISCOVERY.md is authoritative.
