import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearPendingTvOwnedLayoutIntent,
  createOwnedTvLayoutFromChartUrl,
  isFreshTvPendingLayoutIntent,
  readTvOwnedLayout,
  readTvOwnedLayoutState,
  rememberTvOwnedLayout,
  removeTvOwnedLayout,
  renameTvOwnedLayout,
  resolveLastOpenedTvOwnedLayoutUrl,
  setLastOpenedTvOwnedLayout,
  setPendingTvOwnedLayoutIntent,
  tvOwnedLayoutsStorageKey,
  upsertTvOwnedLayout,
} from "@/lib/storage/tvOwnedLayouts";

const originalChrome = globalThis.chrome;
const publicId = "50975";

describe("tv owned layouts storage", () => {
  const storageValues: Record<string, unknown> = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();

    for (const storageKey of Object.keys(storageValues)) {
      delete storageValues[storageKey];
    }

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
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    globalThis.chrome = originalChrome;
  });

  it("stores layouts by chart id and resolves the last opened url", async () => {
    const firstLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/AAA111/", "Layout A");
    const secondLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/BBB222/", "Layout B");

    expect(firstLayout).not.toBeNull();
    expect(secondLayout).not.toBeNull();

    await upsertTvOwnedLayout(publicId, firstLayout!);
    await upsertTvOwnedLayout(publicId, secondLayout!);

    await expect(resolveLastOpenedTvOwnedLayoutUrl(publicId)).resolves.toBe("https://www.tradingview.com/chart/BBB222/");
    await expect(readTvOwnedLayout(publicId, "AAA111")).resolves.toMatchObject({ title: "Layout A" });
  });

  it("renames layouts, preserves the newest version, and resets to default after deleting last opened", async () => {
    const oldLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/AAA111/", "Layout Lama", 10);
    const latestLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/AAA111/", "Layout Baru", 20);
    const secondLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/CCC333/", "Layout Kedua", 30);

    expect(oldLayout).not.toBeNull();
    expect(latestLayout).not.toBeNull();
    expect(secondLayout).not.toBeNull();

    await upsertTvOwnedLayout(publicId, oldLayout!);
    await upsertTvOwnedLayout(publicId, latestLayout!);
    await upsertTvOwnedLayout(publicId, secondLayout!);
    await setLastOpenedTvOwnedLayout(publicId, "AAA111");
    await renameTvOwnedLayout(publicId, "AAA111", "Layout Final", 40);

    await expect(readTvOwnedLayout(publicId, "AAA111")).resolves.toMatchObject({
      title: "Layout Final",
      url: "https://www.tradingview.com/chart/AAA111/",
    });

    await removeTvOwnedLayout(publicId, "AAA111");

    await expect(resolveLastOpenedTvOwnedLayoutUrl(publicId)).resolves.toBe("https://www.tradingview.com/chart/ceqTNBkY/");
  });

  it("stores pending create intent and clears it cleanly", async () => {
    await setPendingTvOwnedLayoutIntent(publicId, {
      createdAt: 100,
      kind: "create",
      sourceChartId: "AAA111",
      title: "Layout Baru",
    });

    const storedState = await readTvOwnedLayoutState(publicId);

    expect(storedState.pendingIntent).toEqual({
      createdAt: 100,
      kind: "create",
      sourceChartId: "AAA111",
      title: "Layout Baru",
    });
    expect(isFreshTvPendingLayoutIntent(storedState.pendingIntent, 100 + 19_999)).toBe(true);
    expect(isFreshTvPendingLayoutIntent(storedState.pendingIntent, 100 + 20_001)).toBe(false);

    await clearPendingTvOwnedLayoutIntent(publicId);

    await expect(readTvOwnedLayoutState(publicId)).resolves.toMatchObject({ pendingIntent: null });
  });

  it("remembers dialog rows without changing last opened layout", async () => {
    const openedLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/AAA111/", "Layout A", 50);
    const rememberedLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/BBB222/", "Layout B", 10);

    expect(openedLayout).not.toBeNull();
    expect(rememberedLayout).not.toBeNull();

    await upsertTvOwnedLayout(publicId, openedLayout!);
    await rememberTvOwnedLayout(publicId, rememberedLayout!);

    await expect(readTvOwnedLayoutState(publicId)).resolves.toEqual({
      lastOpenedChartId: "AAA111",
      layouts: [
        {
          chartId: "AAA111",
          title: "Layout A",
          updatedAt: 50,
          url: "https://www.tradingview.com/chart/AAA111/",
        },
        {
          chartId: "BBB222",
          title: "Layout B",
          updatedAt: 10,
          url: "https://www.tradingview.com/chart/BBB222/",
        },
      ],
      pendingIntent: null,
    });
  });

  it("persists data under the dedicated storage key", async () => {
    const ownedLayout = createOwnedTvLayoutFromChartUrl("https://www.tradingview.com/chart/DDD444/", "Layout D");

    expect(ownedLayout).not.toBeNull();

    await upsertTvOwnedLayout(publicId, ownedLayout!);

    expect(storageValues[tvOwnedLayoutsStorageKey]).toEqual({
      [publicId]: {
        lastOpenedChartId: "DDD444",
        layouts: [
          {
            chartId: "DDD444",
            title: "Layout D",
            updatedAt: expect.any(Number),
            url: "https://www.tradingview.com/chart/DDD444/",
          },
        ],
        pendingIntent: null,
      },
    });
  });
});
