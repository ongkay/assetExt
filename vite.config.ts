import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifest from "./manifest.json";
import {
  createBuildProtectionPlugin,
  createProtectedBuildOptions,
  getProtectedEntryModuleIdsFromManifest,
} from "./scripts/buildProtection";
import { createBuildOutputRenamePlugin } from "./scripts/buildOutputRename";

const protectedEntryModuleIds = getProtectedEntryModuleIdsFromManifest(manifest);

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    crx({ manifest }),
    createBuildOutputRenamePlugin(),
    createBuildProtectionPlugin({ protectedEntryModuleIds }),
  ],
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
  build: createProtectedBuildOptions({
    input: {
      popup: resolve(__dirname, "popup.html"),
      options: resolve(__dirname, "options.html"),
      ext1Blocked: resolve(__dirname, "ext-1-blocked.html"),
      proxyBlocked: resolve(__dirname, "proxy-blocked.html"),
    },
    outDir: "dist/ext-1",
  }),
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
