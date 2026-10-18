/**
 * Pure ticket rules from ARCHITECTURE §4, §14 and T1, T13, T34, T35.
 * Callers pass a reopen window already limited to 1–14 days (T2).
 */

export const STATUSES = [
  "new",
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
  "cancelled",
] as const;

export type Status = (typeof STATUSES)[number];

export const ACTIVE_STATUSES = [
  "new",
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
] as const satisfies readonly Status[];

export const TERMINAL_STATUSES = [
  "closed",
  "cancelled",
] as const satisfies readonly Status[];

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

/** Numeric limits from ARCHITECTURE §14, plus the T2 reopen-window cap. */
export const LIMITS = {
  IDEMPOTENCY_KEY_TTL_HOURS: 24,
  PASSWORD_MIN_LENGTH: 15,
  SETUP_CODE_TTL_DAYS: 7,
  SESSION_WEB_IDLE_HOURS: 12,
  SESSION_WEB_ABSOLUTE_DAYS: 7,
  SESSION_NATIVE_IDLE_HOURS: 12,
  SESSION_NATIVE_ABSOLUTE_DAYS: 30,
  LOGIN_MAX_FAILURES_PER_ACCOUNT_IP: 10,
  LOGIN_LOCKOUT_MINUTES: 15,
  LOGIN_MAX_FAILURES_PER_ACCOUNT_HOUR: 50,
  SECURE_LINK_LOOKUP_TTL_MINUTES: 60,
  SECURE_LINK_LOOKUP_TTL_MINUTES_MAX: 20_160,
  SECURE_LINK_NOTIFICATION_TTL_DAYS: 7,
  SECURE_LINK_NOTIFICATION_TTL_DAYS_MAX: 14,
  CUSTOMER_SESSION_IDLE_MINUTES: 120,
  CUSTOMER_SESSION_ABSOLUTE_HOURS: 24,
  RATE_LIMIT_SUBMIT_PER_IP_HOUR: 5,
  RATE_LIMIT_SUBMIT_PER_EMAIL_HOUR: 3,
  RATE_LIMIT_LOOKUP_PER_IP_HOUR: 10,
  RATE_LIMIT_LOOKUP_PER_EMAIL_HOUR: 3,
  RATE_LIMIT_LOOKUP_PER_REFERENCE_HOUR: 5,
  RATE_LIMIT_CUSTOMER_MESSAGES_PER_TICKET_HOUR: 20,
  EMAIL_MAX_PER_DAY: 400,
  EMAIL_MAX_PER_MINUTE: 20,
  EMAIL_ALERT_COALESCE_MINUTES: 10,
  EMAIL_ALERT_PREVIEW_CHARS: 500,
  EMAIL_ALERT_PREVIEW_CHARS_MIN: 100,
  EMAIL_ALERT_PREVIEW_CHARS_MAX: 500,
  ATTACHMENT_HARD_MAX_BYTES: 26_214_400,
  SCAN_TIMEOUT_SECONDS: 120,
  SCAN_MAX_ATTEMPTS: 10,
  ARGON2_MEMORY_KIB: 19_456,
  ARGON2_ITERATIONS: 2,
  ARGON2_PARALLELISM: 1,
  BACKUP_KEEP_DAILY: 7,
  BACKUP_KEEP_WEEKLY: 4,
  BACKUP_KEEP_MONTHLY: 12,
  REOPEN_WINDOW_DAYS_MIN: 1,
  REOPEN_WINDOW_DAYS_MAX: 14,
  REOPEN_WINDOW_DAYS_DEFAULT: 14,
} as const;

export const DISPLAY_TIMEZONE = "America/New_York";

export const AUTO_CLOSE_CRON = "*/15 * * * *";

const STAFF_STATUS_TARGETS: readonly Status[] = [
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
];

const CUSTOMER_REPLY_STATUSES: readonly Status[] = [
  "new",
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
];

const CUSTOMER_CANCEL_STATUSES: readonly Status[] = [
  "new",
  "open",
  "in_progress",
  "waiting_on_customer",
];

