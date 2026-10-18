# Help Desk / Support Ticket Application
## Product Requirements Baseline

**Status:** Initial product decisions locked for architecture/discovery handoff  
**Purpose:** Define WHAT the product should do before architecture and implementation decisions are made.

---

## 1. Product Purpose

The application is a standalone support-ticket tracking system intended for customers of the owner's software products.

Its primary purpose is to:

- Receive support requests from customers.
- Store and organize ticket data.
- Track ticket ownership and status.
- Allow the internal support user to manage and resolve tickets.
- Preserve customer-visible communication and internal support history.
- Allow customers to check ticket status without requiring a customer account.

The application itself does not diagnose or resolve support issues. Human support personnel are responsible for investigation and resolution. The software acts as the tracking, communication, and record-management system.

The product must initially operate independently from Device Monitor or any other product.

---

## 2. Intended Product Shape

The initial product consists conceptually of:

### Public Support Website
Customer-facing interface used to:

- Submit a new support ticket.
- Receive a ticket reference number.
- Look up an existing ticket.
- View customer-visible ticket status and updates.
- Reply to an existing ticket.
- Submit additional information.
- Upload permitted attachments.
- Cancel an eligible ticket.
- Reopen an eligible resolved ticket.

Customers do not create user accounts.

### Windows Support Application
The primary internal application used to:

- View and manage tickets.
- Accept or assign work.
- Track which technician is responsible for a ticket.
- Update ticket status.
- Set or change internal priority.
- Reply to customers.
- Add private internal notes.
- Search and filter tickets.
- Review ticket history.
- Perform administrative functions.

The Windows application is the primary internal management client for the initial release.

### Backend / Authoritative Data Store
The support system must have a backend that stores authoritative support-ticket data.

Internal/backend data is private and accessible only to authorized internal users.

The backend must not be designed around the assumption that the Windows application will always be the only management client.

### Future Android Management Application
A future Android application may be created so authorized internal support personnel can manage tickets while away from the Windows application.

The Android application is not an initial implementation requirement, but the product must not be designed in a way that prevents such a client from existing later.

---

## 3. Organization Model

The system is initially a single-company support system.

It is not intended to be a multi-tenant help-desk SaaS platform.

Customers submit requests to one support organization.

---

## 4. Customer Identity Model

Customers do not create accounts.

A customer submits a ticket through the public website and receives a unique ticket reference number.

Tickets are associated with customer contact information, including at minimum an email address.

Ticket lookup must not rely solely on possession of a reference number if doing so would expose private ticket information. The exact verification mechanism is intentionally not yet locked and should be raised during requirements discovery.

Customer tickets are personal to the submitter. Shared organization/customer accounts are not part of the initial product.

---

## 5. Initial Internal Roles

### Administrator

The initial internal user is an Administrator.

The initial Administrator:

- Has full access to all tickets.
- Can accept and assign tickets.
- Can reply to customers.
- Can add internal notes.
- Can change ticket status.
- Can change internal priority.
- Can manage configurable support-system settings.
- Can perform administrative functions.
- Can reopen Closed tickets.
- Can restore Cancelled tickets.

The system must establish an initial Administrator account during initial setup.

The product should not hard-code a specific person's identity into the application.

### Future Agent / Support Representative

The product must support the concept of lower-privilege internal users later.

A future Agent or Support Representative should be able to perform normal ticket work without automatically receiving full administrative authority.

The detailed permission matrix is intentionally not yet locked.

---

## 6. Ticket Ownership / Technician Tracking

Tickets must track who is responsible for working them.

At minimum, ticket metadata must support:

- Current assigned technician/agent.
- Date and time the ticket was accepted or assigned.
- Who originally accepted the ticket.
- Assignment/reassignment history.

The system should distinguish between the current assigned technician and the historical record of who first accepted or previously owned the ticket.

Customers do not see the identity of the assigned technician.

---

## 7. Ticket Submission Rules

Customers submit tickets through the public support website.

The original customer-submitted subject and description become part of the permanent ticket record.

Customers cannot edit the original subject or description after submission.

Customers may add follow-up replies or additional information after submission.

The exact ticket-creation fields, validation rules, categories, attachment limits, and reference-number format are intentionally not yet locked.

---

## 8. Customer Visibility Rules

Customers may see:

- Their own ticket's customer-visible information.
- Current customer-visible ticket status.
- Customer-visible replies and updates.
- Their own submitted information and follow-up replies.
- Ticket history appropriate for customers.

Customers must not see:

- Internal notes.
- Internal priority.
- Assigned technician identity.
- Administrative/internal-only metadata.
- Internal-only audit details not intended for customers.

---

## 9. Internal Notes and Customer Replies

The system must distinguish between:

### Customer-Visible Replies
Messages intended to be visible to the customer.

### Internal Notes
Private messages or notes visible only to authorized internal users.

Internal notes are optional and may be added whenever appropriate.

A status change does not require a note.

---

## 10. Ticket Lifecycle

The initial lifecycle is:

**New → Open → In Progress → Waiting on Customer → Resolved → Closed**

A separate terminal state exists:

**Cancelled**

### New
The ticket has been submitted but has not yet been accepted/assigned to a technician.

### Open
A technician has accepted or been assigned responsibility for the ticket.

Acceptance should record the responsible technician and acceptance timestamp.

### In Progress
A technician is actively working on or investigating the ticket.

### Waiting on Customer
Support requires information or action from the customer before work can continue.

