import assert from "node:assert/strict";
import { Session } from "node:inspector/promises";
import { afterAll, describe, it } from "vitest";
import type {
  Actor,
  AttentionEffect,
  Command,
  Status,
  Ticket,
  TransitionOk,
  TransitionResult,
} from "./domain.js";

const session = new Session();
session.connect();
await session.post("Profiler.enable");
await session.post("Profiler.startPreciseCoverage", {
  callCount: true,
  detailed: true,
});

const {
  AUTO_CLOSE_CRON,
  DISPLAY_TIMEZONE,
  LIMITS,
  PRIORITIES,
  STATUSES,
  autoCloseDueAt,
  formatAutoCloseEt,
  isValidReopenWindow,
  ticketScopeFor,
  transition,
} = await import("./domain.js");

const agent = { kind: "agent", id: "agent-1" } as const;
const admin = { kind: "admin", id: "admin-1" } as const;
const customer = { kind: "customer" } as const;
const anonymous = { kind: "anonymous" } as const;
const system = { kind: "system" } as const;

const NOW = "2026-04-01T12:00:00.000Z";
const EARLIER = "2026-03-01T12:00:00.000Z";
const RESOLVED_AT = "2026-06-01T15:00:00.000Z";
const DUE = "2026-06-15T15:00:00.000Z";
const BEFORE_DUE = "2026-06-15T14:59:00.000Z";
const AT_DUE = DUE;
const AFTER_DUE = "2026-06-15T15:15:00.000Z";

type Staff = typeof agent | typeof admin;

const lc07: Array<{ title: string; actor: Staff; from: Status; to: Status }> = [
  {
    title: "[AC-LC-07] Agent sets New to Open",
    actor: agent,
    from: "new",
    to: "open",
  },
  {
    title: "[AC-LC-07] Agent sets New to In Progress",
    actor: agent,
    from: "new",
    to: "in_progress",
  },
  {
    title: "[AC-LC-07] Agent sets New to Waiting on Customer",
    actor: agent,
    from: "new",
    to: "waiting_on_customer",
  },
  {
    title: "[AC-LC-07] Agent sets New to Resolved",
    actor: agent,
    from: "new",
    to: "resolved",
  },
  {
    title: "[AC-LC-07] Agent sets Open to In Progress",
    actor: agent,
    from: "open",
    to: "in_progress",
  },
  {
    title: "[AC-LC-07] Agent sets Open to Waiting on Customer",
    actor: agent,
    from: "open",
    to: "waiting_on_customer",
  },
  {
    title: "[AC-LC-07] Agent sets Open to Resolved",
    actor: agent,
    from: "open",
    to: "resolved",
  },
  {
    title: "[AC-LC-07] Agent sets In Progress to Open",
    actor: agent,
    from: "in_progress",
    to: "open",
  },
  {
    title: "[AC-LC-07] Agent sets In Progress to Waiting on Customer",
    actor: agent,
    from: "in_progress",
    to: "waiting_on_customer",
  },
  {
    title: "[AC-LC-07] Agent sets In Progress to Resolved",
    actor: agent,
    from: "in_progress",
    to: "resolved",
  },
  {
    title: "[AC-LC-07] Agent sets Waiting on Customer to Open",
    actor: agent,
    from: "waiting_on_customer",
    to: "open",
  },
  {
    title: "[AC-LC-07] Agent sets Waiting on Customer to In Progress",
    actor: agent,
    from: "waiting_on_customer",
    to: "in_progress",
  },
  {
    title: "[AC-LC-07] Agent sets Waiting on Customer to Resolved",
    actor: agent,
    from: "waiting_on_customer",
    to: "resolved",
  },
  {
    title: "[AC-LC-07] Agent sets Resolved to Open",
    actor: agent,
    from: "resolved",
    to: "open",
  },
  {
    title: "[AC-LC-07] Agent sets Resolved to In Progress",
    actor: agent,
    from: "resolved",
    to: "in_progress",
  },
  {
    title: "[AC-LC-07] Agent sets Resolved to Waiting on Customer",
    actor: agent,
    from: "resolved",
    to: "waiting_on_customer",
  },
  {
    title: "[AC-LC-07] Admin sets New to Open",
    actor: admin,
    from: "new",
    to: "open",
  },
  {
    title: "[AC-LC-07] Admin sets New to In Progress",
    actor: admin,
    from: "new",
    to: "in_progress",
  },
  {
    title: "[AC-LC-07] Admin sets New to Waiting on Customer",
    actor: admin,
    from: "new",
    to: "waiting_on_customer",
  },
  {
    title: "[AC-LC-07] Admin sets New to Resolved",
    actor: admin,
    from: "new",
    to: "resolved",
  },
  {
    title: "[AC-LC-07] Admin sets Open to In Progress",
    actor: admin,
    from: "open",
    to: "in_progress",
  },
  {
    title: "[AC-LC-07] Admin sets Open to Waiting on Customer",
    actor: admin,
    from: "open",
    to: "waiting_on_customer",
  },
  {
    title: "[AC-LC-07] Admin sets Open to Resolved",
    actor: admin,
    from: "open",
    to: "resolved",
  },
  {
    title: "[AC-LC-07] Admin sets In Progress to Open",
    actor: admin,
    from: "in_progress",
    to: "open",
  },
  {
    title: "[AC-LC-07] Admin sets In Progress to Waiting on Customer",
    actor: admin,
    from: "in_progress",
    to: "waiting_on_customer",
  },
  {
    title: "[AC-LC-07] Admin sets In Progress to Resolved",
    actor: admin,
    from: "in_progress",
    to: "resolved",
  },
  {
    title: "[AC-LC-07] Admin sets Waiting on Customer to Open",
    actor: admin,
    from: "waiting_on_customer",
    to: "open",
  },
  {
    title: "[AC-LC-07] Admin sets Waiting on Customer to In Progress",
    actor: admin,
    from: "waiting_on_customer",
    to: "in_progress",
  },
  {
    title: "[AC-LC-07] Admin sets Waiting on Customer to Resolved",
    actor: admin,
    from: "waiting_on_customer",
    to: "resolved",
  },
  {
    title: "[AC-LC-07] Admin sets Resolved to Open",
    actor: admin,
    from: "resolved",
    to: "open",
  },
  {
    title: "[AC-LC-07] Admin sets Resolved to In Progress",
    actor: admin,
    from: "resolved",
    to: "in_progress",
  },
  {
    title: "[AC-LC-07] Admin sets Resolved to Waiting on Customer",
    actor: admin,
    from: "resolved",
    to: "waiting_on_customer",
  },
];