export type SetReason = "new_ticket" | "customer_reply" | "customer_reopen";

export type ClearReason =
  | "staff_reply"
  | "staff_status_change"
  | "marked_seen"
  | "auto_closed"
  | "customer_cancelled"
  | "staff_cancelled";

export type AttentionEffect =
  | { effect: "set"; reason: SetReason }
  | { effect: "clear"; reason: ClearReason; eventActor: "staff" | "system" }
  | { effect: "unchanged" };

export type Actor =
  | { kind: "anonymous" }
  | { kind: "customer" }
  | { kind: "agent"; id: string }
  | { kind: "admin"; id: string }
  | { kind: "system" };

export type Ticket = {
  status: Status;
  priority: Priority;
  assigneeId: string | null;
  assignedAt: string | null;
  firstAcceptedBy: string | null;
  firstAcceptedAt: string | null;
  needsAttention: boolean;
  needsAttentionReason: SetReason | null;
  resolvedAt: string | null;
  autoCloseDueAt: string | null;
  closedAt: string | null;
  customerEmail: string;
  emailConfirmedAt: string | null;
};

export type Command =
  | { action: "submit"; actor: Actor; customerEmail: string }
  | { action: "accept"; actor: Actor }
  | { action: "assign"; actor: Actor; assigneeId: string }
  | { action: "unassign"; actor: Actor }
  | { action: "set_status"; actor: Actor; to: Status }
  | { action: "set_priority"; actor: Actor; priority: Priority }
  | { action: "internal_note"; actor: Actor }
  | { action: "view"; actor: Actor }
  | { action: "mark_seen"; actor: Actor }
  | { action: "staff_cancel"; actor: Actor }
  | { action: "correct_email"; actor: Actor; email: string }
  | {
      action: "public_reply";
      actor: Actor;
      setStatus?: "waiting_on_customer" | "resolved";
    }
  | { action: "customer_reply"; actor: Actor }
  | { action: "customer_cancel"; actor: Actor }
  | { action: "customer_reopen"; actor: Actor }
  | { action: "auto_close"; actor: Actor }
  | { action: "admin_reopen"; actor: Actor }
  | { action: "admin_restore"; actor: Actor }
  | { action: "hard_delete"; actor: Actor };

export type TransitionContext = {
  now: string;
  /** Window already stored for this installation; 1–14 (T2). */
  reopenWindowDays: number;
};

export type ProblemCode =
  "INVALID_TRANSITION" | "TICKET_READ_ONLY" | "UNAUTHENTICATED" | "FORBIDDEN";

export type TransitionOk = {
  ok: true;
  ticket: Ticket | null;
  deleted: boolean;
  attention: AttentionEffect;
  customerEmail: boolean;
  staffAlert: boolean;
  confirmationResent: boolean;
  revokeCustomerAccess: boolean;
};

export type TransitionDenial =
  | {
      ok: false;
      httpStatus: 409;
      code: "INVALID_TRANSITION" | "TICKET_READ_ONLY";
    }
  | { ok: false; httpStatus: 401; code: "UNAUTHENTICATED" }
  | { ok: false; httpStatus: 403; code: "FORBIDDEN" }
  | { ok: false; httpStatus: null; code: null };

export type TransitionResult = TransitionOk | TransitionDenial;

type StaffActor = { kind: "agent" | "admin"; id: string };

type Flags = {
  deleted: boolean;
  customerEmail: boolean;
  staffAlert: boolean;
  confirmationResent: boolean;
  revokeCustomerAccess: boolean;
};

const NO_FLAGS: Flags = {
  deleted: false,
  customerEmail: false,
  staffAlert: false,
  confirmationResent: false,
  revokeCustomerAccess: false,
};

const STAFF_ALERT: Flags = { ...NO_FLAGS, staffAlert: true };

const CUSTOMER_MAIL: Flags = { ...NO_FLAGS, customerEmail: true };

const EMAIL_CORRECTION: Flags = {
  ...NO_FLAGS,
  confirmationResent: true,
  revokeCustomerAccess: true,
};

const DELETED: Flags = { ...NO_FLAGS, deleted: true };

