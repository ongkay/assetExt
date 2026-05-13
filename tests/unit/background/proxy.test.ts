import { beforeEach, describe, expect, it, vi } from "vitest";

describe("background proxy controller", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("applies a PAC script for the TradingView proxy group", async () => {
    const chromeRuntime = installProxyChromeStub();
    const proxyCore = await import("@/background/core/proxy");

    await proxyCore.syncAssetPlatformProxy("tradingview", "http:1.2.3.4:8080", "2026-05-08T10:00:00.000Z");

    expect(chromeRuntime.proxySet).toHaveBeenCalledTimes(1);
    expect(chromeRuntime.proxySet.mock.calls[0]?.[0]).toMatchObject({
      scope: "regular",
      value: {
        mode: "pac_script",
        pacScript: expect.objectContaining({
          data: expect.stringContaining('return "PROXY 1.2.3.4:8080";'),
        }),
      },
    });

    const proxySetDetails = chromeRuntime.proxySet.mock.calls[0]?.[0] as
      | { value?: { pacScript?: { data?: string } } }
      | undefined;
    const pacScript = proxySetDetails?.value?.pacScript?.data ?? "";

    expect(pacScript).toContain('dnsDomainIs(host, "tradingview.com")');
    expect(pacScript).toContain('dnsDomainIs(host, "whoer.net")');
  });

  it("responds to proxy auth challenges with the matching platform credentials", async () => {
    const chromeRuntime = installProxyChromeStub();
    const proxyCore = await import("@/background/core/proxy");

    await proxyCore.syncAssetPlatformProxy(
      "fxtester",
      "socks5:5.6.7.8:1080:proxy-user:proxy-pass",
      "2026-05-08T10:00:00.000Z",
    );

    expect(chromeRuntime.getOnAuthRequiredListener()).not.toBeNull();
    const callback = vi.fn();

    chromeRuntime.getOnAuthRequiredListener()?.(
      {
        isProxy: true,
        requestId: "request-1",
        url: "https://app.browserscan.net/report",
      } as chrome.webRequest.WebAuthenticationChallengeDetails,
      callback,
    );

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith({
        authCredentials: {
          password: "proxy-pass",
          username: "proxy-user",
        },
      });
    });
  });

  it("clears auth request attempts when the proxied request completes", async () => {
    const chromeRuntime = installProxyChromeStub();
    const proxyCore = await import("@/background/core/proxy");

    await proxyCore.syncAssetPlatformProxy(
      "fxtester",
      "socks5:5.6.7.8:1080:proxy-user:proxy-pass",
      "2026-05-08T10:00:00.000Z",
    );

    const callback = vi.fn();

    chromeRuntime.getOnAuthRequiredListener()?.(
      {
        isProxy: true,
        requestId: "request-1",
        url: "https://app.browserscan.net/report",
      } as chrome.webRequest.WebAuthenticationChallengeDetails,
      callback,
    );
    chromeRuntime.getOnAuthRequiredListener()?.(
      {
        isProxy: true,
        requestId: "request-1",
        url: "https://app.browserscan.net/report",
      } as chrome.webRequest.WebAuthenticationChallengeDetails,
      callback,
    );

    await vi.waitFor(() => {
      expect(callback).toHaveBeenNthCalledWith(2, {
        authCredentials: {
          password: "proxy-pass",
          username: "proxy-user",
        },
      });
    });

    chromeRuntime.getOnCompletedListener()?.({
      requestId: "request-1",
    } as chrome.webRequest.WebResponseCacheDetails);

    chromeRuntime.getOnAuthRequiredListener()?.(
      {
        isProxy: true,
        requestId: "request-1",
        url: "https://app.browserscan.net/report",
      } as chrome.webRequest.WebAuthenticationChallengeDetails,
      callback,
    );

    await vi.waitFor(() => {
      expect(callback).toHaveBeenNthCalledWith(3, {
        authCredentials: {
          password: "proxy-pass",
          username: "proxy-user",
        },
      });
    });
  });

  it("clears auth request attempts when the proxied request errors", async () => {
    const chromeRuntime = installProxyChromeStub();
    const proxyCore = await import("@/background/core/proxy");

    await proxyCore.syncAssetPlatformProxy(
      "fxtester",
      "socks5:5.6.7.8:1080:proxy-user:proxy-pass",
      "2026-05-08T10:00:00.000Z",
    );

    const callback = vi.fn();

    chromeRuntime.getOnAuthRequiredListener()?.(
      {
        isProxy: true,
        requestId: "request-2",
        url: "https://app.browserscan.net/report",
      } as chrome.webRequest.WebAuthenticationChallengeDetails,
      callback,
    );
    chromeRuntime.getOnAuthRequiredListener()?.(
      {
        isProxy: true,
        requestId: "request-2",
        url: "https://app.browserscan.net/report",
      } as chrome.webRequest.WebAuthenticationChallengeDetails,
      callback,
    );

    await vi.waitFor(() => {
      expect(callback).toHaveBeenNthCalledWith(2, {
        authCredentials: {
          password: "proxy-pass",
          username: "proxy-user",
        },
      });
    });

    chromeRuntime.getOnErrorOccurredListener()?.({
      requestId: "request-2",
    } as chrome.webRequest.WebResponseErrorDetails);

    chromeRuntime.getOnAuthRequiredListener()?.(
      {
        isProxy: true,
        requestId: "request-2",
        url: "https://app.browserscan.net/report",
      } as chrome.webRequest.WebAuthenticationChallengeDetails,
      callback,
    );

    await vi.waitFor(() => {
      expect(callback).toHaveBeenNthCalledWith(3, {
        authCredentials: {
          password: "proxy-pass",
          username: "proxy-user",
        },
      });
    });
  });

  it("blocks access when proxy settings are controlled elsewhere", async () => {
    const chromeRuntime = installProxyChromeStub({
      initialLevelOfControl: "controlled_by_other_extensions",
      initialValue: { mode: "fixed_servers" },
    });
    const proxyCore = await import("@/background/core/proxy");

    await expect(proxyCore.ensureProxyAccessAvailable()).rejects.toThrow(
      "Proxy lain terdeteksi. Nonaktifkan proxy lain untuk melanjutkan akses asset.",
    );

    expect(chromeRuntime.updateDynamicRules).toHaveBeenCalledWith(
      expect.objectContaining({
        addRules: expect.arrayContaining([
          expect.objectContaining({
            action: expect.objectContaining({ type: "redirect" }),
          }),
          expect.objectContaining({
            action: expect.objectContaining({ type: "block" }),
          }),
        ]),
      }),
    );
  });

  it("captures proxy extension candidates when another extension controls proxy settings", async () => {
    const chromeRuntime = installProxyChromeStub({
      initialLevelOfControl: "controlled_by_other_extensions",
      initialValue: { mode: "fixed_servers" },
      managedExtensions: [
        createManagedExtension({
          id: "asset-manager-extension",
          name: "Asset Manager",
        }),
        createManagedExtension({
          iconUrl: "chrome-extension://proxy-ext/icon-128.png",
          id: "proxy-ext",
          mayDisable: true,
          name: "Proxy Switcher",
        }),
        createManagedExtension({
          id: "corporate-proxy-ext",
          installType: "admin",
          mayDisable: false,
          name: "Corporate Proxy",
        }),
        createManagedExtension({
          enabled: false,
          id: "disabled-proxy-ext",
          name: "Disabled Proxy",
        }),
        createManagedExtension({
          id: "non-proxy-ext",
          name: "Dark Theme",
          permissions: ["storage"],
        }),
      ],
    });
    const proxyCore = await import("@/background/core/proxy");
    const assetProxyState = await import("@/lib/storage/assetProxyState");

    await expect(proxyCore.ensureProxyAccessAvailable()).rejects.toThrow(
      "Proxy lain terdeteksi. Nonaktifkan proxy lain untuk melanjutkan akses asset.",
    );

    await expect(assetProxyState.readAssetProxyState()).resolves.toMatchObject({
      conflict: {
        extensions: [
          {
            iconUrl: "chrome-extension://proxy-ext/icon-128.png",
            id: "proxy-ext",
            installType: "normal",
            mayDisable: true,
            name: "Proxy Switcher",
          },
          {
            iconUrl: null,
            id: "corporate-proxy-ext",
            installType: "admin",
            mayDisable: false,
            name: "Corporate Proxy",
          },
        ],
      },
    });

    expect(chromeRuntime.managementGetAll).toHaveBeenCalled();
  });
});

