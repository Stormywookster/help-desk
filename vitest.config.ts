import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: [
            "test/**/*.test.ts",
            "packages/**/*.test.ts",
            "apps/**/src/**/*.test.ts",
          ],
          exclude: ["**/*.integration.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          include: ["**/*.integration.test.ts", "apps/**/test/**/*.test.ts"],
        },
      },
    ],
  },
});
