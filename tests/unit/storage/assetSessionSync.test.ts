import { beforeEach, describe, expect, it, vi } from "vitest";

describe("asset session sync storage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("serializes concurrent entry updates without losing sibling platform state", async () => {
    const assetSessionSync = await import("@/lib/storage/assetSessionSync");

    await Promise.all([
      assetSessionSync.updateAssetSessionSyncEntry("tradingview", (entry) => ({
        ...entry,
        revision: "extr1_tv",
        status: "success",
      })),
      assetSessionSync.updateAssetSessionSyncEntry("fxtester", (entry) => ({
        ...entry,
        revision: "extr1_ft",
        status: "success",
      })),
    ]);

    await expect(assetSessionSync.readAssetSessionSyncState()).resolves.toMatchObject({
      fxtester: {
        revision: "extr1_ft",
        status: "success",
      },
      tradingview: {
        revision: "extr1_tv",
        status: "success",
      },
    });
  });
});
