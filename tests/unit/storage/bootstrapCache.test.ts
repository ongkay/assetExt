import { afterEach, describe, expect, it, vi } from "vitest";

import {
  bootstrapCacheTtlMs,
  createInvalidUnauthenticatedBootstrapCache,
  isBootstrapCacheExpired,
  type BootstrapCacheRecord,
} from "@/lib/storage/bootstrapCache";
import {
  isInjectionCooldownActive,
  markInjectionCooldown,
} from "@/lib/storage/injectionCooldown";
import {
  consumePopupNavigationAutoAccessSkip,
  markPopupNavigationAutoAccessSkip,
} from "@/lib/storage/popupNavigationAutoAccessSkip";

const originalChrome = globalThis.chrome;

type ChromeStorageValues = Record<string, unknown>;

function createDeferred<TValue>() {
  let resolveDeferred: (value: TValue) => void = () => {};
  const promise = new Promise<TValue>((resolve) => {
    resolveDeferred = resolve;
  });

  return { promise, resolve: resolveDeferred };
}

function installDelayedChromeStorage(storageValues: ChromeStorageValues) {
  const pendingGetCalls: Array<{
    key: string;
    resolve: (storedValues: ChromeStorageValues) => void;
  }> = [];
  const pendingSetCalls: Array<{ storedValues: ChromeStorageValues; resolve: () => void }> =
    [];
  let delayedConcurrentMarkReads = false;

  globalThis.chrome = {
    storage: {
      local: {
        get: vi.fn((key: string) => {
          const getDeferred = createDeferred<ChromeStorageValues>();

          if (delayedConcurrentMarkReads || Object.keys(storageValues).length > 0) {
            return Promise.resolve({ [key]: storageValues[key] });
          }

          pendingGetCalls.push({ key, resolve: getDeferred.resolve });
          const concurrentMarkReadsReady = pendingGetCalls.length >= 2;

          if (concurrentMarkReadsReady) {
            delayedConcurrentMarkReads = true;
            const getCalls = pendingGetCalls.splice(0);
            getCalls.forEach((getCall) =>
              getCall.resolve({ [getCall.key]: storageValues[getCall.key] }),
            );
          }

          return getDeferred.promise;
        }),
        set: vi.fn((values: ChromeStorageValues) => {
          const setDeferred = createDeferred<void>();
          pendingSetCalls.push({ resolve: setDeferred.resolve, storedValues: values });
          const concurrentMarkWritesReady = pendingSetCalls.length >= 2;

          if (concurrentMarkWritesReady) {
            const setCalls = pendingSetCalls.splice(0).sort((firstCall, secondCall) => {
              const firstCallHasTradingView = JSON.stringify(firstCall.storedValues).includes(
                "tradingview",
              );
              const secondCallHasTradingView = JSON.stringify(
                secondCall.storedValues,
              ).includes("tradingview");

              if (firstCallHasTradingView === secondCallHasTradingView) {
                return 0;
              }

              return firstCallHasTradingView ? 1 : -1;
            });

            setCalls.forEach((setCall) => {
              Object.assign(storageValues, setCall.storedValues);
              setCall.resolve();
            });
          }

          return setDeferred.promise;
        }),
      },
    },
  } as unknown as typeof chrome;
}

afterEach(() => {
  globalThis.chrome = originalChrome;
  vi.restoreAllMocks();
});

describe("bootstrap cache", () => {
  it("expires only after the bootstrap cache TTL has passed", () => {
    const bootstrapCacheRecord: BootstrapCacheRecord = {
      fetchedAt: 1000,
      isValid: true,
      snapshot: {
        auth: { status: "unauthenticated", loginUrl: "/login" },
        version: { status: "supported" },
      },
    };

    expect(isBootstrapCacheExpired(bootstrapCacheRecord, 1000 + bootstrapCacheTtlMs)).toBe(
      false,
    );
    expect(isBootstrapCacheExpired(bootstrapCacheRecord, 1001 + bootstrapCacheTtlMs)).toBe(
      true,
    );
  });

  it("creates invalid unauthenticated cache for logout fallback", () => {
    expect(createInvalidUnauthenticatedBootstrapCache("/login", 123)).toEqual({
      fetchedAt: 123,
      isValid: false,
      snapshot: {
        auth: { status: "unauthenticated", loginUrl: "/login" },
        version: { status: "supported" },
      },
    });
  });
});

describe("injection cooldown storage", () => {
  it("preserves cooldowns when different platforms are marked concurrently", async () => {
    installDelayedChromeStorage({});

    await Promise.all([
      markInjectionCooldown("tradingview", 1000),
      markInjectionCooldown("fxreplay", 1000),
    ]);

    await expect(isInjectionCooldownActive("tradingview", 1001)).resolves.toBe(true);
    await expect(isInjectionCooldownActive("fxreplay", 1001)).resolves.toBe(true);
  });
});

describe("popup navigation auto access skip storage", () => {
  it("consumes a recent popup navigation skip only once", async () => {
    installImmediateChromeStorage({});

    await markPopupNavigationAutoAccessSkip("tradingview", 1_000);

    await expect(consumePopupNavigationAutoAccessSkip("tradingview", 1_001)).resolves.toBe(
      true,
    );
    await expect(consumePopupNavigationAutoAccessSkip("tradingview", 1_002)).resolves.toBe(
      false,
    );
  });

  it("does not consume expired popup navigation skip markers as active", async () => {
    installImmediateChromeStorage({});

    await markPopupNavigationAutoAccessSkip("tradingview", 1_000);

    await expect(consumePopupNavigationAutoAccessSkip("tradingview", 31_001)).resolves.toBe(
      false,
    );
  });
});

function installImmediateChromeStorage(storageValues: ChromeStorageValues) {
  globalThis.chrome = {
    storage: {
      local: {
        get: vi.fn((key: string) => Promise.resolve({ [key]: storageValues[key] })),
        remove: vi.fn((key: string) => {
          delete storageValues[key];

          return Promise.resolve();
        }),
        set: vi.fn((values: ChromeStorageValues) => {
          Object.assign(storageValues, values);

          return Promise.resolve();
        }),
      },
    },
  } as unknown as typeof chrome;
}
