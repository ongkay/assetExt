import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    exclude: [".worktrees/**", "dist/**", "node_modules/**", "tests/integration/**"],
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
