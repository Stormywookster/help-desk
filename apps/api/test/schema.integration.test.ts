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
  ensurePrivilegeRoles,
  truncateAll,
} from "../src/test-db.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const schema = "apps/api/prisma/schema.prisma";
const databaseUrl = process.env.DATABASE_URL;

function roleUrl(base: string, user: string): string {
  const url = new URL(base);
  url.username = user;
  return url.toString();
}

function passwordOf(url: string): string {
  return decodeURIComponent(new URL(url).password);
}

const ownerUrl =
  process.env.MIGRATE_DATABASE_URL ??
  (databaseUrl ? roleUrl(databaseUrl, "helpdesk_owner") : "");
const appUrl =
  process.env.APP_DATABASE_URL ??
  (databaseUrl ? roleUrl(databaseUrl, "helpdesk_app") : "");

function runPrisma(args: string[], input?: string, url = ownerUrl): void {
  execFileSync(join(repoRoot, "node_modules/.bin/prisma"), args, {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: url },
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
let app: PrismaClient;

function permissionDenied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  assert.match(message, /permission denied/i);
  assert.doesNotMatch(message, /append-only/);
  return true;
}

beforeAll(async () => {
  if (!databaseUrl || !ownerUrl || !appUrl) {
    throw new Error("DATABASE_URL is required for schema integration tests");
  }
  const bootstrap = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await ensurePrivilegeRoles(
      bootstrap,
      passwordOf(ownerUrl),
      passwordOf(appUrl),
    );
  } finally {
    await bootstrap.$disconnect();
  }
  emptyDatabase();
  deploy();
  prisma = new PrismaClient({ datasourceUrl: ownerUrl });
  app = new PrismaClient({ datasourceUrl: appUrl });
}, 60_000);

beforeEach(async () => {
  testClock.reset();
  await truncateAll(prisma);
});

afterEach(() => {
  testClock.reset();
});

