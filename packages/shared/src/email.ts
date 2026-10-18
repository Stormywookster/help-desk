/**
 * Emails are stored lower-cased (ARCHITECTURE §5, citext).
 * Matching is case-insensitive and trimmed (ARCHITECTURE §8).
 * The shape is the one DESIGN illustrates (`name@example.com`); `name@` is not valid.
 */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_SHAPE.test(normalizeEmail(value));
}
