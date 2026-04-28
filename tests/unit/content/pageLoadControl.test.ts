import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { markRecentAutoAccessReload } from "@/content/autoAccessReloadGuard";
import { prepareManualAutoAccessPageLoad } from "@/content/pageLoadControl";
import { markPopupNavigationAutoAccessSkip } from "@/lib/storage/popupNavigationAutoAccessSkip";

const originalChrome = globalThis.chrome;

describe("content page load control", () => {
  beforeEach(() => {
    sessionStorage.clear();
    installChromeStorage({});
  });

  it("stops the current page load before manual auto access starts", async () => {
    const stopPageLoad = vi.fn();

    await expect(
      prepareManualAutoAccessPageLoad("tradingview", { stopPageLoad }),
    ).resolves.toBe(true);

    expect(stopPageLoad).toHaveBeenCalledTimes(1);
  });

  it("does not stop the final reload after cookies were already injected", async () => {
    const stopPageLoad = vi.fn();
    markRecentAutoAccessReload("tradingview", 1_000);

    await expect(
      prepareManualAutoAccessPageLoad("tradingview", {
        now: 1_001,
        stopPageLoad,
      }),
    ).resolves.toBe(false);

    expect(stopPageLoad).not.toHaveBeenCalled();
  });

  it("does not stop popup-initiated navigation", async () => {
    const stopPageLoad = vi.fn();
    await markPopupNavigationAutoAccessSkip("tradingview", 1_000);

    await expect(
      prepareManualAutoAccessPageLoad("tradingview", {
        now: 1_001,
        stopPageLoad,
      }),
    ).resolves.toBe(false);

    expect(stopPageLoad).not.toHaveBeenCalled();
  });
});

afterEach(() => {
  globalThis.chrome = originalChrome;
});

function installChromeStorage(storageValues: Record<string, unknown>) {
  globalThis.chrome = {
    storage: {
      local: {
        get: vi.fn((key: string) => Promise.resolve({ [key]: storageValues[key] })),
        remove: vi.fn((key: string) => {
          delete storageValues[key];

          return Promise.resolve();
        }),
        set: vi.fn((values: Record<string, unknown>) => {
          Object.assign(storageValues, values);

          return Promise.resolve();
        }),
      },
    },
  } as unknown as typeof chrome;
}
