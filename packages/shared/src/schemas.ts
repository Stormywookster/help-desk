/**
 * Zod bodies for the request shapes ARCHITECTURE §6 writes down,
 * with field limits from §3.1, §6, §7, §9 and DESIGN.
 * Transition rules stay in the domain module (M1-T01).
 */

import { z } from "zod";

import { BRAND_COLOR_PATTERN } from "./branding.js";
import { isValidEmail, normalizeEmail } from "./email.js";
import { checkPassword, type PasswordFlow } from "./password.js";
import { REFERENCE_PATTERN } from "./reference.js";

export const FIELD_LIMITS = {
  customerName: 100,
  subject: 150,
  description: 10_000,
  customerReply: 10_000,
  reopenMessage: 10_000,
  cancelReason: 500,
  siteName: 60,
  pageSize: 100,
  idempotencyKeyMin: 16,
  idempotencyKeyMax: 64,
} as const;

/** Binary units (T21). */
export const ATTACHMENT_DEFAULT_MAX_BYTES = 10_485_760;
export const ATTACHMENT_DEFAULT_MAX_FILES = 5;
export const ATTACHMENT_HARD_MAX_BYTES = 26_214_400;
export const ATTACHMENT_ADMIN_MIN_BYTES = 1_048_576;
export const ATTACHMENT_ADMIN_MAX_FILES = 10;
export const PROXY_BODY_MAX_BYTES = 314_572_800;

export const IMPACT_OPTIONS = [
  "Just a question",
  "Something isn't working",
  "I can't use the product at all",
] as const;

/** English names staff see (AC-PRI-01). Wire values are the §5 enum. */
export const PRIORITY_LABELS = ["Low", "Normal", "High", "Urgent"] as const;

const PRIORITY_VALUES = ["low", "normal", "high", "urgent"] as const;

const TICKET_STATUS_VALUES = [
  "new",
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
  "cancelled",
] as const;

const STAFF_ROLES = ["administrator", "agent"] as const;

const CLIENT_TYPES = ["web", "desktop", "android"] as const;

export const emailSchema = z
  .string()
  .transform(normalizeEmail)
  .refine(isValidEmail);

export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9-]{16,64}$/);

export const secureLinkTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const referenceSchema = z.string().regex(REFERENCE_PATTERN);

export const prioritySchema = z.enum(PRIORITY_VALUES);

export const impactSchema = z.enum(IMPACT_OPTIONS);

function newPassword(flow: PasswordFlow) {
  return z.string().superRefine((value, ctx) => {
    const decision = checkPassword(value, flow);
    if (!decision.ok) {
      ctx.addIssue({
        code: "custom",
        message: decision.message ?? decision.code,
      });
    }
  });
}

const expectedVersionSchema = z.int().nonnegative();

export function publicTicketFieldsSchema(options: {
  privacyNoticeEnabled: boolean;
}) {
  return z.object({
    customerName: z.string().max(FIELD_LIMITS.customerName).optional(),
    email: emailSchema,
    productId: z.uuidv7(),
    subject: z.string().min(1).max(FIELD_LIMITS.subject),
    description: z.string().min(1).max(FIELD_LIMITS.description),
    impact: impactSchema.optional(),
    captcha: z.string().min(1),
    privacyAck: options.privacyNoticeEnabled
      ? z.literal(true)
      : z.boolean().optional(),
  });
}

export const publicLookupBodySchema = z.object({
  reference: z.string().trim().min(1),
  email: emailSchema,
  captcha: z.string().min(1),
});

export const publicAccessBodySchema = z.object({
  token: secureLinkTokenSchema,
});

export const publicResendBodySchema = z.object({
  token: secureLinkTokenSchema,
});

export const customerMessageBodySchema = z.object({
  body: z.string().min(1).max(FIELD_LIMITS.customerReply),
});

export const customerCancelBodySchema = z.object({
  reason: z.string().max(FIELD_LIMITS.cancelReason).optional(),
});

export const customerReopenBodySchema = z.object({
  message: z.string().max(FIELD_LIMITS.reopenMessage).optional(),
});

