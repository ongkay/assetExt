import { beforeEach, describe, expect, it, vi } from "vitest";

describe("asset proxy state storage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("serializes concurrent platform proxy updates without losing sibling state", async () => {
    const assetProxyState = await import("@/lib/storage/assetProxyState");

    await Promise.all([
      assetProxyState.updateAssetProxyState((state) => ({
        ...state,
        platforms: {
          ...state.platforms,
          tradingview: {
            proxy: {
              credentials: null,
              host: "1.2.3.4",
              port: 8080,
              scheme: "http",
            },
            updatedAt: "2026-05-08T10:00:00.000Z",
          },
        },
      })),
      assetProxyState.updateAssetProxyState((state) => ({
        ...state,
        platforms: {
          ...state.platforms,
          fxtester: {
            proxy: {
              credentials: {
                password: "secret",
                username: "proxy-user",
              },
              host: "5.6.7.8",
              port: 1080,
              scheme: "socks5",
            },
            updatedAt: "2026-05-08T11:00:00.000Z",
          },
        },
      })),
    ]);

    await expect(assetProxyState.readAssetProxyState()).resolves.toMatchObject({
      platforms: {
        fxtester: {
          proxy: {
            host: "5.6.7.8",
            scheme: "socks5",
          },
        },
        tradingview: {
          proxy: {
            host: "1.2.3.4",
            scheme: "http",
          },
        },
      },
    });
  });
});
