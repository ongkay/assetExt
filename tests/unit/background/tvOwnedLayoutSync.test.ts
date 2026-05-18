import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";
import type { TvOwnedLayoutState } from "@/lib/storage/tvOwnedLayouts";

describe("background tv owned layout sync", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("hydrates local state from TradingView bootstrap snapshots", async () => {
    const testRuntime = await importTvOwnedLayoutSyncTestRuntime();

    await testRuntime.tvOwnedLayoutSync.hydrateTradingViewOwnedLayoutsFromBootstrapSnapshot({
      assets: [{ mode: "share", platform: "tradingview" }],
      auth: { status: "authenticated" },
      tradingViewOwnedLayouts: {
        lastOpenedAt: "2026-05-17T02:00:00.000Z",
        lastOpenedChartId: "OWN123",
        layouts: [
          {
            chartId: "OWN123",
            title: "Layout Baru",
            updatedAt: "2026-05-17T02:00:00.000Z",
            url: "https://www.tradingview.com/chart/OWN123/",
          },
        ],
      },
      user: {
        avatarUrl: null,
        email: "user@example.com",
        publicId: "MEM-001",
        username: "user",
      },
      version: { status: "supported" },
    });

    expect(testRuntime.getLocalState()).toMatchObject({
      lastOpenedChartId: "OWN123",
      layouts: [expect.objectContaining({ chartId: "OWN123", title: "Layout Baru" })],
    });
  });

  it("uploads snapshots once and skips duplicate sync when fingerprint is unchanged", async () => {
    const testRuntime = await importTvOwnedLayoutSyncTestRuntime();

    await testRuntime.tvOwnedLayoutSync.syncTradingViewOwnedLayouts("manual_refresh");
    await testRuntime.tvOwnedLayoutSync.syncTradingViewOwnedLayouts("manual_refresh");

    expect(testRuntime.postTradingViewOwnedLayoutsSync).toHaveBeenCalledTimes(1);
    expect(testRuntime.postTradingViewOwnedLayoutsSync).toHaveBeenCalledWith(
      expect.objectContaining({ apiBaseUrl: "http://localhost:3000" }),
      expect.objectContaining({
        isAuthoritativeSnapshot: false,
        lastOpenedChartId: "OWN123",
        trigger: "manual_refresh",
      }),
    );
    expect(testRuntime.getSyncState()).toMatchObject({
      lastUploadedFingerprint: expect.any(String),
      publicId: "MEM-001",
      status: "success",
    });
  });

  it("does not mark a newer local snapshot as uploaded before it is actually posted", async () => {
    const testRuntime = await importTvOwnedLayoutSyncTestRuntime({
      useDeferredFirstSync: true,
    });

    const firstSyncPromise = testRuntime.tvOwnedLayoutSync.syncTradingViewOwnedLayouts("tv_page_open");

    await vi.waitFor(() => {
      expect(testRuntime.postTradingViewOwnedLayoutsSync).toHaveBeenCalledTimes(1);
    });

    testRuntime.setLocalState({
      lastOpenedAt: Date.parse("2026-05-17T02:05:00.000Z"),
      lastOpenedChartId: "NEW123",
      layouts: [
        {
          chartId: "NEW123",
          title: "Layout Baru Sekali Lagi",
          updatedAt: Date.parse("2026-05-17T02:05:00.000Z"),
          url: "https://www.tradingview.com/chart/NEW123/",
        },
        ...testRuntime.getLocalState().layouts,
      ],
      pendingIntent: null,
    });

    const secondSyncPromise = testRuntime.tvOwnedLayoutSync.syncTradingViewOwnedLayouts("tv_page_open");

    testRuntime.resolveDeferredFirstSync();

    await firstSyncPromise;
    await secondSyncPromise;

    expect(testRuntime.postTradingViewOwnedLayoutsSync).toHaveBeenCalledTimes(2);
    expect(testRuntime.postTradingViewOwnedLayoutsSync.mock.calls[0]?.[1]).toMatchObject({
      lastOpenedChartId: "OWN123",
      layouts: [expect.objectContaining({ chartId: "OWN123" })],
    });
    expect(testRuntime.postTradingViewOwnedLayoutsSync.mock.calls[1]?.[1]).toMatchObject({
      lastOpenedChartId: "NEW123",
      layouts: expect.arrayContaining([expect.objectContaining({ chartId: "NEW123" })]),
    });

    expect(testRuntime.getSyncStateWrites()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lastUploadedFingerprint: JSON.stringify({
            lastOpenedAt: "2026-05-17T02:00:00.000Z",
            lastOpenedChartId: "OWN123",
            layouts: [
              {
                chartId: "OWN123",
                title: "Layout Baru",
                updatedAt: "2026-05-17T02:00:00.000Z",
                url: "https://www.tradingview.com/chart/OWN123/",
              },
            ],
          }),
          status: "success",
        }),
      ]),
    );
  });

  it("does not let bootstrap hydration resurrect a locally deleted layout while sync is still dirty", async () => {
    const testRuntime = await importTvOwnedLayoutSyncTestRuntime({
      localState: {
        lastOpenedAt: null,
        lastOpenedChartId: null,
        layouts: [],
        pendingIntent: null,
      },
      syncState: {
        lastErrorMessage: null,
        lastSyncedAt: Date.parse("2026-05-17T02:00:00.000Z"),
        lastUploadedFingerprint: JSON.stringify({
          lastOpenedAt: "2026-05-17T02:00:00.000Z",
          lastOpenedChartId: "OWN123",
          layouts: [
            {
              chartId: "OWN123",
              title: "Layout Baru",
              updatedAt: "2026-05-17T02:00:00.000Z",
              url: "https://www.tradingview.com/chart/OWN123/",
            },
          ],
        }),
        publicId: "MEM-001",
        status: "failed",
      },
    });

    await testRuntime.tvOwnedLayoutSync.hydrateTradingViewOwnedLayoutsFromBootstrapSnapshot({
      assets: [{ mode: "share", platform: "tradingview" }],
      auth: { status: "authenticated" },
      tradingViewOwnedLayouts: {
        lastOpenedAt: "2026-05-17T02:00:00.000Z",
        lastOpenedChartId: "OWN123",
        layouts: [
          {
            chartId: "OWN123",
            title: "Layout Baru",
            updatedAt: "2026-05-17T02:00:00.000Z",
            url: "https://www.tradingview.com/chart/OWN123/",
          },
        ],
      },
      user: {
        avatarUrl: null,
        email: "user@example.com",
        publicId: "MEM-001",
        username: "user",
      },
      version: { status: "supported" },
    });

    expect(testRuntime.getLocalState()).toEqual({
      lastOpenedAt: null,
      lastOpenedChartId: null,
      layouts: [],
      pendingIntent: null,
    });
  });
});

