// @vitest-environment node

import { describe, expect, it } from "vitest";

import viteExt2Config from "../../../vite.ext-2.config";

const buildProtectionPluginName = "asset-manager-build-protection";
const buildOutputRenamePluginName = "asset-manager-build-output-rename";

const protectedBuildOutputFileNames = {
  assetFileNames: "assets/[hash][extname]",
  chunkFileNames: "assets/[hash].js",
  entryFileNames: "assets/[hash].js",
};

describe("ext-2 Vite config", () => {
  it("uses a dedicated local HMR endpoint for the watchdog extension", () => {
    expect(viteExt2Config.server?.host).toBe("127.0.0.1");
    expect(viteExt2Config.server?.port).toBe(5174);
    expect(viteExt2Config.server?.strictPort).toBe(true);
    expect(viteExt2Config.server?.hmr).toMatchObject({
      host: "127.0.0.1",
      port: 5174,
      protocol: "ws",
    });
  });

  it("builds the ext-2 warning page into its own output directory", () => {
    const buildInput = viteExt2Config.build?.rollupOptions?.input as Record<string, string> | undefined;
    const buildOutput = viteExt2Config.build?.rollupOptions?.output;
    const buildPlugins = Array.isArray(viteExt2Config.plugins) ? viteExt2Config.plugins : [];

    expect(viteExt2Config.build?.outDir).toBe("dist/ext-2");
    expect(viteExt2Config.build?.minify).toBe("terser");
    expect(viteExt2Config.build?.sourcemap).toBe(false);
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
