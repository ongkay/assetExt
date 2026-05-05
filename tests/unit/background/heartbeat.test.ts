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
    windowId: 1,
    url,
  };
}

const assetTabs = [
  createTab(101, "https://www.tradingview.com/chart/"),
  createTab(102, "https://fxreplay.com/"),
  createTab(103, "https://forextester.com/"),
  createTab(104, "https://www.tradingview.com/chart/abc"),
  createTab(105, "https://fxreplay.com/backtest"),
];

type HeartbeatTestRuntime = {
  alarmListener: (alarm: chrome.alarms.Alarm) => void;
  chromeAlarmsClear: ReturnType<typeof vi.fn>;
  chromeAlarmsCreate: ReturnType<typeof vi.fn>;
  heartbeat: typeof import("@/background/core/heartbeat");
  postExtensionHeartbeat: ReturnType<typeof vi.fn>;
  removeTab: (tabId: number) => void;
  tabRemovedListener: ((tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void) | null;
};

describe("background heartbeat", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("uses one global heartbeat alarm no matter how many asset tabs are started", async () => {
    const testRuntime = await importHeartbeatTestRuntime({ tabs: assetTabs });

    await Promise.all(
      assetTabs.map((assetTab) => testRuntime.heartbeat.startHeartbeat(assetTab.id ?? 0, "tradingview")),
    );

    expect(testRuntime.chromeAlarmsCreate).toHaveBeenCalledTimes(1);
    expect(testRuntime.chromeAlarmsCreate).toHaveBeenCalledWith("assetManager.heartbeat", {
      delayInMinutes: 5,
      periodInMinutes: 5,
    });
    expect(testRuntime.postExtensionHeartbeat).toHaveBeenCalledTimes(1);
  });

  it("sends only one heartbeat for each global alarm tick even with many asset tabs", async () => {
    const testRuntime = await importHeartbeatTestRuntime({ tabs: assetTabs });

    testRuntime.alarmListener({ name: "assetManager.heartbeat" } as chrome.alarms.Alarm);

    await vi.waitFor(() => {
      expect(testRuntime.postExtensionHeartbeat).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps global heartbeat running when one of several asset tabs closes", async () => {
    const testRuntime = await importHeartbeatTestRuntime({ tabs: assetTabs });
    const tabRemovedListener = getRegisteredTabRemovedListener(testRuntime);

    testRuntime.removeTab(101);
    tabRemovedListener(101, { isWindowClosing: false, windowId: 1 });

    await vi.waitFor(() => {
      expect(testRuntime.chromeAlarmsClear).not.toHaveBeenCalledWith("assetManager.heartbeat");
    });
  });

  it("stops global heartbeat when the last asset tab closes", async () => {
    const testRuntime = await importHeartbeatTestRuntime({ tabs: [assetTabs[0]] });
    const tabRemovedListener = getRegisteredTabRemovedListener(testRuntime);

    testRuntime.removeTab(101);
    tabRemovedListener(101, { isWindowClosing: false, windowId: 1 });

    await vi.waitFor(() => {
      expect(testRuntime.chromeAlarmsClear).toHaveBeenCalledWith("assetManager.heartbeat");
    });
  });

  it("cleans up legacy per-tab heartbeat alarms without sending heartbeat", async () => {
    const testRuntime = await importHeartbeatTestRuntime({ tabs: assetTabs });

    testRuntime.alarmListener({ name: "assetManager.heartbeat.101" } as chrome.alarms.Alarm);

    await vi.waitFor(() => {
      expect(testRuntime.chromeAlarmsClear).toHaveBeenCalledWith("assetManager.heartbeat.101");
    });
    expect(testRuntime.postExtensionHeartbeat).not.toHaveBeenCalled();
  });
});

function getRegisteredTabRemovedListener(testRuntime: HeartbeatTestRuntime) {
  const tabRemovedListener = testRuntime.tabRemovedListener;

  if (!tabRemovedListener) {
    throw new Error("Tab removed listener was not registered.");
  }

  return tabRemovedListener;
}

async function importHeartbeatTestRuntime({
  tabs,
}: {
  tabs: chrome.tabs.Tab[];
}): Promise<HeartbeatTestRuntime> {
  const openTabs = new Map(tabs.flatMap((tab) => (tab.id ? [[tab.id, tab] as const] : [])));
  const activeAlarmNames = new Set<string>();
  let alarmListener: ((alarm: chrome.alarms.Alarm) => void) | null = null;
  let tabRemovedListener: ((tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void) | null = null;

  vi.doMock("@/background/core/bootstrap", () => ({
    createExtensionApiConfig: vi.fn(() => ({ baseUrl: "http://localhost:3000" })),
  }));
  vi.doMock("@/lib/api/extensionApi", () => ({
    postExtensionHeartbeat: vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, value: { ok: true, timestamp: "now" } }),
    ),
  }));
  vi.doMock("@/lib/storage/deviceIdentity", () => ({
    getOrCreateDeviceId: vi.fn(() => Promise.resolve("device-1")),
  }));

  const chromeAlarmsClear = vi.fn((alarmName: string) => {
    activeAlarmNames.delete(alarmName);

    return Promise.resolve(true);
  });
  const chromeAlarmsCreate = vi.fn((alarmName: string) => {
    activeAlarmNames.add(alarmName);

    return Promise.resolve();
  });

  globalThis.chrome = {
    alarms: {
      clear: chromeAlarmsClear,
      create: chromeAlarmsCreate,
      get: vi.fn((alarmName: string) =>
        Promise.resolve(
          activeAlarmNames.has(alarmName) ? ({ name: alarmName } as chrome.alarms.Alarm) : undefined,
        ),
      ),
      getAll: vi.fn(() =>
        Promise.resolve(
          Array.from(activeAlarmNames).map((alarmName) => ({ name: alarmName }) as chrome.alarms.Alarm),
        ),
      ),
      onAlarm: {
        addListener: vi.fn((listener: (alarm: chrome.alarms.Alarm) => void) => {
          alarmListener = listener;
        }),
      },
    },
    tabs: {
      get: vi.fn((tabId: number) => {
        const tab = openTabs.get(tabId);

        if (!tab) {
          return Promise.reject(new Error("No tab"));
        }

        return Promise.resolve(tab);
      }),
      onRemoved: {
        addListener: vi.fn((listener: (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void) => {
          tabRemovedListener = listener;
        }),
      },
      query: vi.fn(() => Promise.resolve(Array.from(openTabs.values()))),
    },
  } as unknown as typeof chrome;

  const heartbeat = await import("@/background/core/heartbeat");
  const extensionApi = await import("@/lib/api/extensionApi");
  const registeredAlarmListener = alarmListener;

  if (!registeredAlarmListener) {
    throw new Error("Heartbeat alarm listener was not registered.");
  }

  return {
    alarmListener: registeredAlarmListener as (alarm: chrome.alarms.Alarm) => void,
    chromeAlarmsClear,
    chromeAlarmsCreate,
    heartbeat,
    postExtensionHeartbeat: vi.mocked(extensionApi.postExtensionHeartbeat),
    removeTab: (tabId) => openTabs.delete(tabId),
    tabRemovedListener,
  };
}
