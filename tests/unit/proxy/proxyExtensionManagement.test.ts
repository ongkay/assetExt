import { beforeEach, describe, expect, it, vi } from "vitest";

describe("proxy extension management", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("returns enabled proxy extensions with manageable items first", async () => {
    installManagementChromeStub({
      managedExtensions: [
        createManagedExtension({
          id: "asset-manager-extension",
          name: "Asset Manager",
        }),
        createManagedExtension({
          enabled: false,
          id: "disabled-proxy",
          name: "Disabled Proxy",
        }),
        createManagedExtension({
          id: "manual-proxy",
          installType: "admin",
          mayDisable: false,
          name: "Manual Proxy",
        }),
        createManagedExtension({
          iconUrl: "chrome-extension://fast-proxy/icon.png",
          id: "fast-proxy",
          mayDisable: true,
          name: "Fast Proxy",
        }),
        createManagedExtension({
          id: "theme-extension",
          name: "Theme Extension",
          permissions: ["storage"],
        }),
      ],
    });

    const proxyExtensionManagement = await import("@/lib/proxy/proxyExtensionManagement");

    await expect(proxyExtensionManagement.readProxyExtensionCandidates()).resolves.toEqual([
      {
        iconUrl: "chrome-extension://fast-proxy/icon.png",
        id: "fast-proxy",
        installType: "normal",
        mayDisable: true,
        name: "Fast Proxy",
      },
      {
        iconUrl: null,
        id: "manual-proxy",
        installType: "admin",
        mayDisable: false,
        name: "Manual Proxy",
      },
    ]);
  });

  it("delegates disable requests to chrome.management.setEnabled", async () => {
    const chromeRuntime = installManagementChromeStub();
    const proxyExtensionManagement = await import("@/lib/proxy/proxyExtensionManagement");

    await expect(
      proxyExtensionManagement.disableManagedExtension("proxy-extension"),
    ).resolves.toBeUndefined();

    expect(chromeRuntime.managementSetEnabled).toHaveBeenCalledWith(
      "proxy-extension",
      false,
      expect.any(Function),
    );
  });
});

function installManagementChromeStub(options?: { managedExtensions?: chrome.management.ExtensionInfo[] }) {
  const managedExtensions = options?.managedExtensions ?? [];
  const managementGetAll = vi.fn((callback: (extensions: chrome.management.ExtensionInfo[]) => void) => {
    callback(managedExtensions);
  });
  const managementSetEnabled = vi.fn((_id: string, _enabled: boolean, callback: (() => void) | undefined) => {
    callback?.();
  });

  vi.stubGlobal("chrome", {
    management: {
      getAll: managementGetAll,
      setEnabled: managementSetEnabled,
    },
    runtime: {
      id: "asset-manager-extension",
      lastError: undefined,
    },
  });

  return {
    managementGetAll,
    managementSetEnabled,
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
