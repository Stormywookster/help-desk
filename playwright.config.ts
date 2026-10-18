import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:8380";

export default defineConfig({
  fullyParallel: true,
  forbidOnly: process.env.CI === "true",
  retries: process.env.CI === "true" ? 1 : 0,
  use: { baseURL },
  projects: [
    { name: "portal", testDir: "./e2e/portal" },
    { name: "console", testDir: "./e2e/console" },
  ],
});
