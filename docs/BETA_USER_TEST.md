# Help Desk: Beta User-Test Checklist (for Brandon)

**What this is:** a short, hands-on check of the beta Help Desk before you give your final OK (team decision T8: you give final acceptance at user testing). You'll play two people: a **customer** using the support website, and **staff** using the Help Desk app. It doesn't cover everything. The rest is checked by automated tests (see the end).

**Time:** about 30 minutes in total. Each step shows a rough time.

**Based on:** ACCEPTANCE_CRITERIA.md revision 10. Each step lists the acceptance criteria it spot-checks ("Checks: AC-…"), so the team knows what to look at if a step fails.

---

## Before you start (about 2 minutes)

You need:
- **The beta website address.** It's the address you use for the app, `http://<vm-ip>:8380` (for example `http://192.168.1.50:8380`). Use it on your home network only.
- **The Help Desk app on your Windows computer**, signed in with your Administrator account.
- **Two email inboxes you can read:**
  - the email address of your Administrator account. Staff alert emails go there.
  - a **different** address that plays the "customer", such as a personal address.

  Beta emails come from the test mailbox support.trouthomelab@gmail.com. Their subjects start with **[TEST]** because this isn't the live system yet. If an email doesn't show up within a few minutes, check the spam or junk folder.
- **A phone** on your home Wi-Fi, for step 11.
- **Two small files:** a picture such as a screenshot (`.png` or `.jpg`) and a spreadsheet saved as `.csv`.
- **A second email address you own** for a test Agent (step 12). It must be different from your Administrator address.

How to use the checklist: do the steps in order, because later steps use the ticket from step 1. Tick **Pass** if you see what's described, or **Fail** if you don't. Small differences in layout are fine. The words in quotes should match.

---

## 1. Submit a ticket on the website (about 3 minutes)

**Do:** on your computer, open the beta website. Fill in the ticket form with the **customer** email address, a subject like "Beta test ticket", and a short description. Pass the quick "I'm not a robot" check and click **"Submit ticket"**.

