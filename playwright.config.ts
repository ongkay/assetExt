import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/integration",
  use: {
    ...devices["Desktop Chrome"],
  },
});
