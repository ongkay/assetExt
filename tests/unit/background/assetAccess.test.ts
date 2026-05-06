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

    expect(testRuntime.openOrReloadTab).toHaveBeenCalledWith("https://www.tradingview.com/chart/", undefined);
    expect(testRuntime.startHeartbeat).toHaveBeenCalledWith(456, "tradingview");
  });

  it("requests the asset payload without sending an explicit mode", async () => {
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
    );
  });

  it("returns backend forbidden responses without retrying another mode", async () => {
    const forbiddenResponse = {
      reason: "subscription_required" as const,
      status: "forbidden" as const,
    };
    const testRuntime = await importAssetAccessTestRuntime({
      assetResponses: [forbiddenResponse],
      openedTabId: 456,
    });

    await expect(
      testRuntime.assetAccess.runAssetAccess({
        platform: "tradingview",
        shouldNavigate: true,
      }),
    ).resolves.toEqual(forbiddenResponse);

    expect(testRuntime.fetchExtensionAsset).toHaveBeenCalledTimes(1);
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
    expect(testRuntime.startHeartbeat).toHaveBeenCalledWith(789, "tradingview");
  });
});

async function importAssetAccessTestRuntime({
  assetResponses = [readyAssetResponse],
  openedTabId,
}: {
  assetResponses?: Array<
    ExtensionAssetReadyResponse | { reason: "subscription_required"; status: "forbidden" }
  >;
  openedTabId: number;
}) {
  vi.doMock("@/background/core/bootstrap", () => ({
    createExtensionApiConfig: vi.fn(() => ({ baseUrl: "http://localhost:3000" })),
  }));
  vi.doMock("@/background/core/productionOrigin", () => ({
    ensureProductionOriginHeaderRuleReady: vi.fn(() => Promise.resolve()),
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

  return {
    assetAccess,
    fetchExtensionAsset: vi.mocked(extensionApi.fetchExtensionAsset),
    openOrReloadTab: vi.mocked(tabs.openOrReloadTab),
    startHeartbeat: vi.mocked(heartbeat.startHeartbeat),
  };
}