afterAll(async () => {
  await app?.$disconnect();
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
      [
        "20261022193000_init",
        "20261022200000_history_no_truncate",
        "20261022210000_purge_privileges",
      ],
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

describe("purge privileges", () => {
  function quoteLiteral(value: string): string {
    return `'${value.replaceAll("'", "''")}'`;
  }

  async function ensureOtherRole(): Promise<void> {
    const literal = quoteLiteral(passwordOf(appUrl));
    await prisma.$executeRawUnsafe(`
      DO $roles$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'helpdesk_other') THEN
          CREATE ROLE helpdesk_other LOGIN NOSUPERUSER NOINHERIT PASSWORD ${literal};
        ELSE
          ALTER ROLE helpdesk_other WITH LOGIN NOSUPERUSER NOINHERIT PASSWORD ${literal};
        END IF;
      END
      $roles$;
    `);
  }

  it("keeps ownership, execute grants, and the truncate triggers", async () => {
    const owners = await prisma.$queryRaw<{ relname: string; owner: string }[]>`
      SELECT c.relname, r.rolname AS owner
      FROM pg_class AS c
      JOIN pg_namespace AS n ON n.oid = c.relnamespace
      JOIN pg_roles AS r ON r.oid = c.relowner
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'audit_log'
    `;
    assert.equal(owners[0]?.owner, "helpdesk_owner");
    const appOwned = await prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM pg_class AS c
      JOIN pg_roles AS r ON r.oid = c.relowner
      WHERE r.rolname = 'helpdesk_app' AND c.relkind = 'r'
    `;
    assert.equal(appOwned[0]?.count, 0);
    const privileges = await prisma.$queryRaw<
      {
        app_delete: boolean;
        app_truncate: boolean;
        app_update: boolean;
        app_execute: boolean;
      }[]
    >`
      SELECT
        has_table_privilege('helpdesk_app', 'audit_log', 'DELETE') AS app_delete,
        has_table_privilege('helpdesk_app', 'audit_log', 'TRUNCATE') AS app_truncate,
        has_table_privilege('helpdesk_app', 'audit_log', 'UPDATE') AS app_update,
        has_function_privilege(
          'helpdesk_app',
          'helpdesk_purge_ticket(uuid,uuid)',
          'EXECUTE'
        ) AS app_execute
    `;
    assert.equal(privileges[0]?.app_delete, false);
    assert.equal(privileges[0]?.app_truncate, false);
    assert.equal(privileges[0]?.app_update, false);
    assert.equal(privileges[0]?.app_execute, true);
    const functions = await prisma.$queryRaw<
      {
        name: string;
        owner: string;
        security_definer: boolean;
        config: string[] | null;
      }[]
    >`
      SELECT p.proname AS name, r.rolname AS owner, p.prosecdef AS security_definer, p.proconfig AS config
      FROM pg_proc AS p
      JOIN pg_roles AS r ON r.oid = p.proowner
      WHERE p.proname IN ('helpdesk_purge_ticket', 'helpdesk_erase_customer')
      ORDER BY p.proname
    `;
    assert.equal(functions.length, 2);
    for (const fn of functions) {
      assert.equal(fn.owner, "helpdesk_owner");
      assert.equal(fn.security_definer, true);
      assert.ok(
        fn.config?.some((entry) => entry === "search_path=pg_catalog, public"),
      );
    }
    const truncateTriggers = await prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM pg_trigger
      WHERE tgname IN (
        'ticket_events_append_only_truncate',
        'ticket_messages_append_only_truncate',
        'audit_log_append_only_truncate'
      ) AND NOT tgisinternal
    `;
    assert.equal(truncateTriggers[0]?.count, 3);
  });

  it("allows an audit update of only data and ip while purge is on", async () => {
    const audit = await createAudit(prisma, { ip: "203.0.113.8" });
    const createdAt = audit.created_at;
    await assert.rejects(
      () =>
        prisma.$executeRaw`UPDATE audit_log SET data = ${JSON.stringify({ reference: "HD-234567", messages: 1 })}::jsonb WHERE id = ${audit.id}`,
    );
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('helpdesk.purge', 'on', true)`;
      await tx.$executeRaw`
        UPDATE audit_log
        SET data = ${JSON.stringify({ reference: "HD-234567", messages: 1 })}::jsonb,
            ip = NULL
        WHERE id = ${audit.id}
      `;
    });
    const updated = await prisma.auditLog.findUniqueOrThrow({
      where: { id: audit.id },
    });
    assert.equal(updated.action, "ticket.hard_deleted");
    assert.equal(updated.actor_user_id, null);
    assert.equal(updated.created_at.toISOString(), createdAt.toISOString());
    assert.equal(updated.ip, null);
    assert.deepEqual(updated.data, { reference: "HD-234567", messages: 1 });
    await assert.rejects(() =>
      prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('helpdesk.purge', 'on', true)`;
        await tx.$executeRaw`UPDATE audit_log SET action = 'tampered' WHERE id = ${audit.id}`;
      }),
    );
    assert.equal(
      (await prisma.auditLog.findUniqueOrThrow({ where: { id: audit.id } }))
        .action,
      "ticket.hard_deleted",
    );
  });

  it("denies direct history deletes, truncates, and audit updates from the app role", async () => {
    const product = await createProduct(app);
    const ticket = await createTicket(app, product.id);
    const message = await createMessage(app, ticket.id);
    const event = await createEvent(app, ticket.id);
    const audit = await createAudit(app, { ip: "203.0.113.9" });
    const statements = [
      `DELETE FROM ticket_events WHERE id = ${event.id}`,
      `DELETE FROM ticket_messages WHERE id = '${message.id}'`,
      `DELETE FROM audit_log WHERE id = ${audit.id}`,
      `TRUNCATE TABLE ticket_events`,
      `TRUNCATE TABLE ticket_messages`,
      `TRUNCATE TABLE audit_log`,
      `UPDATE audit_log SET action = 'tampered' WHERE id = ${audit.id}`,
    ];
    for (const statement of statements) {
      await assert.rejects(
        () =>
          app.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('helpdesk.purge', 'on', true)`;
            await tx.$executeRawUnsafe(statement);
          }),
        permissionDenied,
      );
    }
    assert.equal(await app.ticketEvent.count(), 1);
    assert.equal(await app.ticketMessage.count(), 1);
    assert.equal(await app.auditLog.count(), 1);
    assert.equal(
      (await app.auditLog.findUniqueOrThrow({ where: { id: audit.id } }))
        .action,
      "ticket.hard_deleted",
    );
  });

  it("purges one ticket through helpdesk_app and writes a content-free audit row", async () => {
    const user = await createUser(app, { role: "administrator" });
    const product = await createProduct(app);
    const ticket = await createTicket(app, product.id, {
      customer_email: "ada@example.com",
      customer_name: "Ada Customer",
      subject: "Printer jam",
      description: "Paper is stuck.",
    });
    await createMessage(app, ticket.id, { body: "Still stuck." });
    await createEvent(app, ticket.id);
    const before = await app.auditLog.count();
    await app.$executeRaw`SELECT helpdesk_purge_ticket(${ticket.id}::uuid, ${user.id}::uuid)`;
    assert.equal(await app.ticket.count(), 0);
    assert.equal(await app.ticketMessage.count(), 0);
    assert.equal(await app.ticketEvent.count(), 0);
    assert.equal(await app.auditLog.count(), before + 1);
    const row = await app.auditLog.findFirstOrThrow({
      where: { action: "ticket.hard_deleted", actor_user_id: user.id },
    });
    const data = row.data as {
      references: string[];
      tickets: number;
      messages: number;
      events: number;
      attachments: number;
    };
    assert.deepEqual(data.references, [ticket.reference]);
    assert.equal(data.tickets, 1);
    assert.equal(data.messages, 1);
    assert.equal(data.events, 1);
    assert.equal(data.attachments, 0);
    const serialized = JSON.stringify(data);
    assert.equal(serialized.includes("ada@example.com"), false);
    assert.equal(serialized.includes("Ada Customer"), false);
    assert.equal(serialized.includes("Printer jam"), false);
    assert.equal(serialized.includes("Paper is stuck."), false);
    assert.equal(serialized.includes("Still stuck."), false);
  });

  it("erases a customer through helpdesk_app and redacts audit rows in place", async () => {
    const user = await createUser(app, { role: "administrator" });
    const product = await createProduct(app);
    const ada = await createTicket(app, product.id, {
      customer_email: "ada@example.com",
      customer_name: "Ada Customer",
      subject: "Printer jam",
    });
    const bob = await createTicket(app, product.id, {
      customer_email: "bob@example.com",
      customer_name: "Bob Other",
      reference: "HD-B2B234",
    });
    await createMessage(app, ada.id, { body: "Ada's reply" });
    const customerAudit = await createAudit(app, {
      action: "customer.note",
      ip: "203.0.113.5",
      data: {
        customer_email: "ada@example.com",
        customer_name: "Ada Customer",
        subject: "Printer jam",
        note: "the long complaint",
        reference: ada.reference,
        messages: 2,
      },
    });
    const staffAudit = await createAudit(app, {
      actor_user_id: user.id,
      action: "staff.note",
      ip: "192.0.2.10",
      data: {
        customer_email: "ada@example.com",
        note: "staff saw ada@example.com",
        reference: ada.reference,
        messages: 1,
      },
    });
    const otherAudit = await createAudit(app, {
      actor_user_id: user.id,
      action: "other.note",
      ip: "198.51.100.4",
      data: {
        customer_email: "bob@example.com",
        reference: bob.reference,
        messages: 1,
      },
    });
    const before = await app.auditLog.count();
    await app.$executeRaw`SELECT helpdesk_erase_customer(${"ada@example.com"}::citext, ${user.id}::uuid)`;

    assert.equal(await app.ticket.count({ where: { id: ada.id } }), 0);
    assert.equal(
      await app.ticketMessage.count({ where: { ticket_id: ada.id } }),
      0,
    );
    assert.equal(
      (await app.ticket.findUniqueOrThrow({ where: { id: bob.id } }))
        .customer_email,
      "bob@example.com",
    );
    assert.equal(await app.auditLog.count(), before + 1);

    const redactedCustomer = await app.auditLog.findUniqueOrThrow({
      where: { id: customerAudit.id },
    });
    const customerData = redactedCustomer.data as Record<string, unknown>;
    assert.equal(redactedCustomer.action, "customer.note");
    assert.equal(redactedCustomer.actor_user_id, null);
    assert.equal(
      redactedCustomer.created_at.toISOString(),
      customerAudit.created_at.toISOString(),
    );
    assert.equal(redactedCustomer.ip, null);
    assert.equal(customerData.customer_email, "[redacted]");
    assert.equal(customerData.customer_name, "[redacted]");
    assert.equal(customerData.subject, "[redacted]");
    assert.equal(customerData.note, "[redacted]");
    assert.equal(customerData.reference, ada.reference);
    assert.equal(customerData.messages, 2);
    assert.equal(typeof customerData.redacted_at, "string");

    const redactedStaff = await app.auditLog.findUniqueOrThrow({
      where: { id: staffAudit.id },
    });
    const staffData = redactedStaff.data as Record<string, unknown>;
    assert.equal(redactedStaff.actor_user_id, user.id);
    assert.equal(redactedStaff.action, "staff.note");
    assert.match(String(redactedStaff.ip), /^192\.0\.2\.10/);
    assert.equal(staffData.customer_email, "[redacted]");
    assert.equal(staffData.note, "[redacted]");
    assert.equal(staffData.reference, ada.reference);
    assert.equal(staffData.messages, 1);
    assert.equal(typeof staffData.redacted_at, "string");

    const untouched = await app.auditLog.findUniqueOrThrow({
      where: { id: otherAudit.id },
    });
    assert.deepEqual(untouched.data, otherAudit.data);
    assert.match(String(untouched.ip), /^198\.51\.100\.4/);
    assert.equal(JSON.stringify(untouched.data).includes("redacted_at"), false);

    const erased = await app.auditLog.findFirstOrThrow({
      where: { action: "customer.erased" },
    });
    const erasedData = erased.data as {
      references: string[];
      tickets: number;
      messages: number;
    };
    assert.equal(erased.actor_user_id, user.id);
    assert.deepEqual(erasedData.references, [ada.reference]);
    assert.equal(erasedData.tickets, 1);
    assert.equal(erasedData.messages, 1);
    const erasedText = JSON.stringify(erasedData);
    assert.equal(erasedText.includes("ada@example.com"), false);
    assert.equal(erasedText.includes("Ada Customer"), false);
    assert.equal(erasedText.includes("Printer jam"), false);
  });

  it("denies direct execution by a role other than helpdesk_app", async () => {
    await ensureOtherRole();
    const other = new PrismaClient({
      datasourceUrl: roleUrl(appUrl, "helpdesk_other"),
    });
    try {
      await assert.rejects(
        () =>
          other.$queryRaw`SELECT helpdesk_purge_ticket(${"00000000-0000-7000-8000-000000000001"}::uuid, ${"00000000-0000-7000-8000-000000000002"}::uuid)`,
        permissionDenied,
      );
      await assert.rejects(
        () =>
          other.$queryRaw`SELECT helpdesk_erase_customer(${"ada@example.com"}::citext, ${"00000000-0000-7000-8000-000000000002"}::uuid)`,
        permissionDenied,
      );
    } finally {
      await other.$disconnect();
    }
  });
});
