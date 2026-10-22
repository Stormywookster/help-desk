/**
 * Staff password policy (ARCHITECTURE §7, G25, TM-4).
 * Offline check against the bundled common-password list. No third-party calls.
 * The list, its source, and its license live in ./data/.
 */

import { COMMON_PASSWORDS } from "./data/common-passwords.js";

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
  | { ok: false; code: "TOO_LONG"; message: string }
  | { ok: false; code: "BREACHED"; message: string };

const BREACHED = new Set<string>(
  COMMON_PASSWORDS.map((entry) => entry.toLowerCase()),
);

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

/**
 * DESIGN states this sentence for setup (W-02) and change-own (W-04).
 * The Project Lead maps the same sentence onto Admin add-user and Admin
 * reset-password, so the TOO_LONG code is not the text a screen shows.
 */
function tooLongMessage(flow: PasswordFlow): string {
  switch (flow) {
    case "setup":
    case "change_own":
    case "admin_add":
    case "admin_reset":
      return `Passwords can be at most ${String(PASSWORD_MAX_LENGTH)} characters.`;
    default: {
      const neverFlow: never = flow;
      return neverFlow;
    }
  }
}

function breachedMessage(flow: PasswordFlow): string {
  if (flow === "admin_add" || flow === "admin_reset") {
    return "That password is too common or has appeared in a data breach. Use Generate, or choose a different one.";
  }
  return "That password is too common or has appeared in a data breach. Choose a different one.";
}

/**
 * List membership is case-insensitive: both the password and the bundled
 * entries are lowercased. Length is UTF-16 code units, which matches the
 * ASCII boundaries.
 */
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
  if (BREACHED.has(password.toLowerCase())) {
    return { ok: false, code: "BREACHED", message: breachedMessage(flow) };
  }
  return { ok: true };
}
