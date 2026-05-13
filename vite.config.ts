import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [tailwindcss(), react(), crx({ manifest })],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    cors: {
      origin: [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, /^chrome-extension:\/\/.*$/],
    },
    hmr: {
      host: "127.0.0.1",
      port: 5173,
      protocol: "ws",
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
        proxyBlocked: resolve(__dirname, "proxy-blocked.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
