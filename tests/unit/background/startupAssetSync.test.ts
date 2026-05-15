import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExtensionAssetReadyResponse, ExtensionAssetSyncResponse } from "@/lib/api/extensionApiTypes";
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import type { AssetProxyState } from "@/lib/proxy/assetProxy";
import type { BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";
import type { AssetSessionSyncEntry, AssetSessionSyncState } from "@/lib/storage/assetSessionSync";

const readyAssetResponse: ExtensionAssetReadyResponse = {
  cookies: [
    {
      domain: ".tradingview.com",
      name: "sessionid",
      value: "tv-session",
    },
  ],
  mode: "private",
  platform: "tradingview",
  revision: "extr1_ready",
  status: "ready",
  updatedAt: "2026-05-08T10:00:00.000Z",
};

describe("background startup asset sync", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("does nothing when bootstrap cache is missing", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({ bootstrapCache: null });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview")).resolves.toEqual({
      action: "none",
      message: null,
      redirectTo: null,
      shouldStartHeartbeat: false,
    });

    expect(testRuntime.fetchAssetSessionSync).not.toHaveBeenCalled();
    expect(testRuntime.prepareAssetAccessSession).not.toHaveBeenCalled();
  });

  it("does nothing when bootstrap cache is unauthenticated", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      bootstrapCache: {
        fetchedAt: 1_000,
        isValid: false,
        snapshot: {
          auth: { loginUrl: "/login", status: "unauthenticated" },
          version: { status: "supported" },
        },
      },
    });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview")).resolves.toEqual({
      action: "none",
      message: null,
      redirectTo: null,
      shouldStartHeartbeat: false,
    });

    expect(testRuntime.fetchAssetSessionSync).not.toHaveBeenCalled();
  });

  it("skips sync once after extension-triggered reload", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      assetSessionSyncState: {
        fxtester: createEmptyAssetSessionSyncEntry(),
        tradingview: {
          ...createEmptyAssetSessionSyncEntry(),
          revision: "extr1_saved",
          skipNextPageSync: true,
          skipNextPageSyncTabIds: [321],
          status: "success",
          updatedAt: "2026-05-08T09:00:00.000Z",
        },
      },
    });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview", 321)).resolves.toEqual(
      {
        action: "none",
        message: null,
        redirectTo: null,
        shouldStartHeartbeat: true,
      },
    );

    expect(testRuntime.fetchAssetSessionSync).not.toHaveBeenCalled();
    expect(testRuntime.getAssetSessionSyncEntry("tradingview").skipNextPageSync).toBe(false);
  });

  it("keeps page untouched when backend revision is current", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      assetSessionSyncState: {
        fxtester: createEmptyAssetSessionSyncEntry(),
        tradingview: {
          ...createEmptyAssetSessionSyncEntry(),
          revision: "extr1_saved",
          status: "success",
        },
      },
      assetSyncResponses: [
        {
          mode: "private",
          platform: "tradingview",
          revision: "extr1_saved",
          status: "current",
          updatedAt: "2026-05-08T10:00:00.000Z",
        },
      ],
    });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview")).resolves.toEqual({
      action: "none",
      message: null,
      redirectTo: null,
      shouldStartHeartbeat: true,
    });

    expect(testRuntime.fetchAssetSessionSync).toHaveBeenCalledWith("tradingview", "extr1_saved");
    expect(testRuntime.prepareAssetAccessSession).not.toHaveBeenCalled();
    expect(testRuntime.getAssetSessionSyncEntry("tradingview")).toMatchObject({
      revision: "extr1_saved",
      skipNextPageSync: false,
      skipNextPageSyncTabIds: [],
      status: "success",
      updatedAt: "2026-05-08T10:00:00.000Z",
    });
  });

  it("refreshes asset session immediately when proxy state has not been established yet", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      assetProxyState: {
        conflict: {
          detectedAt: null,
          extensions: [],
          isActive: false,
          levelOfControl: null,
          message: null,
        },
        platforms: {
          tradingview: { proxy: null, updatedAt: null },
          fxtester: { proxy: null, updatedAt: "2026-05-08T10:00:00.000Z" },
        },
      },
      assetSessionSyncState: {
        fxtester: createEmptyAssetSessionSyncEntry(),
        tradingview: {
          ...createEmptyAssetSessionSyncEntry(),
          revision: "extr1_saved",
          status: "success",
        },
      },
      preparedAssetResponses: [readyAssetResponse],
    });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview", 777)).resolves.toEqual(
      {
        action: "none",
        message: null,
        redirectTo: null,
        shouldStartHeartbeat: false,
      },
    );

    expect(testRuntime.fetchAssetSessionSync).not.toHaveBeenCalled();
    expect(testRuntime.prepareAssetAccessSession).toHaveBeenCalledWith({
      platform: "tradingview",
    });
  });

  it("clears existing platform cookies when sync reports subscription forbidden", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      assetSyncResponses: [
        {
          reason: "subscription_required",
          status: "forbidden",
        },
      ],
    });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview", 123)).resolves.toEqual(
      {
        action: "none",
        message: null,
        redirectTo: null,
        shouldStartHeartbeat: false,
      },
    );

    expect(testRuntime.clearAssetPlatformCookies).toHaveBeenCalledWith("tradingview");
  });

  it("fetches fresh asset cookies and requests reload when revision is stale", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      assetSessionSyncState: {
        fxtester: createEmptyAssetSessionSyncEntry(),
        tradingview: {
          ...createEmptyAssetSessionSyncEntry(),
          revision: "extr1_old",
          status: "success",
        },
      },
      assetSyncResponses: [
        {
          mode: "private",
          platform: "tradingview",
          reason: "revision_mismatch",
          revision: "extr1_new",
          status: "stale",
          updatedAt: "2026-05-08T10:00:00.000Z",
        },
      ],
      preparedAssetResponses: [readyAssetResponse],
    });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview", 654)).resolves.toEqual(
      {
        action: "none",
        message: null,
        redirectTo: null,
        shouldStartHeartbeat: false,
      },
    );

    expect(testRuntime.prepareAssetAccessSession).toHaveBeenCalledWith({
      platform: "tradingview",
    });
    expect(testRuntime.getAssetSessionSyncEntry("tradingview")).toMatchObject({
      skipNextPageSync: true,
      skipNextPageSyncTabIds: [654],
    });
  });

  it("redirects to login and clears local session when backend returns unauthenticated", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      assetSyncError: createExtensionApiRequestError("EXT_UNAUTHENTICATED", "Session expired."),
      unauthenticatedRedirectTo: "http://localhost:3000/login",
    });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview")).resolves.toEqual({
      action: "redirect_login",
      message: null,
      redirectTo: "http://localhost:3000/login",
      shouldStartHeartbeat: false,
    });

    expect(testRuntime.markExtensionSessionUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it("redirects to the blocked page when proxy control is in conflict", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      proxyAccessError: new Error("Proxy conflict"),
      proxyBlockedPageUrl: "chrome-extension://runtime-id/proxy-blocked.html",
    });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview")).resolves.toEqual({
      action: "proxy_blocked",
      message: "Proxy conflict",
      redirectTo: "chrome-extension://runtime-id/proxy-blocked.html",
      shouldStartHeartbeat: false,
    });
  });

  it("redirects to the peer guard warning page when ext-2 is unavailable", async () => {
    const testRuntime = await importStartupAssetSyncTestRuntime({
      peerGuardError: new Error("ext-2 wajib aktif"),
      peerGuardWarningPageUrl: "chrome-extension://runtime-id/ext-1-blocked.html",
    });

    await expect(testRuntime.startupAssetSync.ensureAssetSessionForPage("tradingview")).resolves.toEqual({
      action: "peer_required",
      message: "ext-2 wajib aktif",
      redirectTo: "chrome-extension://runtime-id/ext-1-blocked.html",
      shouldStartHeartbeat: false,
    });

    expect(testRuntime.fetchAssetSessionSync).not.toHaveBeenCalled();
    expect(testRuntime.prepareAssetAccessSession).not.toHaveBeenCalled();
  });
});