const lc33: Array<{ title: string; actor: Staff; from: Status }> = [
  {
    title: "[AC-LC-33] Agent cannot set New to New",
    actor: agent,
    from: "new",
  },
  {
    title: "[AC-LC-33] Agent cannot set Open to New",
    actor: agent,
    from: "open",
  },
  {
    title: "[AC-LC-33] Agent cannot set In Progress to New",
    actor: agent,
    from: "in_progress",
  },
  {
    title: "[AC-LC-33] Agent cannot set Waiting on Customer to New",
    actor: agent,
    from: "waiting_on_customer",
  },
  {
    title: "[AC-LC-33] Agent cannot set Resolved to New",
    actor: agent,
    from: "resolved",
  },
  {
    title: "[AC-LC-33] Admin cannot set New to New",
    actor: admin,
    from: "new",
  },
  {
    title: "[AC-LC-33] Admin cannot set Open to New",
    actor: admin,
    from: "open",
  },
  {
    title: "[AC-LC-33] Admin cannot set In Progress to New",
    actor: admin,
    from: "in_progress",
  },
  {
    title: "[AC-LC-33] Admin cannot set Waiting on Customer to New",
    actor: admin,
    from: "waiting_on_customer",
  },
  {
    title: "[AC-LC-33] Admin cannot set Resolved to New",
    actor: admin,
    from: "resolved",
  },
];

const lc34: Array<{ title: string; actor: Staff; from: Status }> = [
  {
    title: "[AC-LC-34] Agent cannot close New by hand",
    actor: agent,
    from: "new",
  },
  {
    title: "[AC-LC-34] Agent cannot close Open by hand",
    actor: agent,
    from: "open",
  },
  {
    title: "[AC-LC-34] Agent cannot close In Progress by hand",
    actor: agent,
    from: "in_progress",
  },
  {
    title: "[AC-LC-34] Agent cannot close Waiting on Customer by hand",
    actor: agent,
    from: "waiting_on_customer",
  },
  {
    title: "[AC-LC-34] Agent cannot close Resolved by hand",
    actor: agent,
    from: "resolved",
  },
  {
    title: "[AC-LC-34] Admin cannot close New by hand",
    actor: admin,
    from: "new",
  },
  {
    title: "[AC-LC-34] Admin cannot close Open by hand",
    actor: admin,
    from: "open",
  },
  {
    title: "[AC-LC-34] Admin cannot close In Progress by hand",
    actor: admin,
    from: "in_progress",
  },
  {
    title: "[AC-LC-34] Admin cannot close Waiting on Customer by hand",
    actor: admin,
    from: "waiting_on_customer",
  },
  {
    title: "[AC-LC-34] Admin cannot close Resolved by hand",
    actor: admin,
    from: "resolved",
  },
];

const lc51: Array<{ title: string; from: Status; to: Status }> = [
  {
    title: "[AC-LC-51] Admin cannot set Closed to In Progress",
    from: "closed",
    to: "in_progress",
  },
  {
    title: "[AC-LC-51] Admin cannot set Closed to Resolved",
    from: "closed",
    to: "resolved",
  },
  {
    title: "[AC-LC-51] Admin cannot set Cancelled to In Progress",
    from: "cancelled",
    to: "in_progress",
  },
  {
    title: "[AC-LC-51] Admin cannot set Cancelled to Waiting on Customer",
    from: "cancelled",
    to: "waiting_on_customer",
  },
  {
    title: "[AC-LC-51] Admin cannot set Closed to New",
    from: "closed",
    to: "new",
  },
  {
    title: "[AC-LC-51] Admin cannot set Cancelled to New",
    from: "cancelled",
    to: "new",
  },
  {
    title: "[AC-LC-51] Admin cannot set Closed to Open",
    from: "closed",
    to: "open",
  },
  {
    title: "[AC-LC-51] Admin cannot set Cancelled to Open",
    from: "cancelled",
    to: "open",
  },
];

function ctx(now: string, reopenWindowDays = 14) {
  return { now, reopenWindowDays };
}

