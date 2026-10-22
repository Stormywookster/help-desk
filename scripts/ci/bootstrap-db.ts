import { PrismaClient } from "@prisma/client";

import {
  assignDatabaseOwner,
  ensurePrivilegeRoles,
  preparePublicSchema,
} from "../../apps/api/src/test-db.js";

function passwordOf(url: string): string {
  return decodeURIComponent(new URL(url).password);
}

function roleUrl(base: string, user: string): string {
  const url = new URL(base);
  url.username = user;
  return url.toString();
}

const bootstrapUrl = process.env.BOOTSTRAP_DATABASE_URL;
if (!bootstrapUrl) {
  throw new Error("BOOTSTRAP_DATABASE_URL is required");
}

const ownerUrl =
  process.env.MIGRATE_DATABASE_URL ?? roleUrl(bootstrapUrl, "helpdesk_owner");
const appUrl =
  process.env.APP_DATABASE_URL ??
  process.env.DATABASE_URL ??
  roleUrl(bootstrapUrl, "helpdesk_app");

const client = new PrismaClient({ datasourceUrl: bootstrapUrl });
try {
  await ensurePrivilegeRoles(client, passwordOf(ownerUrl), passwordOf(appUrl));
  await assignDatabaseOwner(client);
  await preparePublicSchema(client);
} finally {
  await client.$disconnect();
}
