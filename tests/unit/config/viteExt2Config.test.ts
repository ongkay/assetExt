// @vitest-environment node

import { describe, expect, it } from "vitest";

import viteExt2Config from "../../../vite.ext-2.config";

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

    expect(viteExt2Config.build?.outDir).toBe("dist/ext-2");
    expect(buildInput?.peerGuardBlocked).toContain("ext-2-blocked.html");
  });
});
