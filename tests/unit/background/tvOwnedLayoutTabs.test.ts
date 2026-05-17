import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";
import { bootstrapCacheStorageKey } from "@/lib/storage/bootstrapCache";
import {
  confirmTradingViewOwnedLayoutPage,
  rememberTradingViewOwnedLayoutCreateCandidateTab,
  resolveRestrictedTradingViewRouteStatus,
  submitTradingViewOwnedLayoutOperation,
} from "@/background/core/tvOwnedLayoutController";
import { createOwnedTvLayoutFromChartUrl, readTvOwnedLayoutState, upsertTvOwnedLayout } from "@/lib/storage/tvOwnedLayouts";

const originalChrome = globalThis.chrome;

const restrictedBootstrapCache: BootstrapCacheRecord = {
  fetchedAt: 1,
  isValid: true,
  snapshot: {
    assets: [{ mode: "share", platform: "tradingview" }],
    auth: { status: "authenticated" },
    user: {
      avatarUrl: null,
      email: "user@example.com",
      publicId: "50975",
      username: "user",
    },
    version: { status: "supported" },
  },
};

describe("background tv owned layout tabs", () => {
  const storageValues: Record<string, unknown> = {};

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    for (const storageKey of Object.keys(storageValues)) {
      delete storageValues[storageKey];
    }

    storageValues[bootstrapCacheStorageKey] = restrictedBootstrapCache;

    globalThis.chrome = {
      storage: {
        local: {
          get: vi.fn((key: string) => Promise.resolve({ [key]: storageValues[key] })),
          set: vi.fn((values: Record<string, unknown>) => {
            Object.assign(storageValues, values);

            return Promise.resolve();
          }),
        },
      },
      tabs: {
        create: vi.fn(() => Promise.resolve({ id: 999 } as chrome.tabs.Tab)),
        onCreated: {
          addListener: vi.fn(),
        },
        onUpdated: {
          addListener: vi.fn(),
        },
      },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.chrome = originalChrome;
  });

  it("resolves popup target to the last opened owned chart", async () => {
    const ownedLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/OWN123/", "Layout Sendiri");

    expect(ownedLayout).not.toBeNull();

    await upsertTvOwnedLayout("50975", ownedLayout!);

    const tvOwnedLayoutTabs = await import("@/background/core/tvOwnedLayoutTabs");

    await expect(tvOwnedLayoutTabs.resolveTradingViewAssetTargetUrl()).resolves.toBe(
      "https://www.tradingview.com/chart/OWN123/",
    );
  });

  it("redirects non chart tradingview pages to the last opened owned chart", async () => {
    const ownedLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/OWN123/", "Layout Sendiri");

    expect(ownedLayout).not.toBeNull();

    await upsertTvOwnedLayout("50975", ownedLayout!);

    const tvOwnedLayoutTabs = await import("@/background/core/tvOwnedLayoutTabs");

    await expect(
      tvOwnedLayoutTabs.resolveRestrictedTradingViewRedirectUrl(
        "https://www.tradingview.com/pricing/",
      ),
    ).resolves.toBe("https://www.tradingview.com/chart/OWN123/");
  });

  it("allows stored owned charts and the default chart", async () => {
    const ownedLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/OWN123/", "Layout Sendiri");

    expect(ownedLayout).not.toBeNull();

    await upsertTvOwnedLayout("50975", ownedLayout!);

    const tvOwnedLayoutTabs = await import("@/background/core/tvOwnedLayoutTabs");

    await expect(
      tvOwnedLayoutTabs.resolveRestrictedTradingViewRedirectUrl(
        "https://www.tradingview.com/chart/OWN123/",
        undefined,
        11,
      ),
    ).resolves.toBeNull();
    await expect(
      tvOwnedLayoutTabs.resolveRestrictedTradingViewRedirectUrl(
        "https://www.tradingview.com/chart/ceqTNBkY/",
        undefined,
        11,
      ),
    ).resolves.toBeNull();
  });

  it("redirects foreign charts unless a fresh create intent exists", async () => {
    const ownedLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/OWN123/", "Layout Sendiri");

    expect(ownedLayout).not.toBeNull();

    await upsertTvOwnedLayout("50975", ownedLayout!);

    const tvOwnedLayoutTabs = await import("@/background/core/tvOwnedLayoutTabs");

    await expect(
      tvOwnedLayoutTabs.resolveRestrictedTradingViewRedirectUrl(
        "https://www.tradingview.com/chart/FOREIGN1/",
        undefined,
        11,
      ),
    ).resolves.toBe("https://www.tradingview.com/chart/OWN123/");

    await submitTradingViewOwnedLayoutOperation({
      expectedTitle: "Layout Baru",
      kind: "create",
      openInNewTab: false,
      originTabId: 11,
      publicId: "50975",
      sourceChartId: "OWN123",
    });

    await expect(
      tvOwnedLayoutTabs.resolveRestrictedTradingViewRedirectUrl(
        "https://www.tradingview.com/chart/FOREIGN1/",
        11,
      ),
    ).resolves.toBeNull();
  });

  it("does not bind a same-tab create operation to a child tab", async () => {
    const ownedLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/OWN123/", "Layout Sendiri");

    expect(ownedLayout).not.toBeNull();

    await upsertTvOwnedLayout("50975", ownedLayout!);

    await submitTradingViewOwnedLayoutOperation({
      expectedTitle: "Layout Baru",
      kind: "create",
      openInNewTab: false,
      originTabId: 11,
      publicId: "50975",
      sourceChartId: "OWN123",
    });

    await expect(
      resolveRestrictedTradingViewRouteStatus(
        "https://www.tradingview.com/chart/FOREIGN1/",
        22,
        11,
      ),
    ).resolves.toMatchObject({
      redirectUrl: "https://www.tradingview.com/chart/OWN123/",
      shouldAllow: false,
    });
  });

  it("does not bind an open-in-new-tab create operation to the origin tab", async () => {
    const ownedLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/OWN123/", "Layout Sendiri");

    expect(ownedLayout).not.toBeNull();

    await upsertTvOwnedLayout("50975", ownedLayout!);

    await submitTradingViewOwnedLayoutOperation({
      expectedTitle: "Layout Baru",
      kind: "create",
      openInNewTab: true,
      originTabId: 11,
      publicId: "50975",
      sourceChartId: "OWN123",
    });

    await expect(
      resolveRestrictedTradingViewRouteStatus(
        "https://www.tradingview.com/chart/FOREIGN1/",
        11,
      ),
    ).resolves.toMatchObject({
      redirectUrl: "https://www.tradingview.com/chart/OWN123/",
      shouldAllow: false,
    });
  });

  it("stores a created layout when TradingView opens it in a child tab", async () => {
    await submitTradingViewOwnedLayoutOperation({
      expectedTitle: "Layout Baru",
      kind: "create",
      openInNewTab: true,
      originTabId: 11,
      publicId: "50975",
      sourceChartId: "OWN123",
    });

    await rememberTradingViewOwnedLayoutCreateCandidateTab(11, 22);

    const routeStatus = await resolveRestrictedTradingViewRouteStatus(
      "https://www.tradingview.com/chart/NEW123/",
      22,
      11,
    );

    expect(routeStatus.redirectUrl).toBeNull();
    expect(routeStatus.currentChartId).toBe("NEW123");
    expect(routeStatus.isPendingOperation).toBe(true);
    expect(routeStatus.pendingOperationKind).toBe("create");

    await confirmTradingViewOwnedLayoutPage({
      chartId: "NEW123",
      publicId: "50975",
      tabId: 22,
      url: "https://www.tradingview.com/chart/NEW123/",
    });

    const ownedLayoutState = await readTvOwnedLayoutState("50975");

    expect(ownedLayoutState.lastOpenedChartId).toBe("NEW123");
    expect(ownedLayoutState.layouts).toEqual([
      expect.objectContaining({
        chartId: "NEW123",
        title: "Layout Baru",
        url: "https://www.tradingview.com/chart/NEW123/",
      }),
    ]);
  });

  it("keeps a child-tab create operation valid after the target tab is bound early", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-16T18:00:00.000Z"));

    await submitTradingViewOwnedLayoutOperation({
      expectedTitle: "Layout Baru",
      kind: "create",
      openInNewTab: true,
      originTabId: 11,
      publicId: "50975",
      sourceChartId: "OWN123",
    });

    vi.setSystemTime(new Date("2026-05-16T18:00:02.000Z"));
    await rememberTradingViewOwnedLayoutCreateCandidateTab(11, 22);

    vi.setSystemTime(new Date("2026-05-16T18:00:16.000Z"));
    const routeStatus = await resolveRestrictedTradingViewRouteStatus(
      "https://www.tradingview.com/chart/NEW123/",
      22,
      11,
    );

    expect(routeStatus.redirectUrl).toBeNull();
    expect(routeStatus.currentChartId).toBe("NEW123");
    expect(routeStatus.isPendingOperation).toBe(true);
    expect(routeStatus.pendingOperationKind).toBe("create");
  });
});
