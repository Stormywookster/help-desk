import assert from "node:assert/strict";
import { afterEach, describe, it } from "vitest";

import { testClock } from "./clock.js";

describe("test clock", () => {
  afterEach(() => {
    testClock.reset();
  });

  it("returns the instant a test sets", () => {
    const instant = new Date("2026-04-01T12:00:00.000Z");
    testClock.set(instant);
    assert.equal(testClock.now().toISOString(), "2026-04-01T12:00:00.000Z");
  });

  it("returns to the wall clock after reset", () => {
    testClock.set(new Date("2026-04-01T12:00:00.000Z"));
    testClock.reset();
    const delta = Math.abs(testClock.now().getTime() - Date.now());
    assert.ok(delta < 5_000);
  });
});