async function importStartupAssetSyncTestRuntime({
  assetSessionSyncState = createEmptyAssetSessionSyncState(),
  assetProxyState = createKnownAssetProxyState(),
  proxyAccessError = null,
  proxyBlockedPageUrl = "chrome-extension://runtime-id/proxy-blocked.html",
  peerGuardError = null,
  peerGuardWarningPageUrl = "chrome-extension://runtime-id/ext-1-blocked.html",
  assetSyncError = null,
  assetSyncResponses = [],
  bootstrapCache = createAuthenticatedBootstrapCache(),
  preparedAssetResponses = [readyAssetResponse],
  unauthenticatedRedirectTo = "http://localhost:3000/login",
}: {
  assetSessionSyncState?: AssetSessionSyncState;
  assetProxyState?: AssetProxyState;
  proxyAccessError?: Error | null;
  proxyBlockedPageUrl?: string;
  peerGuardError?: Error | null;
  peerGuardWarningPageUrl?: string;
  assetSyncError?: Error | null;
  assetSyncResponses?: ExtensionAssetSyncResponse[];
  bootstrapCache?: BootstrapCacheRecord | null;
  preparedAssetResponses?: ExtensionAssetReadyResponse[];
  unauthenticatedRedirectTo?: string;
}) {
  let currentAssetSessionSyncState = assetSessionSyncState;

  vi.doMock("@/lib/storage/bootstrapCache", () => ({
    readBootstrapCache: vi.fn(() => Promise.resolve(bootstrapCache)),
  }));
  vi.doMock("@/lib/storage/assetProxyState", () => ({
    readAssetProxyState: vi.fn(() => Promise.resolve(assetProxyState)),
  }));
  vi.doMock("@/background/core/assetAccess", () => {
    class MockExtensionApiRequestError extends Error {
      readonly code: string;

      constructor(code: string, message: string) {
        super(message);
        this.code = code;
      }
    }

    return {
      ExtensionApiRequestError: MockExtensionApiRequestError,
      fetchAssetSessionSync: vi.fn((platform: AssetPlatform, revision: string | null) => {
        if (assetSyncError) {
          return Promise.reject(assetSyncError);
        }

        const nextResponse = assetSyncResponses.shift() ?? createCurrentAssetSyncResponse(platform, revision);

        return Promise.resolve(nextResponse);
      }),
      prepareAssetAccessSession: vi.fn(() => {
        const nextResponse = preparedAssetResponses.shift() ?? readyAssetResponse;

        return Promise.resolve(nextResponse);
      }),
    };
  });
  vi.doMock("@/background/core/bootstrap", () => ({
    clearExtensionSessionArtifactsForPeerGuard: vi.fn(() => Promise.resolve()),
    markExtensionSessionUnauthenticated: vi.fn(() => Promise.resolve(unauthenticatedRedirectTo)),
  }));
  vi.doMock("@/background/core/cookies", () => ({
    clearAssetPlatformCookies: vi.fn(() => Promise.resolve()),
  }));
  vi.doMock("@/background/core/proxy", () => {
    class MockProxyConflictError extends Error {
      constructor(message: string) {
        super(message);
      }
    }

    return {
      ProxyConflictError: MockProxyConflictError,
      clearAssetPlatformProxy: vi.fn(() => Promise.resolve()),
      ensureProxyAccessAvailable: vi.fn(() => {
        if (proxyAccessError) {
          return Promise.reject(new MockProxyConflictError(proxyAccessError.message));
        }

        return Promise.resolve();
      }),
      getProxyBlockedPageUrl: vi.fn(() => proxyBlockedPageUrl),
    };
  });
  vi.doMock("@/ext-1/background/core/peerGuard", () => {
    class MockPeerGuardBlockedError extends Error {
      constructor(message: string) {
        super(message);
      }
    }

    return {
      PeerGuardBlockedError: MockPeerGuardBlockedError,
      ensurePeerGuardAccess: vi.fn(() => {
        if (peerGuardError) {
          return Promise.reject(new MockPeerGuardBlockedError(peerGuardError.message));
        }

        return Promise.resolve();
      }),
      getPeerGuardWarningPageUrl: vi.fn(() => peerGuardWarningPageUrl),
    };
  });
  vi.doMock("@/lib/storage/assetSessionSync", async (importOriginal) => {
    const originalAssetSessionSync = await importOriginal<typeof import("@/lib/storage/assetSessionSync")>();

    return {
      ...originalAssetSessionSync,
      readAssetSessionSyncState: vi.fn(() => Promise.resolve(currentAssetSessionSyncState)),
      updateAssetSessionSyncEntry: vi.fn(
        (platform: AssetPlatform, updateEntry: (entry: AssetSessionSyncEntry) => AssetSessionSyncEntry) => {
          currentAssetSessionSyncState = {
            ...currentAssetSessionSyncState,
            [platform]: updateEntry(currentAssetSessionSyncState[platform]),
          };

          return Promise.resolve(currentAssetSessionSyncState);
        },
      ),
    };
  });

  const startupAssetSync = await import("@/background/core/startupAssetSync");
  const assetAccess = await import("@/background/core/assetAccess");
  const bootstrap = await import("@/background/core/bootstrap");
  const cookies = await import("@/background/core/cookies");

  return {
    clearAssetPlatformCookies: vi.mocked(cookies.clearAssetPlatformCookies),
    fetchAssetSessionSync: vi.mocked(assetAccess.fetchAssetSessionSync),
    getAssetSessionSyncEntry(platform: keyof AssetSessionSyncState): AssetSessionSyncEntry {
      return currentAssetSessionSyncState[platform];
    },
    markExtensionSessionUnauthenticated: vi.mocked(bootstrap.markExtensionSessionUnauthenticated),
    prepareAssetAccessSession: vi.mocked(assetAccess.prepareAssetAccessSession),
    startupAssetSync,
  };
}