const HOUR_MS = 60 * 60 * 1000;

export function isValidReopenWindow(days: number): boolean {
  return (
    Number.isInteger(days) &&
    days >= LIMITS.REOPEN_WINDOW_DAYS_MIN &&
    days <= LIMITS.REOPEN_WINDOW_DAYS_MAX
  );
}

/** Elapsed hours, not a civil day in Eastern Time (AC-CLOSE-17). */
export function autoCloseDueAt(
  resolvedAtIso: string,
  windowDays: number,
): string {
  return new Date(
    Date.parse(resolvedAtIso) + windowDays * 24 * HOUR_MS,
  ).toISOString();
}

export function formatAutoCloseEt(instantIso: string): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(instantIso));
  return `${formatted.replace(/[\u202f\u00a0]/g, " ")} ET`;
}

/** v1: Agents and Admins see every ticket (R3, ARCHITECTURE §4). */
export function ticketScopeFor(role: "agent" | "admin"): "all" {
  const scope = { agent: "all", admin: "all" } as const;
  return scope[role];
}

export function transition(
  ticket: Ticket | null,
  command: Command,
  context: TransitionContext,
): TransitionResult {
  if (command.action === "submit") return submit(ticket, command);
  if (ticket === null) return unnamed();
  return transitionTicket(ticket, command, context);
}

function transitionTicket(
  ticket: Ticket,
  command: Exclude<Command, { action: "submit" }>,
  context: TransitionContext,
): TransitionResult {
  switch (command.action) {
    case "accept":
      return accept(ticket, command, context);
    case "assign":
      return assign(ticket, command, context);
    case "unassign":
      return unassign(ticket, command);
    case "set_status":
      return setStatus(ticket, command, context);
    case "set_priority":
      return setPriority(ticket, command);
    case "internal_note":
      return internalNote(ticket, command);
    case "view":
      return view(ticket, command);
    case "mark_seen":
      return markSeen(ticket, command);
    case "staff_cancel":
      return staffCancel(ticket, command);
    case "correct_email":
      return correctEmail(ticket, command);
    case "public_reply":
      return publicReply(ticket, command, context);
    case "customer_reply":
      return customerReply(ticket, command);
    case "customer_cancel":
      return customerCancel(ticket, command);
    case "customer_reopen":
      return customerReopen(ticket, command, context);
    case "auto_close":
      return autoClose(ticket, command, context);
    case "admin_reopen":
      return adminReopen(ticket, command);
    case "admin_restore":
      return adminRestore(ticket, command);
    case "hard_delete":
      return hardDelete(command);
  }
}

function submit(
  ticket: Ticket | null,
  command: Extract<Command, { action: "submit" }>,
): TransitionResult {
  if (ticket !== null) return unnamed();
  const attention = { effect: "set", reason: "new_ticket" } as const;
  const created: Ticket = {
    status: "new",
    priority: "normal",
    assigneeId: null,
    assignedAt: null,
    firstAcceptedBy: null,
    firstAcceptedAt: null,
    needsAttention: false,
    needsAttentionReason: null,
    resolvedAt: null,
    autoCloseDueAt: null,
    closedAt: null,
    customerEmail: command.customerEmail,
    emailConfirmedAt: null,
  };
  return ok(withAttention(created, attention), attention, STAFF_ALERT);
}

function accept(
  ticket: Ticket,
  command: Extract<Command, { action: "accept" }>,
  context: TransitionContext,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  if (isTerminal(ticket.status)) return readOnly();
  return placeAssignee(ticket, actor.id, actor.id, context);
}

function assign(
  ticket: Ticket,
  command: Extract<Command, { action: "assign" }>,
  context: TransitionContext,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  if (isTerminal(ticket.status)) return readOnly();
  return placeAssignee(ticket, command.assigneeId, command.assigneeId, context);
}

function unassign(
  ticket: Ticket,
  command: Extract<Command, { action: "unassign" }>,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  if (isTerminal(ticket.status)) return readOnly();
  const next: Ticket = { ...ticket, assigneeId: null, assignedAt: null };
  return ok(next, { effect: "unchanged" }, NO_FLAGS);
}

