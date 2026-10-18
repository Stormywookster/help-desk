/**
 * Staff password policy (ARCHITECTURE §7, G25).
 * Offline check against a bundled common/breached list. No third-party calls.
 * The docs require the list and do not name a corpus, so this is a small set
 * of well-known common passwords, including entries of 15 or more characters.
 */

export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_FLOWS = [
  "setup",
  "change_own",
  "admin_add",
  "admin_reset",
] as const;

export type PasswordFlow = (typeof PASSWORD_FLOWS)[number];

export type PasswordDecision =
  | { ok: true }
  | { ok: false; code: "TOO_SHORT"; message: string }
  | { ok: false; code: "TOO_LONG"; message: string | undefined }
  | { ok: false; code: "BREACHED"; message: string };

const BREACHED_PASSWORDS = [
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "letmein",
  "admin",
  "welcome",
  "iloveyou",
  "monkey",
  "dragon",
  "master",
  "login",
  "princess",
  "football",
  "shadow",
  "sunshine",
  "trustno1",
  "password1",
  "123456789012345",
  "passwordpassword",
  "qwertyuiopasdfg",
  "letmeinletmein1",
  "iloveyouiloveyou",
  "aaaaaaaaaaaaaaa",
  "000000000000000",
] as const;

const BREACHED = new Set<string>(BREACHED_PASSWORDS);

export function passwordPolicy(): {
  minLength: number;
  maxLength: number;
} {
  return {
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  };
}

export function passwordHelper(flow: PasswordFlow): string {
  const min = String(PASSWORD_MIN_LENGTH);
  if (flow === "admin_add") {
    return `At least ${min} characters. Share it with them privately. They'll choose their own password when they first sign in.`;
  }
  if (flow === "admin_reset") {
    return `At least ${min} characters. Share it with them privately. They'll choose their own password when they next sign in.`;
  }
  return `At least ${min} characters.`;
}

function tooShortMessage(flow: PasswordFlow): string {
  const min = String(PASSWORD_MIN_LENGTH);
  if (flow === "admin_add" || flow === "admin_reset") {
    return `The password needs at least ${min} characters.`;
  }
  return `Your password needs at least ${min} characters.`;
}

/** DESIGN states this sentence for setup (W-02) and change-own-password (W-04). */
function tooLongMessage(flow: PasswordFlow): string | undefined {
  if (flow === "setup" || flow === "change_own") {
    return `Passwords can be at most ${String(PASSWORD_MAX_LENGTH)} characters.`;
  }
  return undefined;
}

function breachedMessage(flow: PasswordFlow): string {
  if (flow === "admin_add" || flow === "admin_reset") {
    return "That password is too common or has appeared in a data breach. Use Generate, or choose a different one.";
  }
  return "That password is too common or has appeared in a data breach. Choose a different one.";
}

/** Exact list membership. Length is UTF-16 code units, which matches the ASCII boundaries. */
export function checkPassword(
  password: string,
  flow: PasswordFlow,
): PasswordDecision {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, code: "TOO_SHORT", message: tooShortMessage(flow) };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, code: "TOO_LONG", message: tooLongMessage(flow) };
  }
  if (BREACHED.has(password)) {
    return { ok: false, code: "BREACHED", message: breachedMessage(flow) };
  }
  return { ok: true };
}