function installProxyChromeStub(options?: {
  initialLevelOfControl?: chrome.types.ChromeSettingGetResultDetails["levelOfControl"];
  managedExtensions?: chrome.management.ExtensionInfo[];
  initialValue?: unknown;
}) {
  let currentLevelOfControl = options?.initialLevelOfControl ?? "controllable_by_this_extension";
  let currentValue: Record<string, unknown> = (options?.initialValue as
    | Record<string, unknown>
    | undefined) ?? { mode: "system" };
  const managedExtensions = options?.managedExtensions ?? [];
  let onAuthRequiredListener:
    | ((
        details: chrome.webRequest.WebAuthenticationChallengeDetails,
        callback?: (response: chrome.webRequest.BlockingResponse) => void,
      ) => void)
    | null = null;
  let onCompletedListener: ((details: chrome.webRequest.WebResponseCacheDetails) => void) | null = null;
  let onErrorOccurredListener: ((details: chrome.webRequest.WebResponseErrorDetails) => void) | null = null;

  const proxySet = vi.fn((details: { value: unknown }, callback: (() => void) | undefined) => {
    currentLevelOfControl = "controlled_by_this_extension";
    currentValue = details.value as Record<string, unknown>;
    callback?.();
  });
  const proxyClear = vi.fn((_details: unknown, callback: (() => void) | undefined) => {
    currentLevelOfControl = "controllable_by_this_extension";
    currentValue = { mode: "system" };
    callback?.();
  });
  const proxyGet = vi.fn(
    (_details: unknown, callback: (details: chrome.types.ChromeSettingGetResultDetails) => void) => {
      callback({
        levelOfControl: currentLevelOfControl,
        value: currentValue,
      });
    },
  );
  const updateDynamicRules = vi.fn(() => Promise.resolve());
  const tabsQuery = vi.fn(() => Promise.resolve([]));
  const tabsUpdate = vi.fn(() => Promise.resolve());
  const managementGetAll = vi.fn((callback: (extensions: chrome.management.ExtensionInfo[]) => void) => {
    callback(managedExtensions);
  });
  const managementSetEnabled = vi.fn((_id: string, _enabled: boolean, callback: (() => void) | undefined) => {
    callback?.();
  });

  vi.stubGlobal("chrome", {
    declarativeNetRequest: {
      ResourceType: {
        FONT: "font",
        IMAGE: "image",
        MAIN_FRAME: "main_frame",
        MEDIA: "media",
        OBJECT: "object",
        OTHER: "other",
        PING: "ping",
        SCRIPT: "script",
        STYLESHEET: "stylesheet",
        SUB_FRAME: "sub_frame",
        WEBSOCKET: "websocket",
        XMLHTTPREQUEST: "xmlhttprequest",
      },
      RuleActionType: {
        BLOCK: "block",
        REDIRECT: "redirect",
      },
      updateDynamicRules,
    },
    management: {
      getAll: managementGetAll,
      setEnabled: managementSetEnabled,
    },
    proxy: {
      settings: {
        clear: proxyClear,
        get: proxyGet,
        onChange: {
          addListener: vi.fn(),
        },
        set: proxySet,
      },
    },
    runtime: {
      id: "asset-manager-extension",
      getURL: (path: string) => `chrome-extension://runtime-id/${path}`,
      lastError: undefined,
    },
    tabs: {
      query: tabsQuery,
      update: tabsUpdate,
    },
    webRequest: {
      onAuthRequired: {
        addListener: vi.fn((listener) => {
          onAuthRequiredListener = listener;
        }),
      },
      onCompleted: {
        addListener: vi.fn((listener) => {
          onCompletedListener = listener;
        }),
      },
      onErrorOccurred: {
        addListener: vi.fn((listener) => {
          onErrorOccurredListener = listener;
        }),
      },
    },
  });

  return {
    getOnAuthRequiredListener() {
      return onAuthRequiredListener;
    },
    getOnCompletedListener() {
      return onCompletedListener;
    },
    getOnErrorOccurredListener() {
      return onErrorOccurredListener;
    },
    managementGetAll,
    managementSetEnabled,
    proxyClear,
    proxyGet,
    proxySet,
    tabsQuery,
    tabsUpdate,
    updateDynamicRules,
  };
}

function createManagedExtension(
  overrides?: Partial<chrome.management.ExtensionInfo> & { iconUrl?: string | null },
): chrome.management.ExtensionInfo {
  return {
    description: "Test extension",
    enabled: true,
    hostPermissions: [],
    icons: overrides?.iconUrl ? [{ size: 128, url: overrides.iconUrl }] : [],
    id: overrides?.id ?? "proxy-extension",
    installType: overrides?.installType ?? "normal",
    mayDisable: overrides?.mayDisable ?? true,
    name: overrides?.name ?? "Proxy Extension",
    offlineEnabled: false,
    permissions: overrides?.permissions ?? ["proxy", "storage"],
    shortName: overrides?.name ?? "Proxy Extension",
    type: overrides?.type ?? "extension",
    version: "1.0.0",
    ...overrides,
  } as chrome.management.ExtensionInfo;
}