function createCurrentAssetSyncResponse(
  platform: AssetPlatform,
  revision: string | null,
): Extract<ExtensionAssetSyncResponse, { status: "current" }> {
  return {
    mode: "private",
    platform,
    revision: revision ?? "extr1_current",
    status: "current",
    updatedAt: "2026-05-08T10:00:00.000Z",
  };
}

function createAuthenticatedBootstrapCache(): BootstrapCacheRecord {
  return {
    fetchedAt: 1_000,
    isValid: true,
    snapshot: {
      auth: { status: "authenticated" },
      version: { status: "supported" },
    },
  };
}

function createEmptyAssetSessionSyncState(): AssetSessionSyncState {
  return {
    tradingview: createEmptyAssetSessionSyncEntry(),
    fxtester: createEmptyAssetSessionSyncEntry(),
  };
}

function createKnownAssetProxyState(): AssetProxyState {
  return {
    conflict: {
      detectedAt: null,
      extensions: [],
      isActive: false,
      levelOfControl: null,
      message: null,
    },
    platforms: {
      tradingview: {
        proxy: null,
        updatedAt: "2026-05-08T10:00:00.000Z",
      },
      fxtester: {
        proxy: null,
        updatedAt: "2026-05-08T10:00:00.000Z",
      },
    },
  };
}

function createEmptyAssetSessionSyncEntry(): AssetSessionSyncEntry {
  return {
    lastErrorMessage: null,
    lastSyncedAt: null,
    revision: null,
    skipNextPageSync: false,
    skipNextPageSyncTabIds: [],
    status: "idle",
    updatedAt: null,
  };
}

function createExtensionApiRequestError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}
