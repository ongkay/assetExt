import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExtensionAssetReadyResponse } from "@/lib/api/extensionApiTypes";
import type { AssetSessionSyncEntry } from "@/lib/storage/assetSessionSync";

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
  revision: "extr1_ready",
  status: "ready",
  updatedAt: "2026-05-08T10:00:00.000Z",
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
    expect(testRuntime.syncAssetPlatformProxy.mock.invocationCallOrder[0]).toBeLessThan(
      testRuntime.openOrReloadTab.mock.invocationCallOrder[0],
    );
    expect(testRuntime.startHeartbeat).toHaveBeenCalledWith(456, "tradingview");
    expect(testRuntime.getAssetSessionSyncEntry()).toMatchObject({
      lastErrorMessage: null,
      revision: "extr1_ready",
      skipNextPageSync: false,
      skipNextPageSyncTabIds: [],
      status: "success",
      updatedAt: "2026-05-08T10:00:00.000Z",
    });
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
      { apiBaseUrl: "http://localhost:3000" },
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
  let assetSessionSyncEntry: AssetSessionSyncEntry = {
    lastErrorMessage: null,
    lastSyncedAt: null,
    revision: null,
    skipNextPageSync: false,
    skipNextPageSyncTabIds: [],
    status: "idle",
    updatedAt: null,
  };

  vi.doMock("@/background/core/bootstrap", () => ({
    createExtensionApiConfig: vi.fn(() => ({ apiBaseUrl: "http://localhost:3000" })),
    getExtensionSessionLifecycleRevision: vi.fn(() => 0),
  }));
  vi.doMock("@/background/core/productionOrigin", () => ({
    ensureProductionOriginHeaderRuleReady: vi.fn(() => Promise.resolve()),
  }));
  vi.doMock("@/background/core/proxy", () => ({
    clearAssetPlatformProxy: vi.fn(() => Promise.resolve()),
    ensureProxyAccessAvailable: vi.fn(() => Promise.resolve()),
    syncAssetPlatformProxy: vi.fn(() => Promise.resolve()),
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
  vi.doMock("@/lib/storage/assetSessionSync", () => ({
    updateAssetSessionSyncEntry: vi.fn(
      (
        _platform: "tradingview" | "fxtester",
        updateEntry: (entry: AssetSessionSyncEntry) => AssetSessionSyncEntry,
      ) => {
        assetSessionSyncEntry = updateEntry(assetSessionSyncEntry);

        return Promise.resolve({ tradingview: assetSessionSyncEntry, fxtester: assetSessionSyncEntry });
      },
    ),
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
  const proxy = await import("@/background/core/proxy");

  return {
    assetAccess,
    clearAssetPlatformProxy: vi.mocked(proxy.clearAssetPlatformProxy),
    ensureProxyAccessAvailable: vi.mocked(proxy.ensureProxyAccessAvailable),
    fetchExtensionAsset: vi.mocked(extensionApi.fetchExtensionAsset),
    getAssetSessionSyncEntry() {
      return assetSessionSyncEntry;
    },
    openOrReloadTab: vi.mocked(tabs.openOrReloadTab),
    startHeartbeat: vi.mocked(heartbeat.startHeartbeat),
    syncAssetPlatformProxy: vi.mocked(proxy.syncAssetPlatformProxy),
  };
}
