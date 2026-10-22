/**
 * Ticket references (ARCHITECTURE §4, AC-FORM-15).
 * `HD-` plus 6 characters from the unambiguous alphabet.
 */

export const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export const REFERENCE_PATTERN = /^HD-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;

const ALPHABET_LENGTH = REFERENCE_ALPHABET.length;
const BYTE_LIMIT = 256 - (256 % ALPHABET_LENGTH);

function alphabetIndex(randomByte: () => number): number {
  for (;;) {
    const value = randomByte();
    if (value < BYTE_LIMIT) return value % ALPHABET_LENGTH;
  }
}

function cryptoByte(): number {
  const bytes = new Uint8Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] ?? 0;
}

/** Cryptographic RNG. Collision retry belongs to the unique index, not here. */
export function generateReference(
  randomByte: () => number = cryptoByte,
): string {
  let body = "";
  for (let i = 0; i < 6; i += 1) {
    body += REFERENCE_ALPHABET[alphabetIndex(randomByte)];
  }
  return `HD-${body}`;
}
