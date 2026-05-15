import { resolve } from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.ext-2.json";

export default defineConfig({
  plugins: [tailwindcss(), react(), crx({ manifest })],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    cors: {
      origin: [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, /^chrome-extension:\/\/.*$/],
    },
    hmr: {
      host: "127.0.0.1",
      port: 5174,
      protocol: "ws",
    },
  },
  build: {
    outDir: "dist/ext-2",
    rollupOptions: {
      input: {
        peerGuardBlocked: resolve(__dirname, "ext-2-blocked.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
