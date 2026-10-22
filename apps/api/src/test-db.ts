import { randomBytes } from "node:crypto";

import type { Prisma, PrismaClient } from "@prisma/client";

import { testClock } from "./clock.js";

const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export const APP_TABLES = [
  "customer_access_sessions",
  "secure_links",
  "attachments",
  "ticket_events",
  "ticket_messages",
  "email_outbox",
  "idempotency_keys",
  "tickets",
  "login_attempts",
  "sessions",
  "user_mfa_factors",
  "audit_log",
  "backup_runs",
  "captcha_spent",
  "settings",
  "users",
  "products",
] as const;

export function referenceId(): string {
  const bytes = randomBytes(6);
  let body = "";
  for (const byte of bytes) {
    body += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  }
  return `HD-${body}`;
}

export async function truncateAll(client: PrismaClient): Promise<void> {
  await client.$executeRawUnsafe(
    `TRUNCATE TABLE ${APP_TABLES.join(", ")} RESTART IDENTITY CASCADE`,
  );
}

export async function createUser(
  client: PrismaClient,
  data: Partial<Prisma.UserCreateInput> = {},
) {
  const stamp = testClock.now();
  return client.user.create({
    data: {
      email: `user-${randomBytes(4).toString("hex")}@example.com`,
      display_name: "Test User",
      role: "agent",
      password_hash: "test-hash",
      password_changed_at: stamp,
      created_at: stamp,
      ...data,
    },
  });
}

export async function createProduct(client: PrismaClient, name?: string) {
  return client.product.create({
    data: {
      name: name ?? `Product ${randomBytes(3).toString("hex")}`,
      is_active: true,
      sort_order: 1,
    },
  });
}

export async function createTicket(
  client: PrismaClient,
  productId: string,
  data: Partial<Prisma.TicketUncheckedCreateInput> = {},
) {
  const stamp = testClock.now();
  return client.ticket.create({
    data: {
      reference: referenceId(),
      product_id: productId,
      customer_email: "customer@example.com",
      customer_name: "Ada",
      subject: "Printer jam",
      description: "The printer on the second floor is jammed.",
      status: "new",
      needs_attention: true,
      needs_attention_reason: "new_ticket",
      created_at: stamp,
      updated_at: stamp,
      ...data,
    },
  });
}

export async function createMessage(
  client: PrismaClient,
  ticketId: string,
  data: Partial<Prisma.TicketMessageUncheckedCreateInput> = {},
) {
  return client.ticketMessage.create({
    data: {
      ticket_id: ticketId,
      author_type: "customer",
      visibility: "public",
      body: "It is still jammed.",
      created_at: testClock.now(),
      ...data,
    },
  });
}

export async function createEvent(
  client: PrismaClient,
  ticketId: string,
  data: Partial<Prisma.TicketEventUncheckedCreateInput> = {},
) {
  return client.ticketEvent.create({
    data: {
      ticket_id: ticketId,
      type: "created",
      actor_type: "customer",
      customer_visible: true,
      created_at: testClock.now(),
      ...data,
    },
  });
}

export async function createAudit(
  client: PrismaClient,
  data: Partial<Prisma.AuditLogUncheckedCreateInput> = {},
) {
  return client.auditLog.create({
    data: {
      action: "ticket.hard_deleted",
      data: { reference: "HD-234567", messages: 1 },
      created_at: testClock.now(),
      ...data,
    },
  });
}
