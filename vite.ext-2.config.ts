import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.ext-2.json";
import {
  createBuildProtectionPlugin,
  createProtectedBuildOptions,
  getProtectedEntryModuleIdsFromManifest,
} from "./scripts/buildProtection";
import { createBuildOutputRenamePlugin } from "./scripts/buildOutputRename";
import { extensionVersionEnvKey, resolveExtensionManifestVersion } from "./scripts/extensionManifestVersion";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const extensionManifest = {
    ...manifest,
    version: resolveExtensionManifestVersion(env[extensionVersionEnvKey], manifest.version),
  };
  const protectedEntryModuleIds = getProtectedEntryModuleIdsFromManifest(extensionManifest);

  return {
    plugins: [
      tailwindcss(),
      react(),
      crx({ manifest: extensionManifest }),
      createBuildOutputRenamePlugin(),
      createBuildProtectionPlugin({ protectedEntryModuleIds }),
    ],
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
    build: createProtectedBuildOptions({
      input: {
        peerGuardBlocked: resolve(__dirname, "ext-2-blocked.html"),
      },
      outDir: "dist/ext-2",
    }),
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  };
});