**You should see:**
- A page headed "Thanks, we've received your ticket", with "Your ticket number is" followed by a number like `HD-7K3M9Q`, and a **Copy** button.
- The line "We've sent a confirmation to …" showing the customer email address in full.
- A few minutes later, an email in the customer inbox with the subject "[TEST] [HD-…] Your Device Monitor support ticket" (or your product's name). It contains "Your ticket number is HD-…" and a link to the ticket.

Write the ticket number down. You'll need it later.

- [ ] Pass  - [ ] Fail

Checks: AC-FORM-01, AC-FORM-13, AC-EM-01, AC-EM-34, AC-EM-45

## 2. The new ticket in the app: "Needs attention" and the badge (about 2 minutes)

**Do:** look at the Help Desk app's ticket list (click Refresh if needed). Point at the dot next to your new ticket, then open the ticket.

**You should see:**
- The ticket is in the list with status **New**, no one assigned, and a dot (●). Pointing at the dot shows "Needs attention: new ticket".
- Inside the ticket: "● Needs attention" with the reason "New ticket".
- The app's window title starts with the count of tickets that need attention, for example "(1) Help Desk". The app's taskbar icon shows the same number as a small badge.
- An email to your Administrator inbox with a subject like "[TEST] [Help Desk] New ticket HD-…: Beta test ticket".

- [ ] Pass  - [ ] Fail

Checks: AC-LC-01, AC-LC-59, AC-LC-61, AC-LC-62, AC-LC-55, AC-LC-56, AC-EM-08, AC-EM-37

## 3. Look up the ticket with its ticket number (about 2 minutes)

**Do:** on the website, choose **"Check on a ticket"**. Enter the ticket number and the customer email address, then send.

**You should see:**
- A "Check your email" page saying "If the ticket number and email address match one of our tickets, we've sent a secure link to that email address. The link works for 60 minutes."
- An email in the customer inbox titled "[TEST] Your secure link for ticket HD-…". Its link opens the ticket page, showing your subject and description.

- [ ] Pass  - [ ] Fail

Checks: AC-LINK-01, AC-LINK-19, AC-LINK-02, AC-EM-36, AC-LINK-03, AC-VIS-02

## 4. Staff accept and reply, and the "Support team" label (about 3 minutes)

**Do:** in the app, open the ticket and click **"Assign to me"**. Then write a reply in **"Reply to customer"** mode and click **"Send reply to customer"**.

**You should see:**
- The status changes to **Open** and you are the assignee.
- The "Needs attention" flag goes away, and the window title and badge count go down by one. At 0, the title is just "Help Desk" with no badge.
- An email in the customer inbox that starts "We replied to your ticket HD-…", shows your reply under "Support team wrote:", and is signed with the sender name (by default "Help Desk").
- On the customer's ticket page (reload it), your reply is labeled **"Support team"**. Your own name doesn't appear anywhere.

- [ ] Pass  - [ ] Fail

Checks: AC-LC-02, AC-LC-65, AC-LC-57, AC-EM-02, AC-EM-34, AC-EM-50, AC-VIS-03

## 5. An internal note stays hidden from the customer (about 1 minute)

**Do:** in the app, switch the composer to **"Internal note"**, type "Secret staff note", and click **"Add internal note"**. Then reload the customer's ticket page.

**You should see:**
- In the app, the note is marked as internal (not visible to the customer).
- On the customer page, nothing about the note: not the text, and no sign that a note was added. No new email arrives in the customer inbox.

- [ ] Pass  - [ ] Fail

Checks: AC-VIS-07, AC-EM-02

## 6. The customer replies: the flag and badge come back (about 2 minutes)

**Do:** on the customer's ticket page, write a reply and send it. Then watch the app for up to a minute, without clicking anything.

**You should see:**
- On the customer page, the reply appears, labeled **"You"**.
- Within about a minute, the app shows the dot on the ticket again, and the window title and badge show 1. Inside the ticket, the reason is "The customer replied". Pointing at the dot shows "Needs attention: customer replied".
- An email to your Administrator inbox with a subject like "[TEST] [Help Desk] Customer reply HD-…: …".

- [ ] Pass  - [ ] Fail

Checks: AC-LC-10, AC-LC-61, AC-LC-62, AC-LC-58, AC-VIS-04, AC-EM-09

## 7. Attachments: one allowed, one blocked (about 2 minutes)

**Do:** on the customer's ticket page, attach the **picture** to a reply and send it. Then try to attach the **.csv** file.

**You should see:**
- The picture is sent with the reply. In the app it may show as being scanned for a short time, and then it opens normally.
- The .csv file is refused with the message: "*(file name)* can't be attached. You can attach images, PDFs, text or log files, and ZIP files."

- [ ] Pass  - [ ] Fail

Checks: AC-ATT-02, AC-ATT-05, AC-ATT-10, AC-ATT-12

## 8. Resolve the ticket, and the Resolved email (about 2 minutes)

**Do:** in the app, change the ticket's status to **Resolved**.

**You should see:**
- An email in the customer inbox: "We think the issue on ticket HD-… is fixed, so we've marked it Resolved." It has a single link to reopen the ticket, and says until when it can be reopened.
- On the customer's ticket page (reload it), the banner reads "We think this is fixed. If it isn't, you can reopen this ticket until …", with a **"Reopen ticket"** button.

- [ ] Pass  - [ ] Fail

Checks: AC-EM-04, AC-EM-51, AC-EM-34, AC-VIS-15, AC-LC-64

## 9. The customer reopens the ticket (about 2 minutes)

**Do:** open the reopen link from the Resolved email. A box titled "Reopen this ticket?" appears. Click **"Reopen ticket"**.

**You should see:**
- The status is **Open** again, and the history shows "You reopened this ticket".
- In the app: the ticket is still assigned to you, the flag is back with the reason "The customer reopened this ticket", and the count goes up by one.
- An email to your Administrator inbox with a subject like "[TEST] [Help Desk] Reopened HD-…: …".

- [ ] Pass  - [ ] Fail

Checks: AC-EM-05, AC-LC-14, AC-LC-15, AC-LC-60, AC-LC-61, AC-VIS-14, AC-EM-37

## 10. The customer cancels the ticket (about 2 minutes)

**Do:** on the customer's ticket page, click "Don't need help anymore? Cancel this ticket". In the box titled "Cancel this ticket?", click **"Yes, cancel ticket"**.

**You should see:**
- The page shows the ticket as **Cancelled**, with "This ticket was cancelled, so you can't reply to it." and no reply box. The history shows "You cancelled this ticket".
- No email to the customer about the cancel.
- In the app: an alert email arrives in your Administrator inbox with a subject like "[TEST] [Help Desk] Cancelled HD-…: …". The ticket has no "Needs attention" flag and no "Mark as seen" button, and the badge count doesn't include it.

- [ ] Pass  - [ ] Fail

Checks: AC-LC-47, AC-LC-30, AC-LC-70, AC-LC-73, AC-LC-74, AC-EM-43, AC-EM-37, AC-VIS-14

## 11. A quick look on your phone (about 2 minutes)

**Do:** on your phone (on home Wi-Fi), open the beta website address. Look at the ticket form, then open the "Check on a ticket" page.

**You should see:**
- The pages fit the phone screen in one column, with no sideways scrolling. Buttons are easy to tap, and the "Submit ticket" button runs the full width of the screen.
- The footer says "We don't use tracking or analytics cookies."

- [ ] Pass  - [ ] Fail

Checks: AC-GEN-04, AC-GEN-05, AC-PRIV-24

## 12. Add an Agent, and the last-Administrator protection (about 3 minutes)

**Do:** in the app, go to **Users** and click **"Add user"**. Enter a name and your second email address, choose the role **Agent**, and click **Generate** to make a temporary password. Before saving, note the help text under the password. Click **"Add user"**. Then try two things on **your own** account: turning it off, and changing your role from Administrator to Agent.

**You should see:**
- Only two roles to pick from: Agent and Administrator.
- The help text under the password reads "At least 15 characters. Share it with them privately. They'll choose their own password when they first sign in."
- The new Agent appears in the list as **Active**.
- Turning off your own account is refused with "You can't turn off your own account."
- Removing your own Administrator role is refused with "There must always be at least one active Administrator." You are still an Administrator afterwards.

- [ ] Pass  - [ ] Fail

Checks: AC-ROLE-01, AC-ROLE-18, AC-ROLE-22, AC-ROLE-23

## 13. Privacy export (about 1 minute)

**Do:** in the app, go to **"Privacy requests"**. Click **"Export all data…"** for the customer email address, then **Export**, and save the file.

**You should see:** "Export saved to …", and a ZIP file that contains your test ticket. **Don't** use "Permanently delete all tickets…" in this test.

- [ ] Pass  - [ ] Fail

Checks: AC-PRIV-04

## 14. Backup status (about 1 minute)

**Do:** in the app, go to **"System health"**.

**You should see:** a **Backups** row with an icon and a word ("Working", "Needs attention", or "Not working") and the time of the last backup. If your backups are on the same disk as the Help Desk data, it shows: "Backups are on the same disk as the data. Copy them somewhere else or choose a separate drive." (That warning is expected if you kept the default backup folder.) If the beta was installed today, the first backup may not have run yet (backups run nightly at 3:00 AM ET). If so, note what the row says.

- [ ] Pass  - [ ] Fail

Checks: AC-OPS-38, AC-OPS-05

---

## Covered by automated tests, not this checklist

These need a controllable test clock, special test files, or code, so the team's automated tests check them instead:
- Automatic closing after the reopen window (default 14 days), and link expiry times (60 minutes, 7 days, 14 days at most).
- Virus-scan blocking (with a harmless test virus file), upload size and count limits, and rate limits.
- Every exact email text and every screen message, every status combination, and staff access rules that are checked behind the scenes.
- The badge's "99+" cap, and the badge clearing when the app is offline or signed out.
- Backups and restore tests, the support bundle, the release and update safety checks, and the beta VM's SSH settings.
- The privacy notice checkbox (it's off by default) and permanent deletion of a customer's tickets.

---

## If a step fails

Keep going with the other steps if you can. For each failure, write down:
1. the **step number**;
2. **what you saw** (the exact words on screen, if any), and what you expected;
3. a **screenshot**, if you can take one.

Send these to the Project Lead in the chat. The Project Lead files the issue for the Engineer (T32) and may ask you for a support bundle.

---

## Sign-off

| | |
|---|---|
| Date | |
| Tester | Brandon Trout |
| Steps passed | ___ of 14 |
| Overall result | [ ] Pass  [ ] Fail |
| Notes | |
