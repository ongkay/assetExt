import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExtensionApiResult, ExtensionBootstrap } from "@/lib/api/extensionApiTypes";
import type { BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";

type Deferred<TValue> = {
  promise: Promise<TValue>;
  reject: (reason: unknown) => void;
  resolve: (value: TValue) => void;
};

const previousSnapshot = {
  auth: { status: "authenticated" as const },
  version: { status: "supported" as const },
};

const staleSnapshot = {
  auth: { status: "authenticated" as const },
  version: { status: "supported" as const },
};

const explicitSnapshot = {
  auth: { status: "unauthenticated" as const, loginUrl: "/explicit-login" },
  version: { status: "supported" as const },
};

const previousCache: BootstrapCacheRecord = {
  fetchedAt: 0,
  isValid: true,
  snapshot: previousSnapshot,
};

const invalidUnauthenticatedCache: BootstrapCacheRecord = {
  fetchedAt: 0,
  isValid: false,
  snapshot: {
    auth: { status: "unauthenticated", loginUrl: "/login" },
    version: { status: "supported" },
  },
};

function createDeferred<TValue>(): Deferred<TValue> {
  let rejectDeferred: (reason: unknown) => void = () => {};
  let resolveDeferred: (value: TValue) => void = () => {};
  const promise = new Promise<TValue>((resolve, reject) => {
    rejectDeferred = reject;
    resolveDeferred = resolve;
  });

  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

describe("background bootstrap core", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("does not let an in-flight stale bootstrap sync overwrite a newer explicit snapshot", async () => {
    const bootstrapFetch = createDeferred<ExtensionApiResult<typeof staleSnapshot>>();
    const testRuntime = await importBootstrapCoreTestRuntime(previousCache, () => bootstrapFetch.promise);

    await expect(testRuntime.bootstrapCore.readBootstrapState(false)).resolves.toEqual({
      cache: previousCache,
      isSyncing: true,
    });

    await testRuntime.bootstrapCore.replaceBootstrapCacheFromSnapshot(explicitSnapshot);
    bootstrapFetch.resolve({ ok: true, status: 200, value: staleSnapshot });

    await vi.waitFor(() => {
      expect(testRuntime.readBootstrapCache).toHaveBeenCalledTimes(2);
      expect(testRuntime.writeBootstrapCache).toHaveBeenCalledTimes(1);
      expect(testRuntime.getCurrentCache()?.snapshot).toBe(explicitSnapshot);
    });
  });

  it("blocks stale sync writes while an explicit snapshot write is still pending", async () => {
    const bootstrapFetch = createDeferred<ExtensionApiResult<typeof staleSnapshot>>();
    const explicitWrite = createDeferred<void>();
    const staleWrite = createDeferred<void>();
    const pendingWrites: Array<{
      nextCache: BootstrapCacheRecord;
      resolveWrite: () => void;
    }> = [];
    const testRuntime = await importBootstrapCoreTestRuntime(
      previousCache,
      () => bootstrapFetch.promise,
      (nextCache, setCurrentCache) => {
        const isExplicitWrite = nextCache.snapshot === explicitSnapshot;
        const writeDeferred = isExplicitWrite ? explicitWrite : staleWrite;

        pendingWrites.push({
          nextCache,
          resolveWrite: () => {
            setCurrentCache(nextCache);
            writeDeferred.resolve();
          },
        });

        return writeDeferred.promise;
      },
    );

    await testRuntime.bootstrapCore.readBootstrapState(false);
    const explicitReplace = testRuntime.bootstrapCore.replaceBootstrapCacheFromSnapshot(explicitSnapshot);

    await vi.waitFor(() => {
      expect(pendingWrites).toHaveLength(1);
      expect(pendingWrites[0].nextCache.snapshot).toBe(explicitSnapshot);
    });

    bootstrapFetch.resolve({ ok: true, status: 200, value: staleSnapshot });

    await vi.waitFor(() => {
      expect(pendingWrites.length === 2 || testRuntime.readBootstrapCache.mock.calls.length >= 2).toBe(true);
    });

    pendingWrites[0].resolveWrite();
    await explicitReplace;

    if (pendingWrites[1]) {
      expect(pendingWrites[1].nextCache.snapshot).toBe(staleSnapshot);
      pendingWrites[1].resolveWrite();
    }

    await vi.waitFor(() => {
      expect(testRuntime.getCurrentCache()?.snapshot).toBe(explicitSnapshot);
    });
  });

  it("blocks initial stale sync writes while an explicit snapshot write is pending with no persisted cache", async () => {
    const bootstrapFetch = createDeferred<ExtensionApiResult<typeof staleSnapshot>>();
    const explicitWrite = createDeferred<void>();
    const staleWrite = createDeferred<void>();
    const pendingWrites: Array<{
      nextCache: BootstrapCacheRecord;
      resolveWrite: () => void;
    }> = [];
    const testRuntime = await importBootstrapCoreTestRuntime(
      null,
      () => bootstrapFetch.promise,
      (nextCache, setCurrentCache) => {
        const isExplicitWrite = nextCache.snapshot === explicitSnapshot;
        const writeDeferred = isExplicitWrite ? explicitWrite : staleWrite;

        pendingWrites.push({
          nextCache,
          resolveWrite: () => {
            setCurrentCache(nextCache);
            writeDeferred.resolve();
          },
        });

        return writeDeferred.promise;
      },
    );

    const initialBootstrapState = testRuntime.bootstrapCore.readBootstrapState(false);

    await vi.waitFor(() => {
      expect(testRuntime.fetchExtensionBootstrap).toHaveBeenCalledTimes(1);
    });

    const explicitReplace = testRuntime.bootstrapCore.replaceBootstrapCacheFromSnapshot(explicitSnapshot);

    await vi.waitFor(() => {
      expect(pendingWrites).toHaveLength(1);
      expect(pendingWrites[0].nextCache.snapshot).toBe(explicitSnapshot);
    });

    bootstrapFetch.resolve({ ok: true, status: 200, value: staleSnapshot });

    await vi.waitFor(() => {
      expect(pendingWrites.length === 2 || testRuntime.readBootstrapCache.mock.calls.length >= 2).toBe(true);
    });

    pendingWrites[0].resolveWrite();
    await explicitReplace;

    if (pendingWrites[1]) {
      expect(pendingWrites[1].nextCache.snapshot).toBe(staleSnapshot);
      pendingWrites[1].resolveWrite();
    }

    await initialBootstrapState;

    expect(testRuntime.getCurrentCache()?.snapshot).toBe(explicitSnapshot);
  });

  it("persists and returns an error cache record when bootstrap fetch rejects with previous cache", async () => {
    const testRuntime = await importBootstrapCoreTestRuntime(previousCache, () =>
      Promise.reject(new Error("Network offline")),
    );

    await expect(testRuntime.bootstrapCore.forceRefreshBootstrapCache()).resolves.toEqual({
      ...previousCache,
      lastErrorMessage: "Network offline",
    });
    expect(testRuntime.getCurrentCache()).toEqual({
      ...previousCache,
      lastErrorMessage: "Network offline",
    });
  });

  it("persists unauthenticated bootstrap for current render", async () => {
    const unauthenticatedSnapshot = {
      auth: { status: "unauthenticated" as const, loginUrl: "/login" },
      version: { status: "supported" as const },
    };
    const testRuntime = await importBootstrapCoreTestRuntime(null, () =>
      Promise.resolve({ ok: true, status: 200, value: unauthenticatedSnapshot }),
    );

    await expect(testRuntime.bootstrapCore.readBootstrapState(false)).resolves.toEqual({
      cache: {
        fetchedAt: expect.any(Number) as number,
        isValid: false,
        snapshot: unauthenticatedSnapshot,
      },
      isSyncing: false,
    });
    expect(testRuntime.getCurrentCache()).toEqual({
      fetchedAt: expect.any(Number) as number,
      isValid: false,
      snapshot: unauthenticatedSnapshot,
    });
    expect(testRuntime.writeBootstrapCache).toHaveBeenCalledTimes(1);
  });

  it("refreshes invalid unauthenticated cache before rendering popup bootstrap", async () => {
    const authenticatedSnapshot = {
      auth: { status: "authenticated" as const },
      assets: [],
      packages: [],
      subscription: {
        countdownSeconds: 0,
        endAt: null,
        packageName: null,
        status: "none" as const,
      },
      user: {
        avatarUrl: null,
        email: "user@example.com",
        id: "user-id",
        publicId: "PUB-001",
        username: "user",
      },
      version: { status: "supported" as const },
    };
    const testRuntime = await importBootstrapCoreTestRuntime(invalidUnauthenticatedCache, () =>
      Promise.resolve({ ok: true, status: 200, value: authenticatedSnapshot }),
    );

    await expect(testRuntime.bootstrapCore.readBootstrapState(false)).resolves.toEqual({
      cache: {
        fetchedAt: expect.any(Number) as number,
        isValid: true,
        snapshot: authenticatedSnapshot,
      },
      isSyncing: false,
    });
    expect(testRuntime.fetchExtensionBootstrap).toHaveBeenCalledTimes(1);
    expect(testRuntime.getCurrentCache()).toEqual({
      fetchedAt: expect.any(Number) as number,
      isValid: true,
      snapshot: authenticatedSnapshot,
    });
  });

  it("clears persisted bootstrap cache on logout", async () => {
    const testRuntime = await importBootstrapCoreTestRuntime(previousCache, () =>
      Promise.resolve({ ok: true, status: 200, value: staleSnapshot }),
    );
    testRuntime.postExtensionLogout.mockResolvedValue({
      ok: true,
      status: 200,
      value: { ok: true, redirectTo: "/login" },
    });

    await expect(testRuntime.bootstrapCore.logoutExtensionSession()).resolves.toEqual({
      ok: true,
      redirectTo: "http://localhost:3000/login",
    });
    expect(testRuntime.getCurrentCache()).toBeNull();
    expect(testRuntime.clearBootstrapCache).toHaveBeenCalledTimes(1);
    expect(testRuntime.clearAssetSessionSyncState).toHaveBeenCalledTimes(1);
    expect(testRuntime.clearAllAssetPlatformCookies).toHaveBeenCalledTimes(1);
    expect(testRuntime.writeBootstrapCache).not.toHaveBeenCalled();
  });
});

async function importBootstrapCoreTestRuntime(
  initialCache: BootstrapCacheRecord | null,
  fetchBootstrap: () => Promise<ExtensionApiResult<ExtensionBootstrap>>,
  writeBootstrap?: (
    nextCache: BootstrapCacheRecord,
    setCurrentCache: (nextCache: BootstrapCacheRecord) => void,
  ) => Promise<void>,
) {
  let currentCache = initialCache;
  const setCurrentCache = (nextCache: BootstrapCacheRecord) => {
    currentCache = nextCache;
  };

  vi.stubGlobal("chrome", {
    runtime: {
      getManifest: () => ({ version: "1.0.0" }),
      id: "extension-id",
    },
  });

  vi.doMock("@/lib/api/extensionApi", () => ({
    fetchExtensionBootstrap: vi.fn(fetchBootstrap),
    postExtensionLogout: vi.fn(),
  }));
  vi.doMock("@/background/core/cookies", () => ({
    clearAllAssetPlatformCookies: vi.fn(() => Promise.resolve()),
  }));
  vi.doMock("@/lib/storage/assetSessionSync", () => ({
    clearAssetSessionSyncState: vi.fn(() => Promise.resolve()),
  }));
  vi.doMock("@/lib/storage/bootstrapCache", async (importOriginal) => {
    const originalBootstrapCache = await importOriginal<typeof import("@/lib/storage/bootstrapCache")>();

    return {
      ...originalBootstrapCache,
      readBootstrapCache: vi.fn(() => Promise.resolve(currentCache)),
      clearBootstrapCache: vi.fn(() => {
        currentCache = null;
        return Promise.resolve();
      }),
      writeBootstrapCache: vi.fn((nextCache: BootstrapCacheRecord) => {
        if (writeBootstrap) {
          return writeBootstrap(nextCache, setCurrentCache);
        }

        setCurrentCache(nextCache);
        return Promise.resolve();
      }),
    };
  });

  const bootstrapCore = await import("@/background/core/bootstrap");
  const backgroundCookies = await import("@/background/core/cookies");
  const assetSessionSync = await import("@/lib/storage/assetSessionSync");
  const bootstrapCache = await import("@/lib/storage/bootstrapCache");
  const extensionApi = await import("@/lib/api/extensionApi");

  return {
    bootstrapCore,
    clearAssetSessionSyncState: vi.mocked(assetSessionSync.clearAssetSessionSyncState),
    clearAllAssetPlatformCookies: vi.mocked(backgroundCookies.clearAllAssetPlatformCookies),
    fetchExtensionBootstrap: vi.mocked(extensionApi.fetchExtensionBootstrap),
    postExtensionLogout: vi.mocked(extensionApi.postExtensionLogout),
    clearBootstrapCache: vi.mocked(bootstrapCache.clearBootstrapCache),
    getCurrentCache: () => currentCache,
    readBootstrapCache: vi.mocked(bootstrapCache.readBootstrapCache),
    writeBootstrapCache: vi.mocked(bootstrapCache.writeBootstrapCache),
  };
}