function make(
  status: Status,
  needsAttention: boolean,
  assigneeId: string | null,
): Ticket {
  const wasResolved = status === "resolved" || status === "closed";
  return Object.freeze({
    status,
    priority: "normal",
    assigneeId,
    assignedAt: assigneeId === null ? null : EARLIER,
    firstAcceptedBy: assigneeId,
    firstAcceptedAt: assigneeId === null ? null : EARLIER,
    needsAttention,
    needsAttentionReason: needsAttention ? "new_ticket" : null,
    resolvedAt: wasResolved ? RESOLVED_AT : null,
    autoCloseDueAt: wasResolved ? DUE : null,
    closedAt: status === "closed" ? EARLIER : null,
    customerEmail: "customer@example.com",
    emailConfirmedAt: EARLIER,
  });
}

function sample(status: Status): Ticket {
  return make(status, true, null);
}

function asOk(result: TransitionResult): TransitionOk {
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected the transition to be allowed");
  return result;
}

function asTicket(result: TransitionResult): Ticket {
  const allowed = asOk(result);
  if (allowed.ticket === null) throw new Error("expected a ticket");
  return allowed.ticket;
}

function assertClear(
  attention: AttentionEffect,
  reason: Extract<AttentionEffect, { effect: "clear" }>["reason"],
  eventActor: "staff" | "system",
) {
  assert.deepEqual(attention, { effect: "clear", reason, eventActor });
}

describe("staff status changes", () => {
  for (const row of lc07) {
    it(row.title, () => {
      const allowed = asOk(
        transition(
          sample(row.from),
          { action: "set_status", actor: row.actor, to: row.to },
          ctx(NOW),
        ),
      );
      const next = allowed.ticket;
      if (next === null) throw new Error("expected a ticket");
      assert.equal(next.status, row.to);
      assertClear(allowed.attention, "staff_status_change", "staff");
      assert.equal(next.needsAttention, false);
      assert.equal(next.firstAcceptedBy, null);
      if (row.from === "new") {
        assert.equal(next.assigneeId, row.actor.id);
        assert.equal(next.assignedAt, NOW);
      } else {
        assert.equal(next.assigneeId, null);
        assert.equal(next.assignedAt, null);
      }
      if (row.to === "resolved") {
        assert.equal(next.resolvedAt, NOW);
        assert.equal(next.autoCloseDueAt, autoCloseDueAt(NOW, 14));
      } else {
        assert.equal(next.resolvedAt, null);
        assert.equal(next.autoCloseDueAt, null);
      }
    });
  }

  for (const row of lc33) {
    it(row.title, () => {
      assert.deepEqual(
        transition(
          sample(row.from),
          { action: "set_status", actor: row.actor, to: "new" },
          ctx(NOW),
        ),
        { ok: false, httpStatus: 409, code: "INVALID_TRANSITION" },
      );
    });
  }

  for (const row of lc34) {
    it(row.title, () => {
      assert.deepEqual(
        transition(
          sample(row.from),
          { action: "set_status", actor: row.actor, to: "closed" },
          ctx(NOW),
        ),
        { ok: false, httpStatus: 409, code: "INVALID_TRANSITION" },
      );
    });
  }

  it("[AC-LC-40] Agent sets unassigned New to In Progress and becomes the assignee", () => {
    const next = asTicket(
      transition(
        sample("new"),
        { action: "set_status", actor: agent, to: "in_progress" },
        ctx(NOW),
      ),
    );
    assert.equal(next.status, "in_progress");
    assert.equal(next.assigneeId, agent.id);
    assert.equal(next.assignedAt, NOW);
  });

  for (const row of lc51) {
    it(row.title, () => {
      assert.deepEqual(
        transition(
          make(row.from, true, "agent-9"),
          { action: "set_status", actor: admin, to: row.to },
          ctx(NOW),
        ),
        { ok: false, httpStatus: 409, code: "TICKET_READ_ONLY" },
      );
    });
  }

  it("Agent set_status on a Closed ticket and on a Cancelled ticket returns 409 TICKET_READ_ONLY", () => {
    for (const from of ["closed", "cancelled"] as const) {
      assert.deepEqual(
        transition(
          make(from, true, "agent-9"),
          { action: "set_status", actor: agent, to: "open" },
          ctx(NOW),
        ),
        { ok: false, httpStatus: 409, code: "TICKET_READ_ONLY" },
      );
    }
  });
});