When the customer replies while the ticket is Waiting on Customer, the system automatically returns the ticket to **Open**.

### Resolved
Support believes the issue has been resolved.

A Resolved ticket remains reopenable by the customer for **14 days**.

### Closed
The ticket is finalized.

Customers can no longer reopen a Closed ticket.

If additional support is required after closure, the customer normally submits a new ticket.

An Administrator may reopen a Closed ticket.

### Cancelled
The ticket has been cancelled.

Cancellation does not delete the ticket or its history.

An Administrator may restore a Cancelled ticket.

---

## 11. Lifecycle Behavior

The following rules are locked:

- Internal staff may move tickets backward between normal workflow states when appropriate.
- A customer may cancel an eligible ticket.
- A customer may reopen a Resolved ticket for up to 14 days after resolution.
- After 14 days in Resolved status, the ticket should automatically transition to Closed.
- When a customer reopens a Resolved ticket, it should return to Open.
- When a customer replies while a ticket is Waiting on Customer, it should automatically return to Open.
- An Administrator may reopen a Closed ticket.
- An Administrator may restore a Cancelled ticket.
- Status changes do not require a reason or note.
- Internal notes remain available at all times where appropriate.

---

## 12. Audit / Activity History

The system must maintain a history of meaningful ticket activity.

At minimum, automatic history should capture events such as:

- Ticket creation.
- Ticket acceptance.
- Assignment.
- Reassignment.
- Status changes.
- Customer replies.
- Internal replies.
- Internal notes.
- Resolution.
- Customer reopening.
- Administrative reopening.
- Cancellation.
- Administrative restoration.
- Automatic closure after the resolution window.

The history should identify the actor and timestamp when applicable.

The exact audit-retention policy is not yet locked.

---

## 13. Priority and Customer-Reported Impact

Internal ticket priority exists as an internal support concept.

Customers do not see internal priority.

Customers should not automatically control the final internal priority value.

A separate customer-reported urgency/impact concept may be added, but the exact field and behavior are not yet locked.

Formal severity and priority do not need to be separate in the initial version unless later requirements discovery identifies a reason.

---

## 14. Product / Application Association

The support system is intended to support customers of the owner's software products.

A ticket should be able to identify which supported product the customer needs help with.

The exact product-management model and configuration behavior are intentionally not yet locked.

---

## 15. Authentication Direction

Customers do not authenticate through permanent customer accounts.

Internal users must be authenticated.

The specific authentication technology or mechanism is an implementation/architecture decision and is not defined here.

The exact customer ticket-lookup verification method remains an open product question.

---

## 16. Security / Privacy Expectations

At a product level:

- Internal ticket-management data must be restricted to authorized internal users.
- Customers must not be able to access other customers' tickets.
- Internal notes must never be exposed to customers.
- Internal priority and technician assignment must not be exposed to customers.
- Ticket lookup must include sufficient verification to avoid exposing ticket contents solely through guessable or leaked ticket identifiers.
- Attachments and other uploaded customer data must be handled as potentially sensitive support information.

Detailed security architecture is intentionally not defined here.

---

## 17. Future Device Monitor Integration

The Help Desk product must initially function independently from Device Monitor.

Future integration may provide support context such as:

- Device Monitor user/account ID.
- Registered device ID.
- Device Monitor app version.
- Android version.
- Device model.
- Diagnostic information.
- Logs.
- Troubleshooting data.
- Automatically generated support context.

No Device Monitor integration should be implemented or required by the initial standalone product.

The product design should simply preserve the ability to associate richer product/device context with a support ticket later.

---

## 18. Initial Scope Boundaries

The system should be realistic enough to become the actual support platform for the owner's software products.

It should not become unnecessarily enterprise-scale.

Avoid requiring:

- Multi-tenant SaaS architecture.
- Complex departmental structures.
- Call-center functionality.
- Full CRM functionality.
- Live chat.
- Enterprise approval chains.
- Artificially complex workflows.
- AI-driven support resolution.
- Architecture choices added only to increase development difficulty.

---

## 19. Intentionally Undefined Areas

The following areas are deliberately left unresolved so the development orchestrator can identify them and ask product questions before architecture/implementation begins:

- Exact ticket submission form fields.
- Exact ticket lookup verification method.
- Ticket reference number format.
- Ticket categories.
- Internal priority levels.
- Customer-reported urgency/impact fields.
- Attachment types and size limits.
- Notification behavior.
- Email notification details.
- Search/filter requirements.
- Dashboard/reporting requirements.
- Exact Agent permission matrix.
- Administrator configuration options.
- Account recovery behavior.
- Data retention/deletion policies.
- Knowledge-base behavior.
- Escalation/SLA rules.
- Canned responses.
- Customer satisfaction features.
- Exact automatic-close scheduling behavior.
- Exact error/edge-case handling.
- Product catalog/configuration behavior.

These are not omissions to be silently invented. They should be treated as open product decisions or proposed defaults.

---

## 20. Product vs. Implementation Boundary

This document defines product behavior and business requirements.

It does **not** define:

- Programming language.
- Framework.
- Database technology.
- API technology.
- Desktop UI framework.
- Web framework.
- Hosting provider.
- Deployment model.
- Microservice/monolith architecture.
- Repository structure.
- Git workflow.
- CI/CD strategy.
- Testing framework.
- Development task decomposition.

Those decisions belong to the architecture and implementation phase after sufficient requirements discovery.
