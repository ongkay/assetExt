import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildExtensionTradingViewOwnedLayoutsSnapshot,
  clearPendingTvOwnedLayoutIntent,
  createTvOwnedLayoutDurableStateFromSnapshot,
  createOwnedTvLayoutFromChartUrl,
  isFreshTvPendingLayoutIntent,
  mergeTvOwnedLayoutState,
  readTvOwnedLayout,
  readTvOwnedLayoutState,
  rememberTvOwnedLayout,
  mergeTvOwnedLayoutSnapshot,
  removeTvOwnedLayout,
  renameTvOwnedLayout,
  resolveLastOpenedTvOwnedLayoutUrl,
  resolveLastOpenedTvOwnedLayoutUrlWithFallback,
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
    const firstLayout = createOwnedTvLayoutFromChartUrl(
      "https://www.tradingview.com/chart/AAA111/",
      "Layout A",
    );
    const secondLayout = createOwnedTvLayoutFromChartUrl(
      "https://www.tradingview.com/chart/BBB222/",
      "Layout B",
    );

    expect(firstLayout).not.toBeNull();
    expect(secondLayout).not.toBeNull();

    await upsertTvOwnedLayout(publicId, firstLayout!);
    await upsertTvOwnedLayout(publicId, secondLayout!);

    await expect(resolveLastOpenedTvOwnedLayoutUrl(publicId)).resolves.toBe(
      "https://www.tradingview.com/chart/BBB222/",
    );
    await expect(readTvOwnedLayoutState(publicId)).resolves.toMatchObject({
      lastOpenedAt: expect.any(Number),
      lastOpenedChartId: "BBB222",
    });
    await expect(readTvOwnedLayout(publicId, "AAA111")).resolves.toMatchObject({ title: "Layout A" });
  });

  it("renames layouts, preserves the newest version, and resets to default after deleting last opened", async () => {
    const oldLayout = createOwnedTvLayoutFromChartUrl(
      "https://www.tradingview.com/chart/AAA111/",
      "Layout Lama",
      10,
    );
    const latestLayout = createOwnedTvLayoutFromChartUrl(
      "https://www.tradingview.com/chart/AAA111/",
      "Layout Baru",
      20,
    );
    const secondLayout = createOwnedTvLayoutFromChartUrl(
      "https://www.tradingview.com/chart/CCC333/",
      "Layout Kedua",
      30,
    );

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

    await expect(resolveLastOpenedTvOwnedLayoutUrl(publicId)).resolves.toBe(
      "https://www.tradingview.com/chart/ceqTNBkY/",
    );
    await expect(readTvOwnedLayoutState(publicId)).resolves.toMatchObject({
      lastOpenedAt: null,
      lastOpenedChartId: null,
      layouts: [expect.objectContaining({ chartId: "CCC333", title: "Layout Kedua" })],
    });
  });

  it("falls back to a provided launch url before using the hardcoded default", async () => {
    await expect(
      resolveLastOpenedTvOwnedLayoutUrlWithFallback(publicId, "https://www.tradingview.com/chart/FALL999/"),
    ).resolves.toBe("https://www.tradingview.com/chart/FALL999/");
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
    const openedLayout = createOwnedTvLayoutFromChartUrl(
      "https://www.tradingview.com/chart/AAA111/",
      "Layout A",
      50,
    );
    const rememberedLayout = createOwnedTvLayoutFromChartUrl(
      "https://www.tradingview.com/chart/BBB222/",
      "Layout B",
      10,
    );

    expect(openedLayout).not.toBeNull();
    expect(rememberedLayout).not.toBeNull();

    await upsertTvOwnedLayout(publicId, openedLayout!);
    await rememberTvOwnedLayout(publicId, rememberedLayout!);

    await expect(readTvOwnedLayoutState(publicId)).resolves.toEqual({
      lastOpenedAt: expect.any(Number),
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
    const ownedLayout = createOwnedTvLayoutFromChartUrl(
      "https://www.tradingview.com/chart/DDD444/",
      "Layout D",
    );

    expect(ownedLayout).not.toBeNull();

    await upsertTvOwnedLayout(publicId, ownedLayout!);

    expect(storageValues[tvOwnedLayoutsStorageKey]).toEqual({
      [publicId]: {
        lastOpenedAt: expect.any(Number),
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

  it("merges remote active snapshots without overwriting fresher local layouts", async () => {
    const localLayout = createOwnedTvLayoutFromChartUrl(
      "https://www.tradingview.com/chart/OWN123/",
      "Local Layout",
      Date.parse("2026-05-17T02:10:00.000Z"),
    );

    expect(localLayout).not.toBeNull();

    await upsertTvOwnedLayout(publicId, localLayout!, Date.parse("2026-05-17T02:15:00.000Z"));
    await mergeTvOwnedLayoutSnapshot(publicId, {
      lastOpenedAt: "2026-05-17T02:05:00.000Z",
      lastOpenedChartId: "OLD111",
      layouts: [
        {
          chartId: "OLD111",
          title: "Server Layout",
          updatedAt: "2026-05-17T02:00:00.000Z",
          url: "https://www.tradingview.com/chart/OLD111/",
        },
      ],
    });

    await expect(readTvOwnedLayoutState(publicId)).resolves.toMatchObject({
      lastOpenedChartId: "OWN123",
      layouts: [
        expect.objectContaining({ chartId: "OWN123", title: "Local Layout" }),
        expect.objectContaining({ chartId: "OLD111", title: "Server Layout" }),
      ],
    });
  });

  it("builds and merges durable snapshots deterministically", () => {
    const mergedState = mergeTvOwnedLayoutState(
      {
        lastOpenedAt: Date.parse("2026-05-17T02:10:00.000Z"),
        lastOpenedChartId: "OWN123",
        layouts: [
          {
            chartId: "OWN123",
            title: "Local",
            updatedAt: Date.parse("2026-05-17T02:10:00.000Z"),
            url: "https://www.tradingview.com/chart/OWN123/",
          },
        ],
        pendingIntent: null,
      },
      createTvOwnedLayoutDurableStateFromSnapshot({
        lastOpenedAt: "2026-05-17T02:12:00.000Z",
        lastOpenedChartId: "NEW123",
        layouts: [
          {
            chartId: "NEW123",
            title: "Remote",
            updatedAt: "2026-05-17T02:12:00.000Z",
            url: "https://www.tradingview.com/chart/NEW123/",
          },
        ],
      }),
    );

    expect(buildExtensionTradingViewOwnedLayoutsSnapshot(mergedState)).toEqual({
      lastOpenedAt: "2026-05-17T02:12:00.000Z",
      lastOpenedChartId: "NEW123",
      layouts: [
        {
          chartId: "NEW123",
          title: "Remote",
          updatedAt: "2026-05-17T02:12:00.000Z",
          url: "https://www.tradingview.com/chart/NEW123/",
        },
        {
          chartId: "OWN123",
          title: "Local",
          updatedAt: "2026-05-17T02:10:00.000Z",
          url: "https://www.tradingview.com/chart/OWN123/",
        },
      ],
    });
  });

  it("keeps a valid local last opened chart when incoming last opened chart is missing from layouts", () => {
    const mergedState = mergeTvOwnedLayoutState(
      {
        lastOpenedAt: Date.parse("2026-05-17T02:10:00.000Z"),
        lastOpenedChartId: "OWN123",
        layouts: [
          {
            chartId: "OWN123",
            title: "Local",
            updatedAt: Date.parse("2026-05-17T02:10:00.000Z"),
            url: "https://www.tradingview.com/chart/OWN123/",
          },
        ],
        pendingIntent: null,
      },
      createTvOwnedLayoutDurableStateFromSnapshot({
        lastOpenedAt: "2026-05-17T02:12:00.000Z",
        lastOpenedChartId: "REMOVED123",
        layouts: [],
      }),
    );

    expect(mergedState).toMatchObject({
      lastOpenedAt: Date.parse("2026-05-17T02:10:00.000Z"),
      lastOpenedChartId: "OWN123",
    });
  });
});