function setStatus(
  ticket: Ticket,
  command: Extract<Command, { action: "set_status" }>,
  context: TransitionContext,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  if (isTerminal(ticket.status)) return readOnly();
  // Same allowed-set check as AC-LC-33. Closed-by-hand is the other half of
  // "never to new, never to closed by hand", so it uses the same code.
  if (
    command.to === ticket.status ||
    !STAFF_STATUS_TARGETS.includes(command.to)
  ) {
    return invalid();
  }
  return finishStatusChange(ticket, actor.id, command.to, context, NO_FLAGS);
}

function setPriority(
  ticket: Ticket,
  command: Extract<Command, { action: "set_priority" }>,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  if (isTerminal(ticket.status)) return readOnly();
  return ok(
    { ...ticket, priority: command.priority },
    { effect: "unchanged" },
    NO_FLAGS,
  );
}

function internalNote(
  ticket: Ticket,
  command: Extract<Command, { action: "internal_note" }>,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  return ok(ticket, { effect: "unchanged" }, NO_FLAGS);
}

function view(
  ticket: Ticket,
  command: Extract<Command, { action: "view" }>,
): TransitionResult {
  if (command.actor.kind === "anonymous") return unauthenticated();
  if (
    command.actor.kind === "customer" ||
    command.actor.kind === "agent" ||
    command.actor.kind === "admin"
  ) {
    return ok(ticket, { effect: "unchanged" }, NO_FLAGS);
  }
  return forbidden();
}

function markSeen(
  ticket: Ticket,
  command: Extract<Command, { action: "mark_seen" }>,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  if (isTerminal(ticket.status)) return readOnly();
  if (!ticket.needsAttention)
    return ok(ticket, { effect: "unchanged" }, NO_FLAGS);
  const attention = {
    effect: "clear",
    reason: "marked_seen",
    eventActor: "staff",
  } as const;
  return ok(withAttention(ticket, attention), attention, NO_FLAGS);
}

function staffCancel(
  ticket: Ticket,
  command: Extract<Command, { action: "staff_cancel" }>,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  if (isTerminal(ticket.status)) return readOnly();
  const attention = {
    effect: "clear",
    reason: "staff_cancelled",
    eventActor: "staff",
  } as const;
  const next: Ticket = { ...ticket, status: "cancelled" };
  return ok(withAttention(next, attention), attention, NO_FLAGS);
}

function correctEmail(
  ticket: Ticket,
  command: Extract<Command, { action: "correct_email" }>,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  if (isTerminal(ticket.status)) return readOnly();
  const next: Ticket = {
    ...ticket,
    customerEmail: command.email,
    emailConfirmedAt: null,
  };
  return ok(next, { effect: "unchanged" }, EMAIL_CORRECTION);
}

function publicReply(
  ticket: Ticket,
  command: Extract<Command, { action: "public_reply" }>,
  context: TransitionContext,
): TransitionResult {
  const actor = staff(command.actor);
  if (isDenial(actor)) return actor;
  if (isTerminal(ticket.status)) return readOnly();
  if (command.setStatus !== undefined && command.setStatus !== ticket.status) {
    // The status did change, so the clear reason is the status-change reason.
    return finishStatusChange(
      ticket,
      actor.id,
      command.setStatus,
      context,
      CUSTOMER_MAIL,
    );
  }
  const attention = {
    effect: "clear",
    reason: "staff_reply",
    eventActor: "staff",
  } as const;
  return ok(withAttention(ticket, attention), attention, CUSTOMER_MAIL);
}

function customerReply(
  ticket: Ticket,
  command: Extract<Command, { action: "customer_reply" }>,
): TransitionResult {
  const actor = customer(command.actor);
  if (isDenial(actor)) return actor;
  if (!CUSTOMER_REPLY_STATUSES.includes(ticket.status)) return readOnly();
  const attention = { effect: "set", reason: "customer_reply" } as const;
  const next: Ticket = {
    ...ticket,
    status: ticket.status === "waiting_on_customer" ? "open" : ticket.status,
  };
  const flags = ticket.status === "resolved" ? STAFF_ALERT : NO_FLAGS;
  return ok(withAttention(next, attention), attention, flags);
}

