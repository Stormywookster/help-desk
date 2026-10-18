# Help Desk: Documentation Consistency Report (latest: Re-sweep 3 follow-up, Oct 8, 2026, READY WITH MINORS; see the end of this file)

**Owner:** Doc Steward (bot team) | **Product owner:** Brandon Trout | **Date:** Oct 6, 2026, re-sweep finished 4:13 PM ET
**Authority:** `REQUIREMENTS_DISCOVERY.md` (LOCKED items, then team decisions **T1–T32**). A plain T-number means a team decision. Threat-model rows are TM-n.
**Severity:** **Blocker** = contradicts a LOCKED item or team decision, so it would get built wrong. **Major** = stale or contradictory in a way that causes rework, a failing test, or a broken process, but with limited damage. **Minor** = wording, ID, or bookkeeping drift.
**Scope:** REQUIREMENTS_DISCOVERY, ARCHITECTURE (+ adr/0001–0019), DESIGN, EMAIL_AND_WORDING, ACCEPTANCE_CRITERIA, HUMAN_STEPS_LOG, IMPLEMENTATION_PLAN. Only this file was edited.

---

## 1. History: round 1 (3:53 PM ET)

Round 1 found **33 issues (2 Blocker, 5 Major, 26 Minor)** and six open decisions, with the verdict **NOT READY**. The two Blockers were DESIGN's customer screens saying "reference number" against T23 (CR-10), and ARCH not specifying T25's second (reopen) link (CR-2). At 3:57 PM ET the Project Lead settled ND-1 to ND-6 as **T26** (a: "ticket", never "request"; b: "Support team" author label, emails still signed with the sender name; c: no editing a staff user's email) and **T27** (unread indicator in v1), changed P4/P8 to N days, and logged H-2 in HUMAN_STEPS_LOG. Since then REQUIREMENTS_DISCOVERY has added **T28** (app-level badge), **T29** (`EMAIL_ALERT_PREVIEW_CHARS` 100–500), **T30** (Conventional Commits), **T31** (one shared GitHub identity) and **T32** (beta bug flow and support bundle). The round-1 findings text is in git history. This file now gives only the current status.

## 2. Docs checked (final versions, ET)

| Doc | Version re-checked | Last change |
|---|---|---|
| REQUIREMENTS_DISCOVERY.md | T1–T32 | 4:04:41 PM |
| ARCHITECTURE.md | draft 3, changelog revisions (4) and (5) | 4:09:46 PM |
| adr/ | 0001–0019 (0018 and 0019 are new; 0005, 0012, 0014, 0016 edited 4:07–4:09 PM) | 4:09:46 PM |
| DESIGN.md | revision 6 (T1–T28, OQ-48) | 4:05:19 PM |
| EMAIL_AND_WORDING.md | pass 5 | 3:57:07 PM |
| ACCEPTANCE_CRITERIA.md | revision 9 (457 ACs, T1–T29) | 4:04:13 PM |
| HUMAN_STEPS_LOG.md | rows 1–2 | 3:55:49 PM |
| IMPLEMENTATION_PLAN.md | **exists** (new since round 1); 54 tasks, 457/457 ACs mapped | 4:12:53 PM (edited several times during the sweep) |

## 3. Status of round-1 findings CR-1 to CR-33

**33 Fixed, 0 Partly fixed, 0 Open.** Line numbers are from the final files listed above.

| CR | Sev | Doc | Status | Evidence |
|---|---|---|---|---|
| CR-1 | Major | ARCH | Fixed | Rows renamed TM-n (ARCH 931 "TM-1 … TM-35"); G44 Resolved (1320). Leftover range text: CR-40 |
| CR-2 | Blocker | ARCH | Fixed | `reopen` token purpose (349); §8 purposes (624) and "Which email carries which token" (625): two tokens on a staff reply to a Resolved ticket (T25); G45 |
| CR-3 | Minor | ARCH | Fixed | 697: "Exact wording: EMAIL_AND_WORDING A1–A5 (T4, T14)" |
| CR-4 | Minor | ARCH, ADR 0011 | Fixed | ARCH 697 and ADR 0011 line 17 carry the T19 cut rule; env var range 100–500 refused outside (ARCH §14, T29, G51) |
| CR-5 | Minor | ARCH | Fixed | Header T1–T32 (3); §19 status T1–T32; G37 Resolved (T24) |
| CR-6 | Minor | ARCH | Fixed | G22 Resolved T18; G25 "DESIGN now says 15"; G32 Resolved |
| CR-7 | Minor | ARCH | Fixed | Work breakdown: "users create / edit / turn off / reset password / unlock (users are never deleted …)" |
| CR-8 | Major | ADR 0016 | Fixed | Line 21: installer only on release tags; `edge` carries the latest release's installer |
| CR-9 | Minor | ADR 0017 | Fixed | Line 28: TM-26 / TM-27 |
| CR-10 | Blocker | DESIGN | Fixed | 62 "Customer-facing terms (T23, T26a)"; C-02 433, C-03 473–474, C-04 518; OQ-47 and C-15 Resolved (1708, 1726) |
| CR-11 | Minor | DESIGN | Fixed | OQ-17/21/26/35/41/43 RESOLVED (T22) (1678–1704) |
| CR-12 | Minor | DESIGN | Fixed | 1468 matches a former address; C-13 RESOLVED (T24) (1724) |
| CR-13 | Minor | DESIGN | Fixed | 188 "Server configuration only (T18)"; C-12 RESOLVED (1723) |
| CR-14 | Minor | DESIGN | Fixed | C-14 RESOLVED (1725) |
| CR-15 | Major | DESIGN | Fixed | W-09 Edit user (1359 on): email read-only, helper at 1377 (T26c) |
| CR-16 | Minor | DESIGN | Fixed | Status rev 6, T1–T28 (4); traceability rows T18–T28 (1640–1646) |
| CR-17 | Major | EMAIL | Fixed (as revised by T26b) | Sign-off stays `{{sender_name}}`; "Support team wrote:" label in C3/C4/C5 (306, 346, 384); PROPOSED-20 Resolved (685) |
| CR-18 | Minor | EMAIL | Fixed | 637: CAPTCHA on lookup RESOLVED by T22 |
| CR-19 | Minor | EMAIL | Fixed | 682, 708, 709: DEFERRED (go-live) |
| CR-20 | Minor | EMAIL | Fixed | §10 item 8 RESOLVED |
| CR-21 | Minor | EMAIL | Fixed | 176 and 642: SUPERSEDED (T4/T17) |
| CR-22 | Minor | EMAIL | Fixed | 128: default `Your Company` |
| CR-23 | Major | AC | Fixed | AC-EM-49 (330), AC-EM-24 (290). A related contradiction is new: CR-36 |
| CR-24 | Minor | AC | Fixed | AC-EM-37 (318) includes customer cancel |
| CR-25 | Minor | AC | Fixed | AC-EM-30 TM-16 (312), AC-ROLE-20 TM-4 (391), AC-GEN-06 TM-15 (659) |
| CR-26 | Minor | AC | Fixed | Stale notes gone: AC-CLOSE-16 now asserts "Enter a number of days from 1 to 14."; RC-1 (1053) and AC-ROLE-18 cite "At least 15 characters." The text that replaced the LINK-19 note is wrong: CR-37 |
| CR-27 | Minor | AC | Fixed | AC-PRIV-17 (477): "was removed when it failed the security scan" |
| CR-28 | Minor | AC | Fixed | Both stale Test Strategy clauses removed |
| CR-29 | Minor | AC | Fixed (as asked then) | Ranges updated to T1–T29, G1–G44, ADRs 0001–0017. They lag again: CR-43 |
| CR-30 | Minor | AC | Fixed | AC-LINK-01 (238) "Ticket number"; AC-CLOSE-13, AC-VIS-14/-15, AC-LC-21/-30/-47 use "ticket"; AC-GEN-17 added (669) |
| CR-31 | Minor | HUMAN_STEPS_LOG | Fixed | Row 2 (H-2) |
| CR-32 | Minor | REQ | Fixed | P4 (36) "N x 24 hours … N is the reopen window"; P8 (40) |
| CR-33 | Minor | REQ | Fixed | Q3 (19) cites T27 |

## 4. New findings (CR-34 onward)

| Doc / owner | Blocker | Major | Minor | CR numbers |
|---|---|---|---|---|
| ARCHITECTURE + DESIGN (Architect, Designer) | 0 | 1 | 0 | CR-34 |
| ARCHITECTURE / ADR 0019 (Architect) | 0 | 1 | 1 | CR-35, CR-40 |
| ACCEPTANCE_CRITERIA (QA Lead) | 0 | 2 | 1 | CR-36, CR-37, CR-43 |
| IMPLEMENTATION_PLAN (Engineer) | 0 | 0 (CR-38 resolved during the sweep) | 1 | CR-38, CR-39 |
| REQUIREMENTS_DISCOVERY (Project Lead) | 0 | 0 | 1 | CR-41 |
| DESIGN (Product Designer) | 0 | 0 | 1 | CR-42 |
| EMAIL_AND_WORDING, HUMAN_STEPS_LOG | 0 | 0 | 0 | – |
| **Total open** | **0** | **4** | **5** | **9 open (10 raised; CR-38 resolved during the sweep)** |

**CR-34 (Major; Architect + Designer; needs ND-8): ARCH and DESIGN disagree on what sets and clears `needs_attention`, so the T28 badge would show different numbers.**
- ARCH 170 (`Customer submits` → `new`, `needs_attention`), ARCH 194 ("set by … submit, reply, reopen and cleared when a staff member **opens**/marks the ticket read or sends a public reply"), ARCH 150 (refresh after "open/'Mark as seen'").
- DESIGN 4.8.4 (1184–1186): "Set by any customer reply or reopen … Cleared when a staff member sends a reply to the customer, or clicks 'Mark as seen'". OQ-28 (1689) says the same. DESIGN 1063: "the badge is the total of those flags".
- Why it matters: T28 counts "tickets marked needs_attention". Under ARCH every new, untouched ticket adds to the badge and shows ● "Customer replied" although the customer never replied, and just opening a ticket clears it. Under DESIGN neither happens. AC-LC-54/-58 use DESIGN's wording ("customer replied", "Mark as seen"), and ARCH §16 tests ARCH's rule.
- Fix: the Project Lead picks one rule (ND-8). Then ARCH 170/194/150 and DESIGN 4.8.4/OQ-28 state the same rule, and QA adds a new-ticket example to AC-LC-55.

**CR-35 (Major; Architect, then the Engineer follows): docs-only PRs can't pass `main-guard` provenance, and they skip the T30 title check.**
- ARCH 1014: `fast` is "skipped for docs-only changes". ADR 0019 line 12 (`provenance`): each commit on `main` needs a merged PR "with `fast` green on the PR's last head commit". ADR 0019 line 17: "Every change goes through a PR, docs-only changes included". ARCH 980 says the same. ADR 0018 gate: no release while a `main-guard` issue is open.
- IMPLEMENTATION_PLAN 906 (still in the 4:12:53 PM file): each HUMAN_STEPS_LOG append "goes in through a docs-only PR (which skips the CI run)". The plan's PR-title check (T30) lives inside `fast` (861).
- Effect: every docs-only merge (HUMAN_STEPS_LOG rows under T8/T32, doc fixes) opens a `main-guard` issue, which freezes merges and blocks releases. Docs-only PR titles never get the T30 check.
- Fix (Architect): let `provenance` accept a PR whose diff is docs-only when `fast` was skipped by its path filter, or run a tiny always-on job (title check only) for docs-only PRs and require that instead. Update ARCH §16.1/§16.3, ADR 0019, and the TM-35 row. The Engineer then mirrors the change in plan §5.6, §6.2, and 906.

**CR-36 (Major; QA): AC-EM-28 contradicts AC-EM-51 and ARCH on a reply plus Resolve in one action.**
- AC-EM-28 (293): the email "contains X and the secure ticket link", with the example "reply + Resolved (AC-EM-23)".
- AC-EM-51 (332): the Resolved email "contains exactly one secure link, a reopen link … and no 7-day notification link", with the example "staff reply + Resolved in one action". ARCH 625: "Resolved email (including a reply + Resolve in one action): one `reopen` token".
- Effect: a correct build fails AC-EM-28.
- Fix: in AC-EM-28 say "the secure ticket link (for reply + Resolved: only the reopen link, AC-EM-51)", or drop that example from AC-EM-28.

**CR-37 (Major; QA): AC-LINK-19 asserts text from the wrong page variant, and an identical page that can't be identical.**
- AC-LINK-19 (256) requires "… If nothing arrives, you may have asked for several links in a short time. Please wait an hour and try again." That sentence is from DESIGN C-04 **variant B** (528, after "Email me a new link"). The lookup page is **variant A**, and its line is only "It can take a few minutes to arrive. Check your spam or junk folder too." (520), followed by "Still nothing? Make sure you used the same email address you entered when you submitted the ticket." (521).
- Variant A also repeats the typed ticket number ("Look for an email called "Your secure link for ticket {reference as typed…}"", 519). The three lookups in LINK-19 use different numbers (the unknown one has to), so the pages differ by that number.
- Fix: quote variant A (518–521), and say the bodies and pages are identical "apart from the echoed ticket number" (or use the same typed number with different emails for the 202 comparison).

**CR-38 (Major at 4:12:04 PM; Engineer): RESOLVED during the sweep (plan 4:12:53 PM).** The plan's support-bundle task (M7-T06) and H-22 row described ARCH's superseded 4:08 PM spec (`/opt/helpdesk/support/helpdesk-support-<YYYYMMDD-HHMM>.tar.gz`, root-only). ARCH §12.5 revision 5 (766–777, 4:09:46 PM) and ADR 0012 specify one fixed-name `helpdesk-support-bundle.zip`, overwritten each run, in the `sudo` user's home (or `SUPPORT_BUNDLE_DIR` / `--to`, never inside `BACKUP_TARGET_DIR`). Plan M7-T06 (683–688), §5.5a (804) and the §7 H-22 row (898) now follow ARCH revision 5. One small leftover: the plan doesn't list `SUPPORT_BUNDLE_DIR` (ARCH §14) under M1-T04 config validation, including the refusal inside `BACKUP_TARGET_DIR`. It may belong in M7-T06 instead; the Engineer should say where.

**CR-39 (Minor; Engineer): plan bookkeeping.** PLAN 942 says "threat rows are TM-1..TM-32"; ARCH now has TM-1 … TM-35 (TM-34 support bundle, TM-35 release path). Update the range and cite TM-34/TM-35 in M7-T06 and M7-T03.

**CR-40 (Minor; Architect): ARCH internal leftovers.** G44 (1320) still says "renamed TM-1 … TM-32", but 931 says TM-1 … TM-35. §3.3 (152), G11 (1280) and ADR 0005 line 13 still call the title format "pending Designer confirmation". DESIGN rev 6 now specifies it (1059, 1080), so drop that once OQ-48 is adopted (ND-7).

**CR-41 (Minor; Project Lead): naming note range.** REQUIREMENTS_DISCOVERY 133: "threat-model rows are renamed TM-1..TM-32". ARCH has TM-1 … TM-35. Say "TM-n" without an upper bound.

**CR-42 (Minor; Product Designer): DESIGN rev 6 leftovers.**
- 41: "Items still labeled PROPOSED … (the Q3 unread indicator … and the P8 'closes after 14 days' line)". Q3 is now T27/T28, and P8 is LOCKED with N days.
- 1562 (traceability Q3): "unread indicator PROPOSED … §4.16 A-01 to A-04 … indicator OQ-28". It should cite T27/T28 and A-01 to A-05.
- C-16 (1727): "ARCH §15 threat rows are T1-T32; team decisions are T1-T17". Mark it RESOLVED (ARCH TM-1 … TM-35).
- C-17 (1728): "EMAIL owner to refresh §10". EMAIL §10 is refreshed ("all closed as of pass 4"), so mark it RESOLVED.
- Reset-password dialog (1381–1385): it has no helper or error copy for the 15-character rule, which AC-ROLE-18 needs for the "Admin resets password" flow. Add the W-09 helper and error (1354, 1357) or say they apply.

**CR-43 (Minor; QA Lead): AC rev 9 bookkeeping.**
- AC-LC-54 (172) still ends "(An app-level badge or count: OQ-17.)". OQ-17 is settled by T28 (LC-55–58).
- AC-LC-58 (176) says the badge updates after `GET /internal/tickets/counts`. ARCH uses `GET /internal/me/attention-count` (523), which refreshes on focus and right after the user's own actions (150). The 60-second bound still holds.
- AC-EM-37's TBD note (318) lists EMAIL's event words without "Cancelled" (EMAIL 550).
- Source ranges: 12 "G1–G44" (ARCH now G1–G51), 13 "0001–0017" (now 0019), 21 "T1–T29" (now T32), 1094 "TM-1..TM-33" (now TM-35).
- Eleven "TBD: wording pending" placeholders can now be filled (§6). AC-LC-56 is resolved by DESIGN rev 6.
- Optional: there's no AC for the T32 support bundle (PLAN M7-T06 notes "built per T32, no AC").

**Checked during this sweep and already resolved (not counted):**
- At 4:07 PM ARCH and ADR 0005 capped the taskbar badge at "9+" (DESIGN: "99+") and kept the last count while offline (DESIGN: no badge when the count is unknown). ARCH 150–152 and ADR 0005 (4:09:46 PM) now match DESIGN (1–99, "99+", cleared when no count is known).
- IMPLEMENTATION_PLAN was built from ACCEPTANCE rev 8 and missed AC-LC-55 to -58, used `release.yml` `v*.*.*`, opened a `blocked` issue from `main-guard`, and listed Q-D1/Q-D2/Q-P1–P4/Q-P6/Q-P7/Q-P8 and "pending OQ-14" as open. All fixed by 4:12 PM. My own traceability check of the final plan gives **457 defined, 457 planned, 0 uncovered, 0 unknown**.
- **AC-GEN-17 would pass now.** A scan of DESIGN rev 6 customer screens (§3, C-00 to C-11) and EMAIL C1–C5 bodies and subjects finds no "request" and no customer-facing "reference number". The only hits are staff-side (W-06 "Privacy notice: not requested", C-11 staff hand-off "Copy reference") and spec prose.
- Hot spots re-checked and consistent across docs: T18 lifetimes (ARCH 624, DESIGN 188, EMAIL OQ-16, AC LINK-07/-14/-15); T25 two links (ARCH 625, DESIGN E-02 733, EMAIL C3, AC-EM-24/-49); T26b "Support team" (ARCH TM-33, EMAIL 140/206, DESIGN, AC-VIS-17/EM-50); T26c (ARCH PATCH 422, DESIGN 1377, AC-ROLE-28); T29 (ARCH §14 refuses below 100 and above 500, AC-EM-52, PLAN M1-T04); T30/T31 (ADR 0014/0018/0019, PLAN §5.2/§5.3); privacy checkbox off by default (B10); 15-character passwords; reopen window 1–14; sender name "Help Desk" (T21); DEFERRED items not built.

## 5. Needs a decision

- **ND-7 (Project Lead): adopt DESIGN OQ-48 as a team decision?** DESIGN rev 6 (1709) set two Designer defaults that T28 doesn't cover. (1) Counts over 99 show as "99+" on the badge and as "(99+) {site name}" in the title. (2) While the count is unknown (signed out, loading, server unreachable), there's no badge and the title is just "{site name}", never an old number. ARCH 150–152 and ADR 0005 already build exactly this but call it "pending Designer confirmation". Adopting it closes OQ-48 and lets ARCH drop that note (CR-40). AC-LC-56 to -58 don't test these two edges, so QA would add 100 → "99+" and unknown → hidden examples.
- **ND-8 (Project Lead, with Architect + Designer): what does `needs_attention` mean for the T28 count?** (a) Does a brand-new ticket with no customer reply count, as in ARCH 170/194? (b) Does just opening a ticket clear the flag (ARCH "opens/marks read"), or only "Mark as seen" and a staff reply (DESIGN 4.8.4)? Either works technically. The choice changes the badge number and the ● "Customer replied" wording. This affects CR-34.

## 6. Exact strings for QA's TBDs (ACCEPTANCE rev 9)

`{x}` values come from settings. `{15}` is `/auth/policy`'s minimum, so it renders "15". `{{test_tag}}` is empty in production.

| AC | Use this text | Source |
|---|---|---|
| AC-EM-34 | Whole templates, subject plus body: C1 (EMAIL 214–246), C2a (247–270), C2b (271–294), C3 (295–333), C4 (334–371), C5 (372–411); alerts A1 (423–452), A2 (453–483), A3 (484–514), A4 (515–546), A5 (547–577); system S1–S3 (582–627) if "admin alert" includes them. Ticket-event subject: `{{test_tag}}[{{ticket_id}}] Your {{product_name}} support ticket` (218/299/338/376) | EMAIL pass 5 |
| AC-EM-36 | Lookup: `{{test_tag}}Your secure link for ticket {{ticket_id}}` (251). "Email me a new link": `{{test_tag}}Your new link for ticket {{ticket_id}}` (275) | EMAIL C2a, C2b |
| AC-EM-37 | `{{test_tag}}[{{site_name}}] <Event> {{ticket_id}}: {{ticket_subject_short}}`. Events: "New ticket" (426), "Customer reply" (456), "Reopened" (487), "Reply on Resolved" (518), "Cancelled" (550). Subject cut: first 60 characters (149). The AC's `[Help Desk]` holds only for the default site name | EMAIL §7 |
| AC-EM-44 | No-message placeholder: `(no message)` | EMAIL 164 (also 513, 576) |
| AC-EM-47 | Page title "Open {ref} · {site name}"; H1 "Opening {ref} in the {site name} app…"; button "Open in the {site name} app"; "Nothing happened? Open the {site name} app on your computer and search for {ref}." + button "Copy reference" → "Copied" (2 s); "Don't have the app yet? [Download it]"; "Open in the browser instead" (only when the browser version is on) | DESIGN C-11, 846–851 |
| AC-ROLE-18 | First-run W-02: helper "At least {15} characters." (972), error "Your password needs at least {15} characters." (976). Own change W-04: helper "At least {15} characters." (1019), error "Your password needs at least {15} characters." (1021). Admin adds user W-09: helper "At least {15} characters. Share it with them privately. They'll choose their own password when they first sign in." (1354), error "The password needs at least {15} characters." (1357). **Admin resets password: no copy yet** (1381–1385; CR-42), so keep TBD for that flow only | DESIGN |
| AC-PRIV-03 | Label "I've read the [Privacy Notice] (opens in a new tab)." (required, marked * in the wireframe, 324) | DESIGN C-01, 370 |
| AC-PRIV-14 | Error "Please confirm you've read the Privacy Notice." | DESIGN C-01, 384 (also 341) |
| AC-PRIV-24 | Footer "We don't use tracking or analytics cookies." (always shown) | DESIGN C-00, 278 |
| AC-FORM-13 | Page title "Ticket received · {site name}"; H1 "Thanks, we've received your ticket"; "Your ticket number is" / `{HD-XXXXXX}` / "Copy"; "We've sent a confirmation to {email address, in full} with a secure link to your ticket." Email: "Your ticket number is {{ticket_id}}." | DESIGN C-02, 431–441 (433, 436); EMAIL C1 223 |
| AC-OPS-38 | "Backups are on the same disk as the data. Copy them somewhere else or choose a separate drive." (installer and health page) | ARCH 789; DESIGN W-15, 1549 |
| AC-LC-56 | **Resolved by DESIGN rev 6** (already sent to QA): "({n}) {site name}", e.g. "(3) Help Desk"; "(99+) {site name}" over 99; "{site name}" at 0 | DESIGN 1059, 1080 |

## 7. Sign-off readiness

**Verdict: NOT READY.** No Blockers remain and all 33 round-1 findings are fixed. But four new Majors would still cause rework or a broken process: two ACs that a correct build fails (CR-36, CR-37), a `main-guard` rule that freezes merges and releases after every docs-only PR (CR-35), and an ARCH/DESIGN split on what the T28 badge counts (CR-34, ND-8). All four are small doc edits plus one decision. Once they're done and ND-7/ND-8 are settled, the remaining Minors don't block sign-off (READY WITH MINORS).

## 8. Files that changed during this re-sweep

- **DESIGN.md**: rev 5 → **rev 6 (4:05:19 PM)**. T28 app attention badge (W-05, 1057–1063; window title 1080) and new OQ-48. This resolved AC-LC-56's TBD.
- **ARCHITECTURE.md**: 3:58:58 PM → 4:07:12 PM (revision 4: ADR 0018/0019, T28–T32, TM-34/35, G48–G51) → **4:09:46 PM** (revision 5: badge aligned with DESIGN, support-bundle delivery, H-22 rewritten). New **adr/0018** (4:08:09 PM) and **adr/0019** (4:06:39 PM); **adr/0005, 0012, 0014, 0016** edited 4:07–4:09 PM.
- **IMPLEMENTATION_PLAN.md**: 4:03:09 PM → 4:08:26 → 4:11:32 → 4:12:04 → **4:12:53 PM**. Moved to AC rev 9, T1–T32 and ADRs 0001–0019; added the support-bundle task (now matching ARCH revision 5) and the T32 bug flow; release and guard rules now follow ADR 0018/0019. Final traceability: 457 defined, 457 planned, 0 uncovered, 0 unknown.
- **ACCEPTANCE_CRITERIA.md** (rev 9, 4:04:13 PM) and **REQUIREMENTS_DISCOVERY.md** (T1–T32, 4:04:41 PM) didn't change after the re-sweep started reading them. **EMAIL_AND_WORDING.md** and **HUMAN_STEPS_LOG.md** didn't change.
- **CONSISTENCY_REPORT.md** (this file) is the only file the Doc Steward edited.

---

## Re-sweep 3 (targeted), Oct 8, 2026, 11:50 AM ET

**Scope (per RESOURCE_EFFICIENCY_POLICY):** only the edits made since Re-sweep 2: T33–T39, CR-34 to CR-43, and the new BETA_USER_TEST.md. Checked with targeted searches, not a full re-read. Files as checked: REQUIREMENTS (T1–T39, Oct 6 4:27 PM), ARCHITECTURE (rev 7, 4:18 PM), DESIGN (rev 10, 4:27 PM), EMAIL_AND_WORDING (pass 5, 3:57 PM), ACCEPTANCE_CRITERIA (rev 10, 510 ACs, 4:23 PM), IMPLEMENTATION_PLAN (4:21 PM), BETA_USER_TEST (4:26 PM).

**Verdict: NOT READY. Two Majors remain, both small doc edits.**

### Round-2 findings
| CR | Status | Evidence |
|---|---|---|
| CR-34 | Fixed | ARCH §4 (line 197), DESIGN 4.8.4 and plan line 960 all follow T34/T35 |
| CR-35 | Fixed | `pr-meta` and docs-only `provenance` appear in ARCH, ADR 0019 (lines 12 and 18) and the plan |
| CR-36 | Fixed | AC-EM-28 (line 323): reply + Resolved carries only the reopen link |
| CR-37 | Fixed | AC-LINK-19 (line 286) quotes C-04 variant A |
| CR-38 | Fixed | Fixed in Re-sweep 2 |
| CR-39 | Fixed | Plan uses TM-1..TM-36 (TM-34/35/36 cited) |
| CR-40 | Fixed | ARCH line 953 and G44 say TM-1…TM-36; only a historical changelog line still says "pending" |
| CR-41 | Fixed | REQUIREMENTS line 140: "TM-n (no fixed upper bound)" |
| CR-42 | Fixed, one leftover | DESIGN C-16 (line 1748) still says "TM-1..TM-35" (see CR-49) |
| CR-43 | Fixed | AC line 29 ranges T1–T35, G1–G53, ADRs 0001–0019, TM-1..TM-36 |

### New findings
| CR | Sev | Owner | Issue |
|---|---|---|---|
| CR-44 | **Major** | Engineer | IMPLEMENTATION_PLAN was built from AC rev 9 (457 ACs) and still claims 457/457 (lines 5, 15, 767, 997). AC rev 10 has 510 ACs, and **53 aren't mapped to any task**: AC-EM-53, AC-LC-59 to LC-78 and AC-OPS-42 to OPS-73. The plan's own coverage script (§4.3) would fail. |
| CR-45 | **Major** | Architect | T38: ARCH §20, milestone 13 (line 1380) still lists a "`desktop-edge` pre-release". T38 and ADR 0018 say there are no pre-releases of any kind. |
| CR-46 | Minor | Architect | T36: ARCH sets actor = system on the `auto_closed` event (line 674), but doesn't say what actor goes on the `needs_attention_cleared` event for auto-close or customer cancel. T39: ARCH §12.5/§14 (lines 772 and 897) don't mention resolving symlinks or refusing a bad value at startup. The plan (M1-T04, M7-T06) already does both. ARCH hasn't changed since T36–T39 were sent to the Architect. |
| CR-47 | Minor | Support Ops | T37: EMAIL line 149 defines `{{ticket_subject_short}}` as "cut to 60 chars", without T19's rule (cut at a word boundary, hard-cut a single long word, add "…"). |
| CR-48 | Minor | QA | AC rev 10 came before T36–T39. OQ-19 to OQ-22 (lines 994–995) are still open, AC-EM-53 still has the "…" marker TBD, AC-OPS-46 still has symlink/startup TBD, and no AC covers the T36 "System" actor. |
| CR-49 | Minor | Designer | C-16 (line 1748) says "TM-1..TM-35"; it should say TM-1..TM-36 or just TM-n. |

**BETA_USER_TEST.md:** no conflicts in the targeted checks. Flag tooltips match DESIGN line 1087 and AC-LC-62, customer copy uses "ticket", and "Privacy requests" is the allowed staff label.

**Needs a decision:** none.

**Routing:** under the policy, fix requests went out only for the two Majors (CR-44 to the Engineer, CR-45 to the Architect). The Minors are listed here for their owners to pick up. Once CR-44 and CR-45 are fixed, the verdict becomes **READY WITH MINORS**.

---

## Re-sweep 3 follow-up (targeted), Oct 8, 2026, 11:55 AM ET

Scope: only the fix edits reported for CR-44 to CR-49 (IMPLEMENTATION_PLAN 11:48, ARCHITECTURE rev 8, ACCEPTANCE_CRITERIA rev 10.1, EMAIL_AND_WORDING line 149, DESIGN C-16). No other files re-read.

| ID | Owner | Status | Evidence |
|---|---|---|---|
| CR-44 | Engineer | Fixed | Plan built from AC rev 10; lines 5, 15, 767, 997 read 510; §4.3 result 510/510, 0 uncovered; EM-53, LC-72, OPS-69 mapped in task ACs lines and Appendix A |
| CR-45 | Project Lead | Fixed | No `desktop-edge` left in ARCHITECTURE; §20 milestone 13 lists plain-SemVer releases only |
| CR-46 | Architect | Fixed | ARCH rev 8: `actor_type` system for automatic flag clears (T36, line 340, rev note 1510); `realpath` + startup and run-time refusal for `SUPPORT_BUNDLE_DIR`/`--to` with symlink tests (lines 772, 897, 1027) |
| CR-47 | Project Lead | Fixed | EMAIL line 149 states the T37/T19 cut rule |
| CR-48 | QA | Fixed | AC rev 10.1: OQ-19 to OQ-22 resolved (T36–T39), AUD-26 has "System", EM-53 has the "…" examples, no TBD (OQ-n) left |
| CR-49 | Project Lead | Fixed | DESIGN C-16 says "TM-n (no fixed upper bound)" |

### New Minor findings (listed only; no fix requests sent, per RESOURCE_EFFICIENCY_POLICY)

| ID | Severity | Owner | Finding |
|---|---|---|---|
| CR-50 | Minor | QA | AC-LC-72 still says error code "TBD: Architect" and that ARCH §4 allows Mark as seen on Closed/Cancelled. ARCH lines 176/193 already reject it with `409 TICKET_READ_ONLY`. Same stale note at AC lines 874 and 1193. |
| CR-51 | Minor | Engineer | Plan line 5 says decisions "T1–T35" (now T1–T39); lines ~960 and ~982 still say "rev 9". Engineer deferred to post-sign-off edits. |
| CR-52 | Minor | Engineer + QA | AC-OPS-69 to -71 test live SSH/firewall/fail2ban behaviour; M7-T08's planned test checks config only (ARCH §16). Team needs to pick a networked CI test or an on-VM check. Not a Brandon decision. |
| CR-53 | Minor | Engineer | AC-OPS-53 needs a migration warning on downgrade; M7-T02's scope lists only the confirmation. Engineer says the PR will add it. |

Note: the Engineer's point that AC-EM-53 hadn't settled the "…" is already resolved in AC rev 10.1.

**Needs a decision from Brandon:** none.

**Verdict: READY WITH MINORS.** No Blockers or Majors remain. CR-50 to CR-53 can be cleaned up alongside the post-sign-off edits.
