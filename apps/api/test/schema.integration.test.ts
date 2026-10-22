import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "vitest";

import { testClock } from "../src/clock.js";
import { seedDatabase } from "../src/seed.js";
import {
  APP_TABLES,
  createAudit,
  createEvent,
  createMessage,
  createProduct,
  createTicket,
  createUser,
  truncateAll,
} from "../src/test-db.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const schema = "apps/api/prisma/schema.prisma";
const databaseUrl = process.env.DATABASE_URL;

function runPrisma(args: string[], input?: string): void {
  execFileSync(join(repoRoot, "node_modules/.bin/prisma"), args, {
    cwd: repoRoot,
    env: process.env,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function deploy(): void {
  runPrisma(["migrate", "deploy", "--schema", schema]);
}

function emptyDatabase(): void {
  runPrisma(
    ["db", "execute", "--stdin", "--schema", schema],
    [
      "DROP SCHEMA IF EXISTS public CASCADE;",
      "CREATE SCHEMA public;",
      "GRANT ALL ON SCHEMA public TO public;",
      "GRANT ALL ON SCHEMA public TO CURRENT_USER;",
    ].join("\n"),
  );
}

let prisma: PrismaClient;

beforeAll(async () => {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for schema integration tests");
  }
  emptyDatabase();
  deploy();
  prisma = new PrismaClient();
}, 60_000);

beforeEach(async () => {
  testClock.reset();
  await truncateAll(prisma);
});

afterEach(() => {
  testClock.reset();
});

afterAll(async () => {
  await prisma?.$disconnect();
});

describe("schema migration", () => {
  it("creates every ARCHITECTURE section 5 table on an empty database", async () => {
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const names = new Set(rows.map((row) => row.table_name));
    for (const table of APP_TABLES) assert.ok(names.has(table), table);
    const applied = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations ORDER BY migration_name
    `;
    assert.deepEqual(
      applied.map((row) => row.migration_name),
      ["20261022193000_init", "20261022200000_history_no_truncate"],
    );
  });

  it("applies the same migration again", () => {
    deploy();
  });

  it("stores time-ordered uuid version 7 primary keys", async () => {
    const user = await createUser(prisma);
    assert.equal(user.id[14], "7");
    assert.match(user.id, /^[0-9a-f-]{36}$/);
  });

  it("accepts one row in every table", async () => {
    const user = await createUser(prisma, { role: "administrator" });
    const product = await createProduct(prisma);
    const ticket = await createTicket(prisma, product.id, {
      impact: "question",
    });
    const message = await createMessage(prisma, ticket.id, {
      author_type: "staff",
      author_user_id: user.id,
      visibility: "internal",
      body: "Noted for the queue.",
    });
    await createEvent(prisma, ticket.id, {
      actor_type: "staff",
      actor_user_id: user.id,
      type: "status_changed",
      from_status: "new",
      to_status: "open",
      data: { priority: "high" },
    });
    await createAudit(prisma, { actor_user_id: user.id, ip: "127.0.0.1" });
    const expires = new Date("2026-05-01T00:00:00.000Z");
    await prisma.session.create({
      data: {
        user_id: user.id,
        token_hash: randomBytes(32),
        client_type: "web",
        auth_methods: "password",
        idle_expires_at: expires,
        absolute_expires_at: expires,
        ip: "127.0.0.1",
        user_agent: "test",
      },
    });
    await prisma.userMfaFactor.create({
      data: {
        user_id: user.id,
        type: "totp",
        secret_encrypted: randomBytes(16),
      },
    });
    await prisma.loginAttempt.create({
      data: {
        email_attempted: user.email,
        user_id: user.id,
        ip: "127.0.0.1",
        success: false,
        reason: "bad_password",
      },
    });
    await prisma.attachment.create({
      data: {
        ticket_id: ticket.id,
        message_id: message.id,
        uploaded_by_type: "staff",
        uploaded_by_user_id: user.id,
        original_filename: "log.txt",
        storage_key: randomBytes(16).toString("hex"),
        detected_mime: "text/plain",
        size_bytes: 12,
        sha256: randomBytes(32),
      },
    });
    const link = await prisma.secureLink.create({
      data: {
        ticket_id: ticket.id,
        token_hash: randomBytes(32),
        purpose: "lookup",
        expires_at: expires,
      },
    });
    await prisma.customerAccessSession.create({
      data: {
        ticket_id: ticket.id,
        secure_link_id: link.id,
        token_hash: randomBytes(32),
        idle_expires_at: expires,
        absolute_expires_at: expires,
      },
    });
    await prisma.emailOutbox.create({
      data: {
        template: "customer_notification",
        to_address: "customer@example.com",
        ticket_id: ticket.id,
        params: { reference: ticket.reference },
        idempotency_key: `ticket-${ticket.id}`,
      },
    });
    await prisma.emailOutbox.create({
      data: {
        template: "health_alert",
        to_address: "admin@example.com",
        params: { issue: "scanner" },
        idempotency_key: "health-scanner",
      },
    });
    await prisma.idempotencyKey.create({
      data: {
        key_hash: randomBytes(32),
        scope: "public.tickets.create",
        request_fingerprint: randomBytes(32),
        state: "in_progress",
        expires_at: expires,
      },
    });
    await prisma.setting.create({
      data: { key: "example", value: { ok: true }, updated_by: user.id },
    });
    await prisma.backupRun.create({
      data: {
        kind: "backup",
        outcome: "success",
        detail: "nightly",
        started_at: expires,
        finished_at: expires,
      },
    });
    await prisma.captchaSpent.create({
      data: { signature_hash: randomBytes(32), expires_at: expires },
    });

    assert.equal(await prisma.user.count(), 1);
    assert.equal(await prisma.ticket.count(), 1);
    assert.equal(await prisma.emailOutbox.count(), 2);
    assert.equal(await prisma.captchaSpent.count(), 1);
  });

  it("rejects an over-long subject, a bad reference, and a mixed-case email", async () => {
    const product = await createProduct(prisma);
    await assert.rejects(() =>
      createTicket(prisma, product.id, { subject: "x".repeat(151) }),
    );
    await assert.rejects(() =>
      createTicket(prisma, product.id, { description: "x".repeat(10_001) }),
    );
    await assert.rejects(() =>
      createTicket(prisma, product.id, { reference: "HD-000000" }),
    );
    await assert.rejects(() =>
      createTicket(prisma, product.id, { customer_name: "n".repeat(101) }),
    );
    await assert.rejects(() =>
      createUser(prisma, { email: "Mixed@example.com" }),
    );
  });

  it("blocks changes to subject and description and allows a status change", async () => {
    const product = await createProduct(prisma);
    const ticket = await createTicket(prisma, product.id);
    await assert.rejects(() =>
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { subject: "A different subject" },
      }),
    );
    await assert.rejects(() =>
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { description: "A different description" },
      }),
    );
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "open", version: { increment: 1 } },
    });
    const stored = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
    });
    assert.equal(stored.subject, "Printer jam");
    assert.equal(stored.status, "open");
    assert.equal(stored.version, 1);
  });

  it("searches subject, description, customer name, and message body in English", async () => {
    const product = await createProduct(prisma);
    const ticket = await createTicket(prisma, product.id, {
      subject: "Printer jam",
      description: "Paper is stuck.",
      customer_name: "Ada",
    });
    await createMessage(prisma, ticket.id, {
      body: "The queue still shows the job.",
    });
    const subjectHits = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n
      FROM tickets
      WHERE search_vector @@ websearch_to_tsquery('english', 'printer')
    `;
    const nameHits = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n
      FROM tickets
      WHERE search_vector @@ websearch_to_tsquery('english', 'Ada')
    `;
    const bodyHits = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n
      FROM ticket_messages
      WHERE search_vector @@ websearch_to_tsquery('english', 'queue')
    `;
    assert.equal(subjectHits[0]?.n, 1);
    assert.equal(nameHits[0]?.n, 1);
    assert.equal(bodyHits[0]?.n, 1);
    const indexes = await prisma.$queryRaw<
      { indexname: string; indexdef: string }[]
    >`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE indexname IN (
        'tickets_search_vector_idx',
        'ticket_messages_search_vector_idx',
        'tickets_needs_attention_idx'
      )
    `;
    const byName = new Map(indexes.map((row) => [row.indexname, row.indexdef]));
    assert.match(byName.get("tickets_search_vector_idx") ?? "", /USING gin/i);
    assert.match(
      byName.get("ticket_messages_search_vector_idx") ?? "",
      /USING gin/i,
    );
    assert.match(
      byName.get("tickets_needs_attention_idx") ?? "",
      /WHERE \(?needs_attention\)?/i,
    );
  });

  it("stores factory timestamps from the test clock", async () => {
    testClock.set(new Date("2026-04-01T12:00:00.000Z"));
    const product = await createProduct(prisma);
    const ticket = await createTicket(prisma, product.id);
    assert.equal(ticket.created_at.toISOString(), "2026-04-01T12:00:00.000Z");
  });
});

describe("append-only history", () => {
  async function history() {
    const product = await createProduct(prisma);
    const ticket = await createTicket(prisma, product.id);
    const message = await createMessage(prisma, ticket.id);
    const event = await createEvent(prisma, ticket.id);
    const audit = await createAudit(prisma);
    return { ticket, message, event, audit };
  }

  it("[AC-AUD-17] a direct UPDATE of a history row is rejected and the row is unchanged", async () => {
    const { message, event, audit } = await history();
    await assert.rejects(
      () =>
        prisma.$executeRaw`UPDATE ticket_events SET type = 'tampered' WHERE id = ${event.id}`,
    );
    await assert.rejects(
      () =>
        prisma.$executeRaw`UPDATE ticket_messages SET body = 'tampered' WHERE id = ${message.id}::uuid`,
    );
    await assert.rejects(
      () =>
        prisma.$executeRaw`UPDATE audit_log SET action = 'tampered' WHERE id = ${audit.id}`,
    );
    assert.equal(
      (await prisma.ticketEvent.findUniqueOrThrow({ where: { id: event.id } }))
        .type,
      "created",
    );
    assert.equal(
      (
        await prisma.ticketMessage.findUniqueOrThrow({
          where: { id: message.id },
        })
      ).body,
      "It is still jammed.",
    );
    assert.equal(
      (await prisma.auditLog.findUniqueOrThrow({ where: { id: audit.id } }))
        .action,
      "ticket.hard_deleted",
    );
  });

  it("[AC-AUD-18] a direct DELETE of one history row is rejected, and history leaves only with its ticket", async () => {
    const { ticket, message, event, audit } = await history();
    await assert.rejects(
      () =>
        prisma.$executeRaw`DELETE FROM ticket_events WHERE id = ${event.id}`,
    );
    await assert.rejects(
      () =>
        prisma.$executeRaw`DELETE FROM ticket_messages WHERE id = ${message.id}::uuid`,
    );
    await assert.rejects(
      () => prisma.$executeRaw`DELETE FROM audit_log WHERE id = ${audit.id}`,
    );
    assert.equal(await prisma.ticketEvent.count(), 1);
    assert.equal(await prisma.ticketMessage.count(), 1);
    assert.equal(await prisma.auditLog.count(), 1);

    await assert.rejects(() =>
      prisma.ticket.delete({ where: { id: ticket.id } }),
    );
    assert.equal(await prisma.ticketEvent.count(), 1);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('helpdesk.purge', 'on', true)`;
      await tx.ticket.delete({ where: { id: ticket.id } });
    });
    assert.equal(await prisma.ticketEvent.count(), 0);
    assert.equal(await prisma.ticketMessage.count(), 0);
    assert.equal(await prisma.auditLog.count(), 1);
  });

  it("rejects TRUNCATE of history tables even when purge is on", async () => {
    const product = await createProduct(prisma);
    const ticket = await createTicket(prisma, product.id);
    await createMessage(prisma, ticket.id);
    await createEvent(prisma, ticket.id);
    await createAudit(prisma);
    for (const table of ["ticket_events", "ticket_messages", "audit_log"]) {
      await assert.rejects(() =>
        prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table}`),
      );
      await assert.rejects(() =>
        prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('helpdesk.purge', 'on', true)`;
          await tx.$executeRawUnsafe(`TRUNCATE TABLE ${table}`);
        }),
      );
    }
    assert.equal(await prisma.ticketEvent.count(), 1);
    assert.equal(await prisma.ticketMessage.count(), 1);
    assert.equal(await prisma.auditLog.count(), 1);
  });

  it("[AC-AUD-19] a direct edit or delete of a history entry is denied", async () => {
    const user = await createUser(prisma, { role: "agent" });
    const product = await createProduct(prisma);
    const ticket = await createTicket(prisma, product.id);
    const event = await createEvent(prisma, ticket.id, {
      actor_type: "staff",
      actor_user_id: user.id,
      type: "accepted",
    });
    await assert.rejects(
      () =>
        prisma.$executeRaw`UPDATE ticket_events SET type = 'tampered' WHERE id = ${event.id}`,
    );
    await assert.rejects(
      () =>
        prisma.$executeRaw`DELETE FROM ticket_events WHERE id = ${event.id}`,
    );
    const stored = await prisma.ticketEvent.findUniqueOrThrow({
      where: { id: event.id },
    });
    assert.equal(stored.type, "accepted");
    assert.equal(stored.actor_user_id, user.id);
  });
});

describe("fresh installation seed", () => {
  it("[AC-FORM-09] a fresh installation lists only Device Monitor", async () => {
    await seedDatabase(prisma, {});
    const products = await prisma.product.findMany();
    assert.deepEqual(
      products.map((product) => product.name),
      ["Device Monitor"],
    );
    assert.equal(products[0]?.is_active, true);
  });

  it("[AC-CLOSE-12] a fresh installation sets the reopen window to 14 days", async () => {
    await seedDatabase(prisma, {});
    const setting = await prisma.setting.findUniqueOrThrow({
      where: { key: "reopen_window_days" },
    });
    assert.equal(setting.value, 14);
  });

  it("[AC-GEN-12] a fresh installation stores the branding placeholders", async () => {
    await seedDatabase(prisma, {});
    const rows = await prisma.setting.findMany();
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    assert.equal(stored.site_name, ["Help", "Desk"].join(" "));
    assert.equal(stored.company_name, ["Your", "Company"].join(" "));
    assert.equal(stored.brand_primary_color, "#2563EB");
    assert.equal(stored.brand_logo_key, "");
    assert.equal(stored.portal_footer_text, "");
    assert.equal(stored.email_from_name, ["Help", "Desk"].join(" "));
    assert.equal(stored.support_email_display, "you@example.com");
  });

  it("is idempotent and does not undo an admin change", async () => {
    await seedDatabase(prisma, {});
    await prisma.setting.update({
      where: { key: "reopen_window_days" },
      data: { value: 7 },
    });
    await prisma.product.update({
      where: { name: "Device Monitor" },
      data: { name: "Renamed Monitor" },
    });
    await prisma.setting.delete({ where: { key: "portal_footer_text" } });
    await seedDatabase(prisma, {});

    assert.equal(await prisma.product.count(), 1);
    assert.equal((await prisma.product.findFirst())?.name, "Renamed Monitor");
    assert.equal(
      (
        await prisma.setting.findUniqueOrThrow({
          where: { key: "reopen_window_days" },
        })
      ).value,
      7,
    );
    assert.equal(
      (
        await prisma.setting.findUniqueOrThrow({
          where: { key: "portal_footer_text" },
        })
      ).value,
      "",
    );
  });
});