async function importTvOwnedLayoutSyncTestRuntime(options?: {
  localState?: TvOwnedLayoutState;
  syncState?: {
    lastErrorMessage: string | null;
    lastSyncedAt: number | null;
    lastUploadedFingerprint: string | null;
    publicId: string | null;
    status: "idle" | "running" | "success" | "failed";
  };
  useDeferredFirstSync?: boolean;
}) {
  const bootstrapCache: BootstrapCacheRecord = {
    fetchedAt: 1,
    isValid: true,
    snapshot: {
      assets: [{ mode: "share", platform: "tradingview" }],
      auth: { status: "authenticated" },
      user: {
        avatarUrl: null,
        email: "user@example.com",
        publicId: "MEM-001",
        username: "user",
      },
      version: { status: "supported" },
    },
  };
  let localState: TvOwnedLayoutState = options?.localState ?? {
    lastOpenedAt: Date.parse("2026-05-17T02:00:00.000Z"),
    lastOpenedChartId: "OWN123",
    layouts: [
      {
        chartId: "OWN123",
        title: "Layout Baru",
        updatedAt: Date.parse("2026-05-17T02:00:00.000Z"),
        url: "https://www.tradingview.com/chart/OWN123/",
      },
    ],
    pendingIntent: null,
  };
  let syncState = options?.syncState ?? {
    lastErrorMessage: null,
    lastSyncedAt: null,
    lastUploadedFingerprint: null,
    publicId: null,
    status: "idle",
  };
  const syncStateWrites: Array<typeof syncState> = [];
  let resolveDeferredFirstSync: (() => void) | null = null;
  let deferredFirstSyncPromise: Promise<unknown> | null = null;

  if (options?.useDeferredFirstSync) {
    deferredFirstSyncPromise = new Promise((resolve) => {
      resolveDeferredFirstSync = () => resolve(undefined);
    });
  }

  vi.stubGlobal("chrome", {
    runtime: {
      getManifest: () => ({ version: "2.0.0" }),
      id: "runtime-id",
    },
  });

  vi.doMock("@/lib/storage/bootstrapCache", () => ({
    readBootstrapCache: vi.fn(() => Promise.resolve(bootstrapCache)),
  }));
  vi.doMock("@/lib/storage/tvOwnedLayoutSyncState", () => ({
    readTvOwnedLayoutSyncState: vi.fn(() => Promise.resolve(syncState)),
    writeTvOwnedLayoutSyncState: vi.fn((nextSyncState: typeof syncState) => {
      syncState = nextSyncState;
      syncStateWrites.push(nextSyncState);
      return Promise.resolve();
    }),
  }));
  vi.doMock("@/lib/storage/tvOwnedLayouts", async (importOriginal) => {
    const originalTvOwnedLayouts = await importOriginal<typeof import("@/lib/storage/tvOwnedLayouts")>();

    return {
      ...originalTvOwnedLayouts,
      mergeTvOwnedLayoutSnapshot: vi.fn((publicId: string, snapshot) => {
        if (publicId !== "MEM-001") {
          return Promise.resolve(localState);
        }

        localState = originalTvOwnedLayouts.mergeTvOwnedLayoutState(
          localState,
          originalTvOwnedLayouts.createTvOwnedLayoutDurableStateFromSnapshot(snapshot),
        );

        return Promise.resolve(localState);
      }),
      readTvOwnedLayoutState: vi.fn(() => Promise.resolve(localState)),
    };
  });
  vi.doMock("@/lib/api/extensionApi", () => ({
    postTradingViewOwnedLayoutsSync: vi.fn(async (_config, requestBody) => {
      if (deferredFirstSyncPromise) {
        const currentDeferredFirstSyncPromise = deferredFirstSyncPromise;

        deferredFirstSyncPromise = null;
        await currentDeferredFirstSyncPromise;
      }

      return {
        ok: true,
        status: 200,
        value: {
          lastOpenedAt: requestBody.lastOpenedAt,
          lastOpenedChartId: requestBody.lastOpenedChartId,
          layouts: requestBody.layouts,
        },
      };
    }),
  }));

  const tvOwnedLayoutSync = await import("@/background/core/tvOwnedLayoutSync");
  const extensionApi = await import("@/lib/api/extensionApi");

  return {
    getLocalState: () => localState,
    getSyncState: () => syncState,
    getSyncStateWrites: () => syncStateWrites,
    postTradingViewOwnedLayoutsSync: vi.mocked(extensionApi.postTradingViewOwnedLayoutsSync),
    resolveDeferredFirstSync: () => resolveDeferredFirstSync?.(),
    setLocalState: (nextLocalState: TvOwnedLayoutState) => {
      localState = nextLocalState;
    },
    tvOwnedLayoutSync,
  };
}
