/**
 * In-process clock for tests and factories (M1-T03).
 * The HTTP test clock is a later task (ARCHITECTURE §10).
 */

let current: Date | null = null;

export const testClock = {
  now(): Date {
    return current ?? new Date();
  },
  set(instant: Date): void {
    current = instant;
  },
  reset(): void {
    current = null;
  },
};
