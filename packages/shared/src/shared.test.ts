import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "vitest";

import { COMMON_PASSWORDS } from "./data/common-passwords.js";
import {
  BRANDING_ENV_KEYS,
  BRANDING_SETTING_KEYS,
  COPY_SCREEN_IDS,
  IMPACT_OPTIONS,
  PORTAL_URL_ENV_KEY,
  PRIORITY_LABELS,
  REFERENCE_ALPHABET,
  REFERENCE_PATTERN,
  changePasswordBodySchema,
  checkPassword,
  copyCatalog,
  createUserBodySchema,
  customerMessageBodySchema,
  formatEventTimeEt,
  generateReference,
  normalizeEmail,
  passwordHelper,
  passwordPolicy,
  prioritySchema,
  publicTicketFieldsSchema,
  resetPasswordBodySchema,
  setupAdminBodySchema,
  uploadLimit,
} from "./index.js";

const PRODUCT_ID = "01932e4a-7b2e-7c3d-8e4f-123456789abc";

const FLOWS = ["setup", "change_own", "admin_add", "admin_reset"] as const;

function ticket(overrides: Record<string, unknown> = {}) {
  return {
    email: "Person@Example.com",
    productId: PRODUCT_ID,
    subject: "Export closes the app",
    description: "When I click Export, the app closes.",
    captcha: "solved",
    ...overrides,
  };
}

function issueMessage(result: {
  success: boolean;
  error?: { issues: readonly { message: string }[] };
}): string {
  assert.equal(result.success, false);
  const message = result.error?.issues[0]?.message;
  assert.equal(typeof message, "string");
  return message ?? "";
}

function successor(reference: string): string | undefined {
  const body = reference.slice(3).split("");
  for (let i = body.length - 1; i >= 0; i -= 1) {
    const index = REFERENCE_ALPHABET.indexOf(body[i] ?? "");
    if (index < 0) return undefined;
    if (index < REFERENCE_ALPHABET.length - 1) {
      body[i] = REFERENCE_ALPHABET[index + 1] ?? "";
      return `HD-${body.join("")}`;
    }
    body[i] = REFERENCE_ALPHABET[0] ?? "";
  }
  return undefined;
}

