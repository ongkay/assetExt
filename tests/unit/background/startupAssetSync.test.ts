import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ExtensionAssetReadyResponse,
  ExtensionAssetResponse,
  ExtensionMode,
} from "@/lib/api/extensionApiTypes";
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import type {
  AssetSessionSyncEntry,
  AssetSessionSyncState,
} from "@/lib/storage/assetSessionSync";

const tradingViewReadyResponse: ExtensionAssetReadyResponse = {
  cookies: [
    {
      domain: ".tradingview.com",
      name: "sessionid",
      value: "tv-session",
    },
  ],
  mode: "private",
  platform: "tradingview",
  status: "ready",
};

describe("background startup asset sync", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("syncs all platforms with automatic access and skips unavailable platforms", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      assets: [
        {
          hasPrivateAccess: true,
          hasShareAccess: true,
          platform: "tradingview",
        },
        {
          hasPrivateAccess: false,
          hasShareAccess: true,
          platform: "fxreplay",
        },
        {
          hasPrivateAccess: false,
          hasShareAccess: false,
          platform: "fxtester",
        },
      ],
      prepareAssetAccessSession: ({ mode, platform }) => {
        if (platform === "tradingview") {
          expect(mode).toBe("private");
          return Promise.resolve(tradingViewReadyResponse);
        }

        return Promise.resolve({
          ...tradingViewReadyResponse,
          cookies: [{ domain: ".fxreplay.com", name: "sessionid", value: "fxr-session" }],
          mode: "share",
          platform: "fxreplay",
        });
      },
    });

    await testRuntime.startupAssetSync.ensureStartupAssetSync();

    expect(testRuntime.prepareAssetAccessSession).toHaveBeenNthCalledWith(1, {
      mode: "private",
      platform: "tradingview",
    });
    expect(testRuntime.prepareAssetAccessSession).toHaveBeenNthCalledWith(2, {
      mode: "share",
      platform: "fxreplay",
    });
    expect(testRuntime.prepareAssetAccessSession).toHaveBeenCalledTimes(2);
    expect(testRuntime.getAssetSessionSyncEntry("tradingview").status).toBe("success");
    expect(testRuntime.getAssetSessionSyncEntry("fxreplay").status).toBe("success");
    expect(testRuntime.getAssetSessionSyncEntry("fxtester").status).toBe("skipped");
  });

  it("uses a one-time fallback and requests a single reload when startup sync misses the platform", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      assets: [
        {
          hasPrivateAccess: true,
          hasShareAccess: true,
          platform: "tradingview",
        },
      ],
      prepareAssetAccessSession: ({ mode, platform }) => {
        if (platform === "tradingview" && mode === "private") {
          return Promise.reject(new Error("Startup sync gagal"));
        }

        return Promise.resolve(tradingViewReadyResponse);
      },
    });

    await expect(
      testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview"),
    ).resolves.toEqual({
      action: "reload_required",
      fallbackUsed: true,
      lastErrorMessage: null,
      status: "success",
    });

    expect(testRuntime.prepareAssetAccessSession).toHaveBeenNthCalledWith(1, {
      mode: "private",
      platform: "tradingview",
    });
    expect(testRuntime.prepareAssetAccessSession).toHaveBeenNthCalledWith(2, {
      platform: "tradingview",
    });
    expect(testRuntime.getAssetSessionSyncEntry("tradingview")).toEqual({
      fallbackUsed: true,
      lastErrorMessage: null,
      lastSyncedAt: expect.any(Number) as number,
      status: "success",
    });
  });

  it("does not retry fallback more than once for the same platform in one browser session", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      assets: [
        {
          hasPrivateAccess: true,
          hasShareAccess: true,
          platform: "tradingview",
        },
      ],
      prepareAssetAccessSession: ({ mode, platform }) => {
        if (platform === "tradingview" && mode === "private") {
          return Promise.reject(new Error("Startup sync gagal"));
        }

        return Promise.resolve({
          reason: "subscription_required",
          status: "forbidden",
        } satisfies Extract<ExtensionAssetResponse, { status: "forbidden" }>);
      },
    });

    await expect(
      testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview"),
    ).resolves.toEqual({
      action: "none",
      fallbackUsed: true,
      lastErrorMessage: "Subscription aktif diperlukan untuk membuka asset ini.",
      status: "failed",
    });

    await expect(
      testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview"),
    ).resolves.toEqual({
      action: "none",
      fallbackUsed: true,
      lastErrorMessage: "Subscription aktif diperlukan untuk membuka asset ini.",
      status: "failed",
    });

    expect(testRuntime.prepareAssetAccessSession).toHaveBeenCalledTimes(2);
  });
});

async function importStartupAssetSyncTestRuntime({
  assets,
  prepareAssetAccessSession,
}: {
  assets: Array<{
    hasPrivateAccess: boolean;
    hasShareAccess: boolean;
    platform: "tradingview" | "fxreplay" | "fxtester";
  }>;
  prepareAssetAccessSession: (options: {
    mode?: ExtensionMode;
    platform: "tradingview" | "fxreplay" | "fxtester";
  }) => Promise<ExtensionAssetResponse>;
}) {
  let assetSessionSyncState = createEmptyAssetSessionSyncState();

  vi.doMock("@/background/core/bootstrap", () => ({
    forceRefreshBootstrapCache: vi.fn(() =>
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
  vi.doMock("@/background/core/assetAccess", () => ({
    prepareAssetAccessSession: vi.fn(prepareAssetAccessSession),
  }));
  vi.doMock("@/lib/storage/assetSessionSync", async (importOriginal) => {
    const originalAssetSessionSync =
      await importOriginal<typeof import("@/lib/storage/assetSessionSync")>();

    return {
      ...originalAssetSessionSync,
      readAssetSessionSyncState: vi.fn(() => Promise.resolve(assetSessionSyncState)),
      updateAssetSessionSyncEntry: vi.fn(
        (
          platform: AssetPlatform,
          updateEntry: (entry: AssetSessionSyncEntry) => AssetSessionSyncEntry,
        ) => {
        assetSessionSyncState = {
          ...assetSessionSyncState,
          [platform]: updateEntry(assetSessionSyncState[platform]),
        };

        return Promise.resolve(assetSessionSyncState);
        },
      ),
    };
  });

  const startupAssetSync = await import("@/background/core/startupAssetSync");
  const assetAccess = await import("@/background/core/assetAccess");

  return {
    getAssetSessionSyncEntry(platform: keyof AssetSessionSyncState): AssetSessionSyncEntry {
      return assetSessionSyncState[platform];
    },
    prepareAssetAccessSession: vi.mocked(assetAccess.prepareAssetAccessSession),
    startupAssetSync,
  };
}

function createEmptyAssetSessionSyncState(): AssetSessionSyncState {
  return {
    tradingview: createEmptyAssetSessionSyncEntry(),
    fxreplay: createEmptyAssetSessionSyncEntry(),
    fxtester: createEmptyAssetSessionSyncEntry(),
  };
}

function createEmptyAssetSessionSyncEntry(): AssetSessionSyncEntry {
  return {
    fallbackUsed: false,
    lastErrorMessage: null,
    lastSyncedAt: null,
    status: "idle",
  };
}