describe("reopen window and auto-close clock", () => {
  function resolveAt(at: string, windowDays: number): Ticket {
    return asTicket(
      transition(
        sample("open"),
        { action: "set_status", actor: agent, to: "resolved" },
        ctx(at, windowDays),
      ),
    );
  }

  function atWindow(windowDays: number) {
    const resolved = resolveAt(NOW, windowDays);
    const due = autoCloseDueAt(NOW, windowDays);
    assert.equal(resolved.autoCloseDueAt, due);
    const minuteBefore = new Date(Date.parse(due) - 60_000).toISOString();
    const grace = new Date(Date.parse(due) + 15 * 60_000).toISOString();
    assert.deepEqual(
      transition(
        resolved,
        { action: "auto_close", actor: system },
        ctx(minuteBefore, windowDays),
      ),
      { ok: false, httpStatus: null, code: null },
    );
    const reopened = asOk(
      transition(
        resolved,
        { action: "customer_reopen", actor: customer },
        ctx(minuteBefore, windowDays),
      ),
    );
    assert.equal(reopened.ticket?.status, "open");
    const closed = asTicket(
      transition(
        resolved,
        { action: "auto_close", actor: system },
        ctx(grace, windowDays),
      ),
    );
    assert.equal(closed.status, "closed");
    assertClear(
      asOk(
        transition(
          resolved,
          { action: "auto_close", actor: system },
          ctx(grace, windowDays),
        ),
      ).attention,
      "auto_closed",
      "system",
    );
  }

  it("[AC-CLOSE-14] window 1 day stays Resolved until the due minute and is Closed 15 minutes later", () => {
    atWindow(1);
  });

  it("[AC-CLOSE-14] window 7 days stays Resolved until the due minute and is Closed 15 minutes later", () => {
    atWindow(7);
  });

  it("[AC-CLOSE-14] window 14 days stays Resolved until the due minute and is Closed 15 minutes later", () => {
    atWindow(14);
  });

  it("[AC-CLOSE-15] a later window does not move a due time captured at resolution", () => {
    const resolved = resolveAt(RESOLVED_AT, 14);
    assert.equal(resolved.autoCloseDueAt, DUE);
    assert.equal(
      Date.parse(DUE) - Date.parse(RESOLVED_AT),
      336 * 60 * 60 * 1000,
    );
    assert.notEqual(autoCloseDueAt(RESOLVED_AT, 7), DUE);
    const viewed = asTicket(
      transition(
        resolved,
        { action: "view", actor: agent },
        ctx(BEFORE_DUE, 7),
      ),
    );
    assert.equal(viewed.status, "resolved");
    assert.equal(viewed.autoCloseDueAt, DUE);
    const sevenDaysLater = new Date(
      Date.parse(RESOLVED_AT) + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    assert.deepEqual(
      transition(
        resolved,
        { action: "auto_close", actor: system },
        ctx(sevenDaysLater, 7),
      ),
      { ok: false, httpStatus: null, code: null },
    );
    const reopened = asOk(
      transition(
        resolved,
        { action: "customer_reopen", actor: customer },
        ctx(sevenDaysLater, 7),
      ),
    );
    assert.equal(reopened.ticket?.status, "open");
    const closed = asTicket(
      transition(
        resolved,
        { action: "auto_close", actor: system },
        ctx(DUE, 7),
      ),
    );
    assert.equal(closed.status, "closed");
    assert.equal(closed.autoCloseDueAt, DUE);
  });

  it("[AC-CLOSE-17] 336 elapsed hours across the autumn clock change read 9:00 AM ET", () => {
    const resolvedAt = "2026-10-25T14:00:00.000Z";
    const due = autoCloseDueAt(resolvedAt, 14);
    assert.equal(due, "2026-11-08T14:00:00.000Z");
    assert.equal(formatAutoCloseEt(due), "Nov 8, 2026, 9:00 AM ET");
    const resolved = asTicket(
      transition(
        sample("open"),
        { action: "set_status", actor: agent, to: "resolved" },
        ctx(resolvedAt, 14),
      ),
    );
    assert.equal(resolved.autoCloseDueAt, due);
    assert.deepEqual(
      transition(
        resolved,
        { action: "auto_close", actor: system },
        ctx("2026-11-08T13:59:00.000Z", 14),
      ),
      { ok: false, httpStatus: null, code: null },
    );
    assert.equal(resolved.status, "resolved");
  });
});

describe("needs_attention table", () => {
  it("enumerates every move into closed or cancelled and every accept or assign out of new", () => {
    const actors: Actor[] = [anonymous, customer, agent, admin, system];
    let closedMoves = 0;
    let cancelledMoves = 0;
    let acceptMoves = 0;
    let assignMoves = 0;
    const clocks = [BEFORE_DUE, AFTER_DUE];
    for (const actor of actors) {
      const submitted = transition(
        null,
        { action: "submit", actor, customerEmail: "person@example.com" },
        ctx(BEFORE_DUE),
      );
      assert.equal(asTicket(submitted).status, "new");
      assert.deepEqual(asOk(submitted).attention, {
        effect: "set",
        reason: "new_ticket",
      });
    }
    assert.deepEqual(
      transition(null, { action: "view", actor: agent }, ctx(BEFORE_DUE)),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
    for (const status of STATUSES) {
      for (const needsAttention of [true, false]) {
        for (const assigneeId of [null, "agent-9"]) {
          const ticket = make(status, needsAttention, assigneeId);
          for (const actor of actors) {
            for (const command of commands(actor)) {
              for (const now of clocks) {
                const result = transition(ticket, command, ctx(now));
                if (!result.ok || result.ticket === null) continue;
                const next = result.ticket;
                if (
                  (next.status === "closed" || next.status === "cancelled") &&
                  next.status !== ticket.status
                ) {
                  assert.equal(result.attention.effect, "clear");
                  if (next.status === "closed") closedMoves += 1;
                  if (next.status === "cancelled") cancelledMoves += 1;
                }
                if (
                  ticket.status === "new" &&
                  next.status === "open" &&
                  (command.action === "accept" || command.action === "assign")
                ) {
                  assert.equal(result.attention.effect, "clear");
                  if (command.action === "accept") acceptMoves += 1;
                  if (command.action === "assign") assignMoves += 1;
                }
              }
            }
          }
        }
      }
    }
    assert.ok(closedMoves > 0);
    assert.ok(cancelledMoves > 0);
    assert.ok(acceptMoves > 0);
    assert.ok(assignMoves > 0);
  });
});

describe("documented transitions outside the delivered outlines", () => {
  it("anonymous submit is allowed and an existing ticket cannot be submitted again", () => {
    const created = asOk(
      transition(
        null,
        {
          action: "submit",
          actor: anonymous,
          customerEmail: "person@example.com",
        },
        ctx(NOW),
      ),
    );
    assert.equal(created.staffAlert, true);
    assert.equal(created.customerEmail, false);
    assert.equal(created.ticket?.needsAttention, true);
    assert.deepEqual(
      transition(
        sample("open"),
        {
          action: "submit",
          actor: anonymous,
          customerEmail: "person@example.com",
        },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
  });

  it("accepting a New ticket opens it, records the first acceptance, and clears the flag", () => {
    const next = asTicket(
      transition(sample("new"), { action: "accept", actor: agent }, ctx(NOW)),
    );
    assert.equal(next.status, "open");
    assert.equal(next.assigneeId, agent.id);
    assert.equal(next.firstAcceptedBy, agent.id);
    assert.equal(next.firstAcceptedAt, NOW);
    assert.equal(next.needsAttention, false);
  });

  it("accepting an Open ticket changes the assignee and does not clear the flag or the first acceptance", () => {
    const before = make("open", true, "agent-9");
    const allowed = asOk(
      transition(before, { action: "accept", actor: agent }, ctx(NOW)),
    );
    assert.equal(allowed.ticket?.status, "open");
    assert.equal(allowed.ticket?.assigneeId, agent.id);
    assert.equal(allowed.ticket?.firstAcceptedBy, "agent-9");
    assert.equal(allowed.ticket?.firstAcceptedAt, EARLIER);
    assert.deepEqual(allowed.attention, { effect: "unchanged" });
    assert.equal(allowed.ticket?.needsAttention, true);
  });

  it("assigning a New ticket opens it and clears the flag", () => {
    const next = asTicket(
      transition(
        sample("new"),
        { action: "assign", actor: admin, assigneeId: "agent-2" },
        ctx(NOW),
      ),
    );
    assert.equal(next.status, "open");
    assert.equal(next.assigneeId, "agent-2");
    assert.equal(next.firstAcceptedBy, "agent-2");
    assert.equal(next.needsAttention, false);
  });

  it("assigning an Open ticket does not change status or the flag", () => {
    const allowed = asOk(
      transition(
        make("open", true, null),
        { action: "assign", actor: agent, assigneeId: "agent-2" },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.status, "open");
    assert.equal(allowed.ticket?.assigneeId, "agent-2");
    assert.deepEqual(allowed.attention, { effect: "unchanged" });
    assert.equal(allowed.ticket?.needsAttention, true);
  });

  it("unassigning leaves the status and the flag unchanged", () => {
    const allowed = asOk(
      transition(
        make("in_progress", true, "agent-9"),
        { action: "unassign", actor: agent },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.status, "in_progress");
    assert.equal(allowed.ticket?.assigneeId, null);
    assert.equal(allowed.ticket?.assignedAt, null);
    assert.equal(allowed.ticket?.firstAcceptedBy, "agent-9");
    assert.deepEqual(allowed.attention, { effect: "unchanged" });
  });

  it("a staff status target equal to the current status is an illegal transition", () => {
    assert.deepEqual(
      transition(
        sample("open"),
        { action: "set_status", actor: agent, to: "open" },
        ctx(NOW),
      ),
      { ok: false, httpStatus: 409, code: "INVALID_TRANSITION" },
    );
  });

  it("setting Cancelled through the status action is an illegal transition", () => {
    assert.deepEqual(
      transition(
        sample("open"),
        { action: "set_status", actor: agent, to: "cancelled" },
        ctx(NOW),
      ),
      { ok: false, httpStatus: 409, code: "INVALID_TRANSITION" },
    );
  });

  it("a move to Resolved refuses a window outside 1 to 14 and leaves the ticket unchanged", () => {
    assert.deepEqual(
      transition(
        sample("open"),
        { action: "set_status", actor: agent, to: "resolved" },
        ctx(NOW, 0),
      ),
      { ok: false, httpStatus: null, code: null },
    );
  });

  it("moving an already assigned New ticket does not replace the assignee", () => {
    const next = asTicket(
      transition(
        make("new", true, "agent-9"),
        { action: "set_status", actor: agent, to: "open" },
        ctx(NOW),
      ),
    );
    assert.equal(next.assigneeId, "agent-9");
    assert.equal(next.assignedAt, EARLIER);
    assert.equal(next.status, "open");
  });

  it("staff cancel from New or Resolved cancels with staff_cancelled and no customer email", () => {
    for (const status of ["new", "resolved"] as const) {
      const allowed = asOk(
        transition(
          sample(status),
          { action: "staff_cancel", actor: admin },
          ctx(NOW),
        ),
      );
      assert.equal(allowed.ticket?.status, "cancelled");
      assert.equal(allowed.customerEmail, false);
      assert.equal(allowed.staffAlert, false);
      assertClear(allowed.attention, "staff_cancelled", "staff");
    }
  });

  it("staff cannot cancel a Closed ticket", () => {
    assert.deepEqual(
      transition(
        make("closed", false, null),
        { action: "staff_cancel", actor: agent },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 409,
        code: "TICKET_READ_ONLY",
      },
    );
  });

  it("a customer cancel clears the flag as System and alerts staff", () => {
    const allowed = asOk(
      transition(
        sample("waiting_on_customer"),
        { action: "customer_cancel", actor: customer },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.status, "cancelled");
    assert.equal(allowed.customerEmail, false);
    assert.equal(allowed.staffAlert, true);
    assertClear(allowed.attention, "customer_cancelled", "system");
  });

  it("a customer cannot cancel a Resolved ticket", () => {
    assert.deepEqual(
      transition(
        sample("resolved"),
        { action: "customer_cancel", actor: customer },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
  });

  it("a customer reply on Open sets the flag and leaves the status", () => {
    const allowed = asOk(
      transition(
        make("open", false, null),
        { action: "customer_reply", actor: customer },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.status, "open");
    assert.equal(allowed.staffAlert, false);
    assert.deepEqual(allowed.attention, {
      effect: "set",
      reason: "customer_reply",
    });
  });

  it("a customer reply on Waiting on Customer moves the ticket to Open and sets the flag", () => {
    const next = asTicket(
      transition(
        sample("waiting_on_customer"),
        { action: "customer_reply", actor: customer },
        ctx(NOW),
      ),
    );
    assert.equal(next.status, "open");
    assert.equal(next.needsAttention, true);
  });

  it("a customer reply on Resolved keeps the status, the due time, and alerts staff", () => {
    const allowed = asOk(
      transition(
        sample("resolved"),
        { action: "customer_reply", actor: customer },
        ctx(BEFORE_DUE),
      ),
    );
    assert.equal(allowed.ticket?.status, "resolved");
    assert.equal(allowed.ticket?.autoCloseDueAt, DUE);
    assert.equal(allowed.staffAlert, true);
    assert.deepEqual(allowed.attention, {
      effect: "set",
      reason: "customer_reply",
    });
  });

  it("a customer cannot reply on a Closed ticket", () => {
    assert.deepEqual(
      transition(
        make("closed", false, null),
        { action: "customer_reply", actor: customer },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
  });

  it("a customer reopen before the due time opens the ticket, clears the clock, and keeps the assignee", () => {
    const allowed = asOk(
      transition(
        make("resolved", false, "agent-9"),
        { action: "customer_reopen", actor: customer },
        ctx(BEFORE_DUE),
      ),
    );
    assert.equal(allowed.ticket?.status, "open");
    assert.equal(allowed.ticket?.assigneeId, "agent-9");
    assert.equal(allowed.ticket?.resolvedAt, null);
    assert.equal(allowed.ticket?.autoCloseDueAt, null);
    assert.equal(allowed.staffAlert, true);
    assert.deepEqual(allowed.attention, {
      effect: "set",
      reason: "customer_reopen",
    });
  });

  it("a customer cannot reopen at or after the due time, or from a status that is not Resolved", () => {
    assert.deepEqual(
      transition(
        sample("resolved"),
        { action: "customer_reopen", actor: customer },
        ctx(AT_DUE),
      ),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
    assert.deepEqual(
      transition(
        sample("resolved"),
        { action: "customer_reopen", actor: customer },
        ctx(AFTER_DUE),
      ),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
    assert.deepEqual(
      transition(
        sample("open"),
        { action: "customer_reopen", actor: customer },
        ctx(BEFORE_DUE),
      ),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
  });

  it("a Resolved ticket with no due time cannot be reopened or auto-closed", () => {
    const missing: Ticket = {
      ...sample("resolved"),
      autoCloseDueAt: null,
      resolvedAt: null,
    };
    assert.deepEqual(
      transition(
        missing,
        { action: "customer_reopen", actor: customer },
        ctx(BEFORE_DUE),
      ),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
    assert.deepEqual(
      transition(
        missing,
        { action: "auto_close", actor: system },
        ctx(AFTER_DUE),
      ),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
  });

  it("auto-close at the due time closes the ticket with no customer email", () => {
    const allowed = asOk(
      transition(
        sample("resolved"),
        { action: "auto_close", actor: system },
        ctx(AT_DUE),
      ),
    );
    assert.equal(allowed.ticket?.status, "closed");
    assert.equal(allowed.ticket?.closedAt, AT_DUE);
    assert.equal(allowed.ticket?.resolvedAt, RESOLVED_AT);
    assert.equal(allowed.customerEmail, false);
    assertClear(allowed.attention, "auto_closed", "system");
  });

  it("auto-close does nothing before the due time or from Waiting on Customer", () => {
    assert.deepEqual(
      transition(
        sample("resolved"),
        { action: "auto_close", actor: system },
        ctx(BEFORE_DUE),
      ),
      {
        ok: false,
        httpStatus: null,
        code: null,
      },
    );
    assert.deepEqual(
      transition(
        sample("waiting_on_customer"),
        { action: "auto_close", actor: system },
        ctx(AFTER_DUE),
      ),
      { ok: false, httpStatus: null, code: null },
    );
  });

  it("an Admin reopen of Closed opens it, clears the flag, and sends no customer email", () => {
    const allowed = asOk(
      transition(
        make("closed", true, "agent-9"),
        { action: "admin_reopen", actor: admin },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.status, "open");
    assert.equal(allowed.ticket?.closedAt, EARLIER);
    assert.equal(allowed.customerEmail, false);
    assertClear(allowed.attention, "staff_status_change", "staff");
  });

  it("an Admin cannot reopen a ticket that is not Closed", () => {
    assert.deepEqual(
      transition(
        sample("open"),
        { action: "admin_reopen", actor: admin },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 409,
        code: "INVALID_TRANSITION",
      },
    );
  });

  it("an Admin restore of Cancelled opens it and clears the flag with no customer email", () => {
    const allowed = asOk(
      transition(
        make("cancelled", true, null),
        { action: "admin_restore", actor: admin },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.status, "open");
    assert.equal(allowed.customerEmail, false);
    assertClear(allowed.attention, "staff_status_change", "staff");
  });

  it("an Admin cannot restore a ticket that is not Cancelled", () => {
    assert.deepEqual(
      transition(
        make("closed", false, null),
        { action: "admin_restore", actor: admin },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 409,
        code: "INVALID_TRANSITION",
      },
    );
  });

  it("an Agent cannot reopen or hard-delete", () => {
    assert.deepEqual(
      transition(
        make("closed", false, null),
        { action: "admin_reopen", actor: agent },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 403,
        code: "FORBIDDEN",
      },
    );
    assert.deepEqual(
      transition(
        sample("open"),
        { action: "hard_delete", actor: agent },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 403,
        code: "FORBIDDEN",
      },
    );
  });

  it("an Admin hard-delete removes the ticket", () => {
    const allowed = asOk(
      transition(
        make("cancelled", false, null),
        { action: "hard_delete", actor: admin },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.deleted, true);
    assert.equal(allowed.ticket, null);
    assert.deepEqual(allowed.attention, { effect: "unchanged" });
  });

  it("mark as seen clears a flagged active ticket and a second call changes nothing", () => {
    const once = asOk(
      transition(
        sample("open"),
        { action: "mark_seen", actor: agent },
        ctx(NOW),
      ),
    );
    assertClear(once.attention, "marked_seen", "staff");
    assert.equal(once.ticket?.needsAttention, false);
    const twice = asOk(
      transition(once.ticket, { action: "mark_seen", actor: admin }, ctx(NOW)),
    );
    assert.deepEqual(twice.attention, { effect: "unchanged" });
    assert.equal(twice.ticket?.needsAttention, false);
  });

  it("mark as seen on Closed or Cancelled is refused", () => {
    for (const status of ["closed", "cancelled"] as const) {
      assert.deepEqual(
        transition(
          make(status, false, null),
          { action: "mark_seen", actor: admin },
          ctx(NOW),
        ),
        {
          ok: false,
          httpStatus: 409,
          code: "TICKET_READ_ONLY",
        },
      );
    }
  });

  it("an internal note and a view leave the flag set", () => {
    const noted = asOk(
      transition(
        make("cancelled", true, null),
        { action: "internal_note", actor: agent },
        ctx(NOW),
      ),
    );
    assert.equal(noted.ticket?.status, "cancelled");
    assert.equal(noted.ticket?.needsAttention, true);
    const viewed = asOk(
      transition(sample("open"), { action: "view", actor: customer }, ctx(NOW)),
    );
    assert.equal(viewed.ticket?.needsAttention, true);
    assert.deepEqual(viewed.attention, { effect: "unchanged" });
  });

  it("anonymous cannot view and the system actor cannot view", () => {
    assert.deepEqual(
      transition(
        sample("open"),
        { action: "view", actor: anonymous },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 401,
        code: "UNAUTHENTICATED",
      },
    );
    assert.deepEqual(
      transition(sample("open"), { action: "view", actor: system }, ctx(NOW)),
      {
        ok: false,
        httpStatus: 403,
        code: "FORBIDDEN",
      },
    );
  });

  it("a priority change leaves the flag, and a terminal ticket refuses it", () => {
    const allowed = asOk(
      transition(
        sample("open"),
        { action: "set_priority", actor: agent, priority: "high" },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.priority, "high");
    assert.equal(allowed.ticket?.needsAttention, true);
    assert.deepEqual(
      transition(
        make("closed", false, null),
        { action: "set_priority", actor: admin, priority: "urgent" },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 409,
        code: "TICKET_READ_ONLY",
      },
    );
  });

  it("correcting the email revokes access and does not clear the flag", () => {
    const allowed = asOk(
      transition(
        sample("in_progress"),
        { action: "correct_email", actor: agent, email: "next@example.com" },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.customerEmail, "next@example.com");
    assert.equal(allowed.ticket?.emailConfirmedAt, null);
    assert.equal(allowed.ticket?.needsAttention, true);
    assert.equal(allowed.confirmationResent, true);
    assert.equal(allowed.revokeCustomerAccess, true);
    assert.deepEqual(
      transition(
        make("cancelled", false, null),
        { action: "correct_email", actor: admin, email: "next@example.com" },
        ctx(NOW),
      ),
      { ok: false, httpStatus: 409, code: "TICKET_READ_ONLY" },
    );
  });

  it("a public reply clears the flag and emails the customer", () => {
    const allowed = asOk(
      transition(
        sample("in_progress"),
        { action: "public_reply", actor: agent },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.status, "in_progress");
    assert.equal(allowed.customerEmail, true);
    assertClear(allowed.attention, "staff_reply", "staff");
  });

  it("a public reply that also sets Waiting on Customer is one status change", () => {
    const allowed = asOk(
      transition(
        sample("in_progress"),
        {
          action: "public_reply",
          actor: agent,
          setStatus: "waiting_on_customer",
        },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.status, "waiting_on_customer");
    assert.equal(allowed.customerEmail, true);
    assertClear(allowed.attention, "staff_status_change", "staff");
  });

  it("a public reply that repeats Resolved does not move the due time", () => {
    const allowed = asOk(
      transition(
        sample("resolved"),
        { action: "public_reply", actor: agent, setStatus: "resolved" },
        ctx(NOW),
      ),
    );
    assert.equal(allowed.ticket?.status, "resolved");
    assert.equal(allowed.ticket?.autoCloseDueAt, DUE);
    assert.equal(allowed.customerEmail, true);
    assertClear(allowed.attention, "staff_reply", "staff");
  });

  it("a public reply on an unassigned New ticket does not assign anyone", () => {
    const next = asTicket(
      transition(
        sample("new"),
        { action: "public_reply", actor: agent },
        ctx(NOW),
      ),
    );
    assert.equal(next.status, "new");
    assert.equal(next.assigneeId, null);
  });

  it("a public reply on a Closed ticket is refused", () => {
    assert.deepEqual(
      transition(
        make("closed", false, null),
        { action: "public_reply", actor: admin },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 409,
        code: "TICKET_READ_ONLY",
      },
    );
  });

  it("anonymous staff actions are unauthenticated and a customer session cannot take them", () => {
    assert.deepEqual(
      transition(
        sample("new"),
        { action: "accept", actor: anonymous },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 401,
        code: "UNAUTHENTICATED",
      },
    );
    assert.deepEqual(
      transition(
        sample("new"),
        { action: "accept", actor: customer },
        ctx(NOW),
      ),
      {
        ok: false,
        httpStatus: 403,
        code: "FORBIDDEN",
      },
    );
  });

  it("only the system actor can auto-close", () => {
    assert.deepEqual(
      transition(
        sample("resolved"),
        { action: "auto_close", actor: agent },
        ctx(AT_DUE),
      ),
      {
        ok: false,
        httpStatus: 403,
        code: "FORBIDDEN",
      },
    );
  });

  it("locks the section 14 limits, the reopen cap, and staff visibility", () => {
    assert.deepEqual(LIMITS, {
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
    });
    assert.equal(DISPLAY_TIMEZONE, "America/New_York");
    assert.equal(AUTO_CLOSE_CRON, "*/15 * * * *");
    assert.equal(isValidReopenWindow(1), true);
    assert.equal(isValidReopenWindow(14), true);
    assert.equal(isValidReopenWindow(7), true);
    assert.equal(isValidReopenWindow(0), false);
    assert.equal(isValidReopenWindow(15), false);
    assert.equal(isValidReopenWindow(1.5), false);
    assert.equal(ticketScopeFor("agent"), "all");
    assert.equal(ticketScopeFor("admin"), "all");
    assert.deepEqual(PRIORITIES, ["low", "normal", "high", "urgent"]);
  });
});

function commands(actor: Actor): Command[] {
  const list: Command[] = [
    { action: "submit", actor, customerEmail: "person@example.com" },
    { action: "accept", actor },
    { action: "assign", actor, assigneeId: "agent-2" },
    { action: "unassign", actor },
    { action: "internal_note", actor },
    { action: "view", actor },
    { action: "mark_seen", actor },
    { action: "staff_cancel", actor },
    { action: "correct_email", actor, email: "next@example.com" },
    { action: "public_reply", actor },
    { action: "public_reply", actor, setStatus: "waiting_on_customer" },
    { action: "public_reply", actor, setStatus: "resolved" },
    { action: "customer_reply", actor },
    { action: "customer_cancel", actor },
    { action: "customer_reopen", actor },
    { action: "auto_close", actor },
    { action: "admin_reopen", actor },
    { action: "admin_restore", actor },
    { action: "hard_delete", actor },
  ];
  for (const to of STATUSES) list.push({ action: "set_status", actor, to });
  for (const priority of PRIORITIES)
    list.push({ action: "set_priority", actor, priority });
  return list;
}

afterAll(async () => {
  const taken = (await session.post("Profiler.takePreciseCoverage")) as {
    result: Array<{
      url: string;
      functions: Array<{
        functionName: string;
        ranges: Array<{
          startOffset: number;
          endOffset: number;
          count: number;
        }>;
      }>;
    }>;
  };
  const lines: string[] = [];
  const missed: string[] = [];
  for (const script of taken.result) {
    if (!script.url.includes("domain.ts") || script.url.includes("domain.test"))
      continue;
    for (const fn of script.functions) {
      if (fn.functionName === "") continue;
      const covered = fn.ranges.filter((range) => range.count > 0).length;
      lines.push(`${fn.functionName} ${covered}/${fn.ranges.length}`);
      for (const range of fn.ranges) {
        if (range.count === 0) {
          missed.push(
            `${fn.functionName} ${range.startOffset}-${range.endOffset}`,
          );
        }
      }
    }
  }
  lines.sort();
  assert.ok(
    lines.length > 0,
    taken.result.map((script) => script.url).join("\n"),
  );
  assert.deepEqual(missed, [], missed.join("\n"));
  await session.post("Profiler.stopPreciseCoverage");
  await session.post("Profiler.disable");
  session.disconnect();
});