export const setupAdminBodySchema = z.object({
  setupCode: z.string().min(1),
  name: z.string().min(1),
  email: emailSchema,
  password: newPassword("setup"),
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  clientType: z.enum(CLIENT_TYPES),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: newPassword("change_own"),
});

export const patchTicketBodySchema = z.object({
  expectedVersion: expectedVersionSchema,
  status: z.enum(TICKET_STATUS_VALUES).optional(),
  priority: prioritySchema.optional(),
});

export const correctCustomerEmailBodySchema = z.object({
  email: emailSchema,
  expectedVersion: expectedVersionSchema,
});

export const assignTicketBodySchema = z.object({
  userId: z.uuidv7().nullable(),
  expectedVersion: expectedVersionSchema,
});

export const staffMessageBodySchema = z.object({
  body: z.string().min(1),
  visibility: z.enum(["public", "internal"]),
  setStatus: z.enum(["waiting_on_customer", "resolved"]).optional(),
  expectedVersion: expectedVersionSchema,
});

export const hardDeleteBodySchema = z.object({
  confirmReference: referenceSchema,
});

export const createUserBodySchema = z.object({
  name: z.string().min(1),
  email: emailSchema,
  role: z.enum(STAFF_ROLES),
  password: newPassword("admin_add"),
});

/** §6.3: an `email` field is rejected. Unknown keys fail the same way. */
export const updateUserBodySchema = z.strictObject({
  name: z.string().min(1).optional(),
  role: z.enum(STAFF_ROLES).optional(),
  active: z.boolean().optional(),
});

export const resetPasswordBodySchema = z.object({
  password: newPassword("admin_reset"),
});

export const productBodySchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const updateProductBodySchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const siteNameSchema = z.string().min(1).max(FIELD_LIMITS.siteName);

export const brandColorSchema = z.string().regex(BRAND_COLOR_PATTERN);

export const reopenWindowDaysSchema = z.int().min(1).max(14);

export const attachmentSettingsSchema = z.object({
  attachmentMaxBytes: z
    .int()
    .min(ATTACHMENT_ADMIN_MIN_BYTES)
    .max(ATTACHMENT_HARD_MAX_BYTES),
  attachmentMaxFiles: z.int().min(1).max(ATTACHMENT_ADMIN_MAX_FILES),
});

export const senderBodySchema = z.object({
  name: z.string().min(1),
  address: emailSchema,
});

export const privacyExportBodySchema = z.object({
  email: emailSchema,
});

export const privacyEraseBodySchema = z
  .object({
    email: emailSchema,
    confirmEmail: emailSchema,
  })
  .refine((value) => value.email === value.confirmEmail);

export const pageQuerySchema = z.object({
  page: z.int().min(1).default(1),
  pageSize: z.int().min(1).max(FIELD_LIMITS.pageSize).default(25),
});

export type UploadLimitKind = "file_size" | "file_count" | "request_size";

export type UploadLimit = {
  kind: UploadLimitKind;
  file?: string;
  maxBytes: number;
  maxFiles: number;
};

/** T7: the whole request is over a limit. Nothing is saved. */
export function uploadLimit(input: {
  files: readonly { name: string; sizeBytes: number }[];
  maxBytes?: number;
  maxFiles?: number;
  requestBytes?: number;
  requestMaxBytes?: number;
}): UploadLimit | null {
  const maxBytes = input.maxBytes ?? ATTACHMENT_DEFAULT_MAX_BYTES;
  const maxFiles = input.maxFiles ?? ATTACHMENT_DEFAULT_MAX_FILES;
  const requestMax = input.requestMaxBytes ?? PROXY_BODY_MAX_BYTES;
  if (input.requestBytes !== undefined && input.requestBytes > requestMax) {
    return { kind: "request_size", maxBytes, maxFiles };
  }
  if (input.files.length > maxFiles) {
    return { kind: "file_count", maxBytes, maxFiles };
  }
  for (const file of input.files) {
    if (file.sizeBytes > maxBytes) {
      return { kind: "file_size", file: file.name, maxBytes, maxFiles };
    }
  }
  return null;
}
