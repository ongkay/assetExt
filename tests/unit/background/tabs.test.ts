import { beforeEach, describe, expect, it, vi } from "vitest";

function createTab(id: number, url: string): chrome.tabs.Tab {
  return {
    active: true,
    autoDiscardable: true,
    discarded: false,
    groupId: -1,
    highlighted: true,
    id,
    incognito: false,
    index: id,
    pinned: false,
    selected: true,
    url,
    windowId: 1,
  };
}

describe("background tabs peer guard redirect", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("redirects only tradingview and forextester tabs to the warning page", async () => {
    const chromeTabsQuery = vi.fn(() =>
      Promise.resolve([
        createTab(1, "https://www.tradingview.com/chart/"),
        createTab(2, "https://tradingview.com/pricing/"),
        createTab(3, "https://app.forextester.com/dashboard"),
        createTab(4, "https://forextester.com/"),
        createTab(5, "https://whoer.net/"),
        createTab(6, "https://browserscan.net/"),
        createTab(7, "https://example.com/"),
      ] satisfies chrome.tabs.Tab[]),
    );
    const chromeTabsUpdate = vi.fn(() => Promise.resolve({} as chrome.tabs.Tab));

    globalThis.chrome = {
      tabs: {
        query: chromeTabsQuery,
        update: chromeTabsUpdate,
      },
    } as unknown as typeof chrome;

    const tabs = await import("@/background/core/tabs");
    const assetRedirectResult = await tabs.redirectPeerGuardProtectedAssetTabs(
      "chrome-extension://runtime-id/ext-1-blocked.html",
    );

    expect(assetRedirectResult).toEqual({ redirectedTabCount: 4, warningTabId: 1 });
    expect(chromeTabsUpdate).toHaveBeenCalledTimes(4);
    expect(chromeTabsUpdate).toHaveBeenNthCalledWith(1, 1, {
      active: true,
      url: "chrome-extension://runtime-id/ext-1-blocked.html",
    });
    expect(chromeTabsUpdate).toHaveBeenNthCalledWith(2, 2, {
      active: false,
      url: "chrome-extension://runtime-id/ext-1-blocked.html",
    });
    expect(chromeTabsUpdate).toHaveBeenNthCalledWith(3, 3, {
      active: false,
      url: "chrome-extension://runtime-id/ext-1-blocked.html",
    });
    expect(chromeTabsUpdate).toHaveBeenNthCalledWith(4, 4, {
      active: false,
      url: "chrome-extension://runtime-id/ext-1-blocked.html",
    });
  });

  it("focuses the first protected asset tab when none of them is active", async () => {
    const chromeTabsUpdate = vi.fn(() => Promise.resolve({} as chrome.tabs.Tab));

    globalThis.chrome = {
      tabs: {
        query: vi.fn(() =>
          Promise.resolve([
            { ...createTab(20, "https://www.tradingview.com/chart/"), active: false },
            { ...createTab(21, "https://forextester.com/"), active: false },
            createTab(22, "https://example.com/"),
          ] satisfies chrome.tabs.Tab[]),
        ),
        update: chromeTabsUpdate,
      },
    } as unknown as typeof chrome;

    const tabs = await import("@/background/core/tabs");
    const assetRedirectResult = await tabs.redirectPeerGuardProtectedAssetTabs(
      "chrome-extension://runtime-id/ext-1-blocked.html",
    );

    expect(assetRedirectResult).toEqual({ redirectedTabCount: 2, warningTabId: 20 });
    expect(chromeTabsUpdate).toHaveBeenNthCalledWith(1, 20, {
      active: true,
      url: "chrome-extension://runtime-id/ext-1-blocked.html",
    });
    expect(chromeTabsUpdate).toHaveBeenNthCalledWith(2, 21, {
      active: false,
      url: "chrome-extension://runtime-id/ext-1-blocked.html",
    });
  });

  it("does not treat whoer or browserscan as protected asset tabs", async () => {
    const chromeTabsUpdate = vi.fn(() => Promise.resolve({} as chrome.tabs.Tab));

    globalThis.chrome = {
      tabs: {
        query: vi.fn(() =>
          Promise.resolve([
            createTab(10, "https://whoer.net/"),
            createTab(11, "https://www.browserscan.net/"),
          ] satisfies chrome.tabs.Tab[]),
        ),
        update: chromeTabsUpdate,
      },
    } as unknown as typeof chrome;

    const tabs = await import("@/background/core/tabs");
    const assetRedirectResult = await tabs.redirectPeerGuardProtectedAssetTabs(
      "chrome-extension://runtime-id/ext-2-blocked.html",
    );

    expect(assetRedirectResult).toEqual({ redirectedTabCount: 0, warningTabId: null });
    expect(chromeTabsUpdate).not.toHaveBeenCalled();
    expect(tabs.isPeerGuardProtectedAssetHostname("whoer.net")).toBe(false);
    expect(tabs.isPeerGuardProtectedAssetHostname("browserscan.net")).toBe(false);
  });
});