describe("shared schemas", () => {
  it("[AC-FORM-14] ten generated references are unique and not sequential", () => {
    const ids = Array.from({ length: 10 }, () => generateReference());
    assert.equal(new Set(ids).size, ids.length);
    for (let i = 1; i < ids.length; i += 1) {
      assert.notEqual(ids[i], successor(ids[i - 1] ?? ""));
    }
  });

  it("[AC-FORM-15] generated references match the unambiguous alphabet", () => {
    assert.equal(REFERENCE_ALPHABET.includes("0"), false);
    assert.equal(REFERENCE_ALPHABET.includes("O"), false);
    assert.equal(REFERENCE_ALPHABET.includes("1"), false);
    assert.equal(REFERENCE_ALPHABET.includes("I"), false);
    assert.equal(REFERENCE_ALPHABET.includes("L"), false);
    assert.equal(REFERENCE_ALPHABET.includes("U"), false);
    for (let i = 0; i < 10_000; i += 1) {
      const id = generateReference();
      assert.match(id, REFERENCE_PATTERN);
    }
  });

  it("[AC-ROLE-18] a 14-character password is rejected and a 15-character password off the breached list is accepted", () => {
    const helpers = {
      setup: "At least 15 characters.",
      change_own: "At least 15 characters.",
      admin_add:
        "At least 15 characters. Share it with them privately. They'll choose their own password when they first sign in.",
      admin_reset:
        "At least 15 characters. Share it with them privately. They'll choose their own password when they next sign in.",
    } as const;
    const errors = {
      setup: "Your password needs at least 15 characters.",
      change_own: "Your password needs at least 15 characters.",
      admin_add: "The password needs at least 15 characters.",
      admin_reset: "The password needs at least 15 characters.",
    } as const;
    const accepted = "correct horse x";
    assert.equal(accepted.length, 15);
    for (const flow of FLOWS) {
      assert.equal(passwordHelper(flow), helpers[flow]);
      const rejected = checkPassword("a".repeat(14), flow);
      assert.equal(rejected.ok, false);
      if (!rejected.ok) {
        assert.equal(rejected.code, "TOO_SHORT");
        assert.equal(rejected.message, errors[flow]);
      }
      assert.deepEqual(checkPassword(accepted, flow), { ok: true });
    }
  });

  it("[AC-ROLE-19] a 129-character password is rejected and a 128-character password is accepted", () => {
    const tooLong = "Passwords can be at most 128 characters.";
    for (const flow of FLOWS) {
      const rejected = checkPassword("b".repeat(129), flow);
      assert.equal(rejected.ok, false);
      if (!rejected.ok) {
        assert.equal(rejected.code, "TOO_LONG");
        assert.equal(rejected.message, tooLong);
      }
      assert.deepEqual(checkPassword("b".repeat(128), flow), { ok: true });
    }
  });

  it("passwordPolicy returns a minimum of 15 and a maximum of 128", () => {
    assert.deepEqual(passwordPolicy(), { minLength: 15, maxLength: 128 });
  });

  it("the bundled common-password list is 15 to 128 characters and rejects a listed entry", () => {
    assert.equal(COMMON_PASSWORDS.length >= 100, true);
    const listed = new Set<string>(COMMON_PASSWORDS);
    for (const entry of COMMON_PASSWORDS) {
      assert.equal(entry.length >= 15 && entry.length <= 128, true);
    }
    const sample = COMMON_PASSWORDS[0];
    assert.equal(typeof sample, "string");
    for (const flow of FLOWS) {
      const rejected = checkPassword(sample ?? "", flow);
      assert.equal(rejected.ok, false);
      if (!rejected.ok) assert.equal(rejected.code, "BREACHED");
    }
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let fresh = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const bytes = randomBytes(20);
      fresh = Array.from(
        bytes,
        (byte) => alphabet[byte % alphabet.length],
      ).join("");
      if (!listed.has(fresh)) break;
    }
    assert.equal(fresh.length, 20);
    assert.equal(listed.has(fresh), false);
    for (const flow of FLOWS) {
      assert.deepEqual(checkPassword(fresh, flow), { ok: true });
    }
  });

  it("body schemas pass the password flow for setup, change-own, add-user, and reset", () => {
    const short = "a".repeat(14);
    const tooLong = "c".repeat(129);
    const maxMessage = "Passwords can be at most 128 characters.";
    const setup = setupAdminBodySchema.safeParse({
      setupCode: "code",
      name: "Ada",
      email: "ada@example.com",
      password: short,
    });
    const change = changePasswordBodySchema.safeParse({
      currentPassword: "current-password",
      newPassword: short,
    });
    const added = createUserBodySchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      role: "agent",
      password: short,
    });
    const reset = resetPasswordBodySchema.safeParse({ password: short });
    assert.equal(
      issueMessage(setup),
      "Your password needs at least 15 characters.",
    );
    assert.equal(
      issueMessage(change),
      "Your password needs at least 15 characters.",
    );
    assert.equal(
      issueMessage(added),
      "The password needs at least 15 characters.",
    );
    assert.equal(
      issueMessage(reset),
      "The password needs at least 15 characters.",
    );
    assert.equal(
      issueMessage(
        createUserBodySchema.safeParse({
          name: "Ada",
          email: "ada@example.com",
          role: "agent",
          password: tooLong,
        }),
      ),
      maxMessage,
    );
    assert.equal(
      issueMessage(resetPasswordBodySchema.safeParse({ password: tooLong })),
      maxMessage,
    );
  });

  it("[AC-ROLE-20] a password of 15 or more characters on the bundled breached list is rejected", () => {
    const leaked = "passwordpassword";
    assert.equal(leaked.length >= 15, true);
    const staff =
      "That password is too common or has appeared in a data breach. Choose a different one.";
    const admin =
      "That password is too common or has appeared in a data breach. Use Generate, or choose a different one.";
    for (const flow of FLOWS) {
      const rejected = checkPassword(leaked, flow);
      assert.equal(rejected.ok, false);
      if (!rejected.ok) {
        assert.equal(rejected.code, "BREACHED");
        assert.equal(
          rejected.message,
          flow === "admin_add" || flow === "admin_reset" ? admin : staff,
        );
      }
    }
  });

  it("[AC-GEN-02] event times are shown in Eastern Time", () => {
    assert.equal(
      formatEventTimeEt(new Date("2026-10-06T14:57:00Z")),
      "Oct 6, 2026, 10:57 AM ET",
    );
    assert.equal(
      formatEventTimeEt(new Date("2026-12-01T15:00:00Z")),
      "Dec 1, 2026, 10:00 AM ET",
    );
  });

  it("[AC-PRI-01] priority options are exactly Low, Normal, High, Urgent", () => {
    assert.deepEqual(PRIORITY_LABELS, ["Low", "Normal", "High", "Urgent"]);
    for (const value of ["low", "normal", "high", "urgent"]) {
      assert.equal(prioritySchema.safeParse(value).success, true);
    }
    assert.equal(prioritySchema.safeParse("Medium").success, false);
    assert.equal(prioritySchema.safeParse("Low").success, false);
  });

  it("accepts a name of 100 characters and rejects 101", () => {
    const schema = publicTicketFieldsSchema({ privacyNoticeEnabled: false });
    assert.equal(
      schema.safeParse(ticket({ customerName: "n".repeat(100) })).success,
      true,
    );
    assert.equal(
      schema.safeParse(ticket({ customerName: "n".repeat(101) })).success,
      false,
    );
  });

  it("accepts a subject of 150 characters and rejects 151", () => {
    const schema = publicTicketFieldsSchema({ privacyNoticeEnabled: false });
    assert.equal(
      schema.safeParse(ticket({ subject: "s".repeat(150) })).success,
      true,
    );
    assert.equal(
      schema.safeParse(ticket({ subject: "s".repeat(151) })).success,
      false,
    );
  });

  it("accepts a description of 10000 characters and rejects 10001", () => {
    const schema = publicTicketFieldsSchema({ privacyNoticeEnabled: false });
    assert.equal(
      schema.safeParse(ticket({ description: "d".repeat(10_000) })).success,
      true,
    );
    assert.equal(
      schema.safeParse(ticket({ description: "d".repeat(10_001) })).success,
      false,
    );
  });

  it("stores emails lower-cased and trimmed", () => {
    assert.equal(
      normalizeEmail("  Person@Example.com  "),
      "person@example.com",
    );
    const parsed = publicTicketFieldsSchema({
      privacyNoticeEnabled: false,
    }).safeParse(ticket());
    assert.equal(parsed.success, true);
    if (parsed.success) assert.equal(parsed.data.email, "person@example.com");
  });

  it("lists the three impact options and rejects any other", () => {
    const schema = publicTicketFieldsSchema({ privacyNoticeEnabled: false });
    for (const impact of IMPACT_OPTIONS) {
      assert.equal(schema.safeParse(ticket({ impact })).success, true);
    }
    assert.equal(schema.safeParse(ticket({ impact: "Urgent" })).success, false);
  });

  it("accepts a customer reply of 10000 characters and rejects 10001", () => {
    assert.equal(
      customerMessageBodySchema.safeParse({ body: "r".repeat(10_000) }).success,
      true,
    );
    assert.equal(
      customerMessageBodySchema.safeParse({ body: "r".repeat(10_001) }).success,
      false,
    );
  });

  it("rejects a file over 10 MB, a sixth file, and a body over 300 MB", () => {
    assert.equal(
      uploadLimit({
        files: [{ name: "ok.txt", sizeBytes: 10_485_760 }],
      }),
      null,
    );
    assert.equal(
      uploadLimit({
        files: [{ name: "big.txt", sizeBytes: 10_485_761 }],
      })?.kind,
      "file_size",
    );
    assert.equal(
      uploadLimit({
        files: Array.from({ length: 6 }, () => ({
          name: "a.txt",
          sizeBytes: 1,
        })),
      })?.kind,
      "file_count",
    );
    assert.equal(
      uploadLimit({
        files: [],
        requestBytes: 314_572_801,
      })?.kind,
      "request_size",
    );
  });

  it("exports branding variable names and an empty copy catalog", () => {
    assert.deepEqual(BRANDING_SETTING_KEYS, [
      "site_name",
      "company_name",
      "brand_primary_color",
      "portal_footer_text",
      "email_from_name",
      "support_email_display",
    ]);
    assert.deepEqual(BRANDING_ENV_KEYS, [
      "BRAND_SITE_NAME",
      "BRAND_COMPANY_NAME",
      "BRAND_PRIMARY_COLOR",
    ]);
    assert.equal(PORTAL_URL_ENV_KEY, "HD_PUBLIC_URL");
    assert.equal(COPY_SCREEN_IDS.length > 0, true);
    for (const id of COPY_SCREEN_IDS) assert.equal(copyCatalog[id], "");
  });
});
