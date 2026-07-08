// @vitest-environment node

import { describe, expect, it } from "vitest";
import type { ConfigEnv, UserConfig, UserConfigExport } from "vite";

import viteExt2Config from "../../../vite.ext-2.config";

const buildProtectionPluginName = "asset-manager-build-protection";
const buildOutputRenamePluginName = "asset-manager-build-output-rename";

const protectedBuildOutputFileNames = {
  assetFileNames: "assets/[hash][extname]",
  chunkFileNames: "assets/[hash].js",
  entryFileNames: "assets/[hash].js",
};

const resolvedViteExt2Config = resolveViteConfig(viteExt2Config);

describe("ext-2 Vite config", () => {
  it("uses a dedicated local HMR endpoint for the watchdog extension", () => {
    expect(resolvedViteExt2Config.server?.host).toBe("127.0.0.1");
    expect(resolvedViteExt2Config.server?.port).toBe(5174);
    expect(resolvedViteExt2Config.server?.strictPort).toBe(true);
    expect(resolvedViteExt2Config.server?.hmr).toMatchObject({
      host: "127.0.0.1",
      port: 5174,
      protocol: "ws",
    });
  });

  it("builds the ext-2 warning page into its own output directory", () => {
    const buildInput = resolvedViteExt2Config.build?.rollupOptions?.input as
      | Record<string, string>
      | undefined;
    const buildOutput = resolvedViteExt2Config.build?.rollupOptions?.output;
    const buildPlugins = Array.isArray(resolvedViteExt2Config.plugins) ? resolvedViteExt2Config.plugins : [];

    expect(resolvedViteExt2Config.build?.outDir).toBe("dist/ext-2");
    expect(resolvedViteExt2Config.build?.minify).toBe("terser");
    expect(resolvedViteExt2Config.build?.sourcemap).toBe(false);
    expect(buildInput?.peerGuardBlocked).toContain("ext-2-blocked.html");
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