function customerCancel(
  ticket: Ticket,
  command: Extract<Command, { action: "customer_cancel" }>,
): TransitionResult {
  const actor = customer(command.actor);
  if (isDenial(actor)) return actor;
  if (!CUSTOMER_CANCEL_STATUSES.includes(ticket.status)) return readOnly();
  const attention = {
    effect: "clear",
    reason: "customer_cancelled",
    eventActor: "system",
  } as const;
  const next: Ticket = { ...ticket, status: "cancelled" };
  return ok(withAttention(next, attention), attention, STAFF_ALERT);
}

function customerReopen(
  ticket: Ticket,
  command: Extract<Command, { action: "customer_reopen" }>,
  context: TransitionContext,
): TransitionResult {
  const actor = customer(command.actor);
  if (isDenial(actor)) return actor;
  if (ticket.status !== "resolved") return readOnly();
  if (!isBeforeDue(ticket, context.now)) return readOnly();
  const attention = { effect: "set", reason: "customer_reopen" } as const;
  const next: Ticket = {
    ...ticket,
    status: "open",
    resolvedAt: null,
    autoCloseDueAt: null,
  };
  return ok(withAttention(next, attention), attention, STAFF_ALERT);
}

function autoClose(
  ticket: Ticket,
  command: Extract<Command, { action: "auto_close" }>,
  context: TransitionContext,
): TransitionResult {
  const actor = systemActor(command.actor);
  if (isDenial(actor)) return actor;
  if (ticket.status !== "resolved" || !isAtOrAfterDue(ticket, context.now))
    return unnamed();
  const attention = {
    effect: "clear",
    reason: "auto_closed",
    eventActor: "system",
  } as const;
  const next: Ticket = { ...ticket, status: "closed", closedAt: context.now };
  return ok(withAttention(next, attention), attention, NO_FLAGS);
}

function adminReopen(
  ticket: Ticket,
  command: Extract<Command, { action: "admin_reopen" }>,
): TransitionResult {
  const actor = admin(command.actor);
  if (isDenial(actor)) return actor;
  if (ticket.status !== "closed") return invalid();
  const attention = {
    effect: "clear",
    reason: "staff_status_change",
    eventActor: "staff",
  } as const;
  const next: Ticket = { ...ticket, status: "open" };
  return ok(withAttention(next, attention), attention, NO_FLAGS);
}

function adminRestore(
  ticket: Ticket,
  command: Extract<Command, { action: "admin_restore" }>,
): TransitionResult {
  const actor = admin(command.actor);
  if (isDenial(actor)) return actor;
  if (ticket.status !== "cancelled") return invalid();
  const attention = {
    effect: "clear",
    reason: "staff_status_change",
    eventActor: "staff",
  } as const;
  const next: Ticket = { ...ticket, status: "open" };
  return ok(withAttention(next, attention), attention, NO_FLAGS);
}

function hardDelete(
  command: Extract<Command, { action: "hard_delete" }>,
): TransitionResult {
  const actor = admin(command.actor);
  if (isDenial(actor)) return actor;
  return ok(null, { effect: "unchanged" }, DELETED);
}

function placeAssignee(
  ticket: Ticket,
  assigneeId: string,
  acceptedBy: string,
  context: TransitionContext,
): TransitionResult {
  const fromNew = ticket.status === "new";
  let next: Ticket = {
    ...ticket,
    status: fromNew ? "open" : ticket.status,
    assigneeId,
    assignedAt: context.now,
  };
  if (next.firstAcceptedAt === null) {
    next = {
      ...next,
      firstAcceptedBy: acceptedBy,
      firstAcceptedAt: context.now,
    };
  }
  const attention: AttentionEffect = fromNew
    ? { effect: "clear", reason: "staff_status_change", eventActor: "staff" }
    : { effect: "unchanged" };
  return ok(withAttention(next, attention), attention, NO_FLAGS);
}

