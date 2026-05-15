// @vitest-environment node

import { describe, expect, it } from "vitest";

import viteConfig from "../../../vite.config";

describe("Vite dev server config", () => {
  it("allows Chrome extension origins for CRXJS dev loader requests", () => {
    const corsOrigin =
      viteConfig.server?.cors &&
      typeof viteConfig.server.cors === "object" &&
      "origin" in viteConfig.server.cors
        ? viteConfig.server.cors.origin
        : null;

    const allowedOrigins = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];

    expect(
      allowedOrigins.some(
        (origin) => origin instanceof RegExp && origin.test("chrome-extension://test-extension-id"),
      ),
    ).toBe(true);
  });

  it("uses a stable local HMR endpoint for extension pages", () => {
    expect(viteConfig.server?.host).toBe("127.0.0.1");
    expect(viteConfig.server?.port).toBe(5173);
    expect(viteConfig.server?.strictPort).toBe(true);
    expect(viteConfig.server?.hmr).toMatchObject({
      host: "127.0.0.1",
      port: 5173,
      protocol: "ws",
    });
  });

  it("builds the proxy blocked page as an extension entry", () => {
    const buildInput = viteConfig.build?.rollupOptions?.input as Record<string, string> | undefined;

    expect(viteConfig.build?.outDir).toBe("dist/ext-1");
    expect(buildInput?.ext1Blocked).toContain("ext-1-blocked.html");
    expect(buildInput?.proxyBlocked).toContain("proxy-blocked.html");
  });
});
