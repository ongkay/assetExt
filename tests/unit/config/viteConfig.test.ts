// @vitest-environment node

import { describe, expect, it } from "vitest";
import type { ConfigEnv, UserConfig, UserConfigExport } from "vite";

import viteConfig from "../../../vite.config";

const buildProtectionPluginName = "asset-manager-build-protection";
const buildOutputRenamePluginName = "asset-manager-build-output-rename";

const protectedBuildOutputFileNames = {
  assetFileNames: "assets/[hash][extname]",
  chunkFileNames: "assets/[hash].js",
  entryFileNames: "assets/[hash].js",
};

const resolvedViteConfig = resolveViteConfig(viteConfig);

describe("Vite dev server config", () => {
  it("allows Chrome extension origins for CRXJS dev loader requests", () => {
    const corsOrigin =
      resolvedViteConfig.server?.cors &&
      typeof resolvedViteConfig.server.cors === "object" &&
      "origin" in resolvedViteConfig.server.cors
        ? resolvedViteConfig.server.cors.origin
        : null;

    const allowedOrigins = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];

    expect(
      allowedOrigins.some(
        (origin) => origin instanceof RegExp && origin.test("chrome-extension://test-extension-id"),
      ),
    ).toBe(true);
  });

  it("uses a stable local HMR endpoint for extension pages", () => {
    expect(resolvedViteConfig.server?.host).toBe("127.0.0.1");
    expect(resolvedViteConfig.server?.port).toBe(5173);
    expect(resolvedViteConfig.server?.strictPort).toBe(true);
    expect(resolvedViteConfig.server?.hmr).toMatchObject({
      host: "127.0.0.1",
      port: 5173,
      protocol: "ws",
    });
  });

  it("builds the proxy blocked page as an extension entry", () => {
    const buildInput = resolvedViteConfig.build?.rollupOptions?.input as Record<string, string> | undefined;
    const buildOutput = resolvedViteConfig.build?.rollupOptions?.output;
    const buildPlugins = Array.isArray(resolvedViteConfig.plugins) ? resolvedViteConfig.plugins : [];

    expect(resolvedViteConfig.build?.outDir).toBe("dist/ext-1");
    expect(resolvedViteConfig.build?.minify).toBe("terser");
    expect(resolvedViteConfig.build?.sourcemap).toBe(false);
    expect(buildInput?.cookiesBlocked).toContain("cookies-blocked.html");
    expect(buildInput?.ext1Blocked).toContain("ext-1-blocked.html");
    expect(buildInput?.proxyBlocked).toContain("proxy-blocked.html");
    expect(buildOutput).toMatchObject(protectedBuildOutputFileNames);
    expect(
      buildPlugins.some((plugin) => hasPluginName(plugin) && plugin.name === buildProtectionPluginName),
    ).toBe(true);
    expect(
      buildPlugins.some((plugin) => hasPluginName(plugin) && plugin.name === buildOutputRenamePluginName),
    ).toBe(true);
  });
});

function hasPluginName(plugin: unknown): plugin is { name: string } {
  return typeof plugin === "object" && plugin !== null && "name" in plugin;
}

function resolveViteConfig(config: UserConfigExport): UserConfig {
  if (typeof config !== "function") {
    if (config instanceof Promise) {
      throw new Error("Async Vite config is not supported in this unit test.");
    }

    return config;
  }

  const configEnv = {
    command: "build",
    isPreview: false,
    isSsrBuild: false,
    mode: "production",
  } satisfies ConfigEnv;

  const resolvedConfig = config(configEnv);

  if (resolvedConfig instanceof Promise) {
    throw new Error("Async Vite config is not supported in this unit test.");
  }

  return resolvedConfig;
}