function finishStatusChange(
  ticket: Ticket,
  actorId: string,
  to: Status,
  context: TransitionContext,
  flags: Flags,
): TransitionResult {
  const applied = applyStaffStatusChange(ticket, actorId, to, context);
  if (isDenial(applied)) return applied;
  const attention = {
    effect: "clear",
    reason: "staff_status_change",
    eventActor: "staff",
  } as const;
  return ok(withAttention(applied, attention), attention, flags);
}

function applyStaffStatusChange(
  ticket: Ticket,
  actorId: string,
  to: Status,
  context: TransitionContext,
): Ticket | TransitionDenial {
  if (to === "resolved" && !isValidReopenWindow(context.reopenWindowDays))
    return unnamed();
  let next: Ticket = { ...ticket, status: to };
  if (ticket.status === "new" && ticket.assigneeId === null) {
    next = {
      ...next,
      assigneeId: actorId,
      assignedAt: context.now,
    };
    if (next.firstAcceptedAt === null) {
      next = {
        ...next,
        firstAcceptedBy: actorId,
        firstAcceptedAt: context.now,
      };
    }
  }
  if (to === "resolved") {
    next = {
      ...next,
      resolvedAt: context.now,
      autoCloseDueAt: autoCloseDueAt(context.now, context.reopenWindowDays),
    };
  } else if (ticket.status === "resolved") {
    next = { ...next, resolvedAt: null, autoCloseDueAt: null };
  }
  return next;
}

function isBeforeDue(ticket: Ticket, now: string): boolean {
  if (ticket.autoCloseDueAt === null) return false;
  return Date.parse(now) < Date.parse(ticket.autoCloseDueAt);
}

function isAtOrAfterDue(ticket: Ticket, now: string): boolean {
  if (ticket.autoCloseDueAt === null) return false;
  return Date.parse(now) >= Date.parse(ticket.autoCloseDueAt);
}

function withAttention(ticket: Ticket, attention: AttentionEffect): Ticket {
  if (attention.effect === "set") {
    return {
      ...ticket,
      needsAttention: true,
      needsAttentionReason: attention.reason,
    };
  }
  if (attention.effect === "clear") {
    return { ...ticket, needsAttention: false, needsAttentionReason: null };
  }
  return ticket;
}

function ok(
  ticket: Ticket | null,
  attention: AttentionEffect,
  flags: Flags,
): TransitionOk {
  return { ok: true, ticket, attention, ...flags };
}

function staff(actor: Actor): StaffActor | TransitionDenial {
  if (actor.kind === "anonymous") return unauthenticated();
  if (actor.kind === "agent" || actor.kind === "admin") return actor;
  return forbidden();
}

function admin(actor: Actor): { kind: "admin"; id: string } | TransitionDenial {
  if (actor.kind === "anonymous") return unauthenticated();
  if (actor.kind === "admin") return actor;
  return forbidden();
}

function customer(actor: Actor): { kind: "customer" } | TransitionDenial {
  if (actor.kind === "anonymous") return unauthenticated();
  if (actor.kind === "customer") return actor;
  return forbidden();
}

function systemActor(actor: Actor): { kind: "system" } | TransitionDenial {
  if (actor.kind === "anonymous") return unauthenticated();
  if (actor.kind === "system") return actor;
  return forbidden();
}

function isTerminal(status: Status): boolean {
  return status === "closed" || status === "cancelled";
}

function isDenial(value: object): value is TransitionDenial {
  return "ok" in value;
}

function unnamed(): TransitionDenial {
  return { ok: false, httpStatus: null, code: null };
}

function invalid(): TransitionDenial {
  return { ok: false, httpStatus: 409, code: "INVALID_TRANSITION" };
}

function readOnly(): TransitionDenial {
  return { ok: false, httpStatus: 409, code: "TICKET_READ_ONLY" };
}

function unauthenticated(): TransitionDenial {
  return { ok: false, httpStatus: 401, code: "UNAUTHENTICATED" };
}

function forbidden(): TransitionDenial {
  return { ok: false, httpStatus: 403, code: "FORBIDDEN" };
}
