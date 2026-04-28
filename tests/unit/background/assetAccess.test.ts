import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExtensionAssetReadyResponse } from "@/lib/api/extensionApiTypes";

const readyAssetResponse: ExtensionAssetReadyResponse = {
  cookies: [
    {
      domain: ".tradingview.com",
      name: "sessionid",
      value: "abc",
    },
  ],
  mode: "private",
  platform: "tradingview",
  status: "ready",
};

describe("background asset access", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("starts heartbeat with the navigated tab id after popup asset access", async () => {
    const testRuntime = await importAssetAccessTestRuntime({ openedTabId: 456 });

    await expect(
      testRuntime.assetAccess.runAssetAccess({
        platform: "tradingview",
        shouldNavigate: true,
      }),
    ).resolves.toEqual(readyAssetResponse);

    expect(testRuntime.openOrReloadTab).toHaveBeenCalledWith(
      "https://www.tradingview.com/chart/",
      undefined,
    );
    expect(testRuntime.markPopupNavigationAutoAccessSkip).toHaveBeenCalledWith("tradingview");
    expect(testRuntime.startHeartbeat).toHaveBeenCalledWith(456, "tradingview");
  });

  it("uses automatic private mode from bootstrap data when no mode is provided", async () => {
    const testRuntime = await importAssetAccessTestRuntime({ openedTabId: 456 });

    await expect(
      testRuntime.assetAccess.runAssetAccess({
        platform: "tradingview",
        shouldNavigate: true,
      }),
    ).resolves.toEqual(readyAssetResponse);

    expect(testRuntime.fetchExtensionAsset).toHaveBeenCalledWith(
      { baseUrl: "http://localhost:3000" },
      "tradingview",
      "private",
    );
  });

  it("uses automatic share mode from bootstrap data when private access is unavailable", async () => {
    const testRuntime = await importAssetAccessTestRuntime({
      assets: [
        {
          hasPrivateAccess: false,
          hasShareAccess: true,
          platform: "tradingview",
        },
      ],
      openedTabId: 456,
    });

    await expect(
      testRuntime.assetAccess.runAssetAccess({
        platform: "tradingview",
        shouldNavigate: true,
      }),
    ).resolves.toEqual(readyAssetResponse);

    expect(testRuntime.fetchExtensionAsset).toHaveBeenCalledWith(
      { baseUrl: "http://localhost:3000" },
      "tradingview",
      "share",
    );
  });

  it("resolves backend selection responses automatically without returning a chooser state", async () => {
    const selectionResponse = {
      availableModes: ["private", "share"] as const,
      defaultMode: "share" as const,
      platform: "tradingview" as const,
      selectionTimeoutSeconds: 5,
      status: "selection_required" as const,
    };
    const testRuntime = await importAssetAccessTestRuntime({
      assets: [],
      assetResponses: [selectionResponse, readyAssetResponse],
      openedTabId: 456,
    });

    await expect(
      testRuntime.assetAccess.runAssetAccess({
        platform: "tradingview",
        shouldNavigate: true,
      }),
    ).resolves.toEqual(readyAssetResponse);

    expect(testRuntime.fetchExtensionAsset).toHaveBeenNthCalledWith(
      1,
      { baseUrl: "http://localhost:3000" },
      "tradingview",
      undefined,
    );
    expect(testRuntime.fetchExtensionAsset).toHaveBeenNthCalledWith(
      2,
      { baseUrl: "http://localhost:3000" },
      "tradingview",
      "private",
    );
  });

  it("starts heartbeat with the content tab id for auto access without navigation", async () => {
    const testRuntime = await importAssetAccessTestRuntime({ openedTabId: 456 });

    await expect(
      testRuntime.assetAccess.runAssetAccess({
        platform: "tradingview",
        shouldNavigate: false,
        tabId: 789,
      }),
    ).resolves.toEqual(readyAssetResponse);

    expect(testRuntime.openOrReloadTab).not.toHaveBeenCalled();
    expect(testRuntime.markPopupNavigationAutoAccessSkip).not.toHaveBeenCalled();
    expect(testRuntime.startHeartbeat).toHaveBeenCalledWith(789, "tradingview");
  });
});

async function importAssetAccessTestRuntime({
  assets = [
    {
      hasPrivateAccess: true,
      hasShareAccess: true,
      platform: "tradingview" as const,
    },
  ],
  assetResponses = [readyAssetResponse],
  openedTabId,
}: {
  assets?: Array<{
    hasPrivateAccess: boolean;
    hasShareAccess: boolean;
    platform: "tradingview" | "fxreplay" | "fxtester";
  }>;
  assetResponses?: Array<
    | ExtensionAssetReadyResponse
    | {
        availableModes: readonly ["private", "share"];
        defaultMode: "private" | "share";
        platform: "tradingview";
        selectionTimeoutSeconds: number;
        status: "selection_required";
      }
  >;
  openedTabId: number;
}) {
  vi.doMock("@/background/core/bootstrap", () => ({
    createExtensionApiConfig: vi.fn(() => ({ baseUrl: "http://localhost:3000" })),
  }));
  vi.doMock("@/lib/api/extensionApi", () => ({
    fetchExtensionAsset: vi.fn(() => {
      const nextAssetResponse = assetResponses.shift() ?? readyAssetResponse;

      return Promise.resolve({ ok: true, status: 200, value: nextAssetResponse });
    }),
  }));
  vi.doMock("@/background/core/cookies", () => ({
    clearAssetPlatformCookies: vi.fn(() => Promise.resolve()),
    injectExtensionCookies: vi.fn(() => Promise.resolve()),
  }));
  vi.doMock("@/lib/storage/injectionCooldown", () => ({
    markInjectionCooldown: vi.fn(() => Promise.resolve()),
  }));
  vi.doMock("@/lib/storage/bootstrapCache", () => ({
    readBootstrapCache: vi.fn(() =>
      Promise.resolve({
        fetchedAt: 1_000,
        isValid: true,
        snapshot: {
          assets,
          auth: { status: "authenticated" },
          version: { status: "supported" },
        },
      }),
    ),
  }));
  vi.doMock("@/lib/storage/popupNavigationAutoAccessSkip", () => ({
    markPopupNavigationAutoAccessSkip: vi.fn(() => Promise.resolve()),
  }));
  vi.doMock("@/background/core/tabs", () => ({
    openOrReloadTab: vi.fn(() => Promise.resolve({ id: openedTabId })),
  }));
  vi.doMock("@/background/core/heartbeat", () => ({
    startHeartbeat: vi.fn(() => Promise.resolve()),
  }));

  const assetAccess = await import("@/background/core/assetAccess");
  const extensionApi = await import("@/lib/api/extensionApi");
  const tabs = await import("@/background/core/tabs");
  const heartbeat = await import("@/background/core/heartbeat");
  const popupNavigationAutoAccessSkip =
    await import("@/lib/storage/popupNavigationAutoAccessSkip");

  return {
    assetAccess,
    fetchExtensionAsset: vi.mocked(extensionApi.fetchExtensionAsset),
    markPopupNavigationAutoAccessSkip: vi.mocked(
      popupNavigationAutoAccessSkip.markPopupNavigationAutoAccessSkip,
    ),
    openOrReloadTab: vi.mocked(tabs.openOrReloadTab),
    startHeartbeat: vi.mocked(heartbeat.startHeartbeat),
  };
}
