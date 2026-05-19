import { beforeEach, describe, expect, it, vi } from "vitest";

import { ext2ExtensionId } from "@/lib/peer-guard/peerGuardConfig";

describe("cookie extension management", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("returns enabled cookies extensions outside the internal allowlist", async () => {
    installManagementChromeStub({
      managedExtensions: [
        createManagedExtension({
          id: "asset-manager-extension",
          name: "Asset Manager",
        }),
        createManagedExtension({
          id: ext2ExtensionId,
          name: "Asset Manager ext-2",
        }),
        createManagedExtension({
          iconUrl: "chrome-extension://cookie-ext/icon.png",
          id: "cookie-ext",
          mayDisable: true,
          name: "Cookie Spy",
        }),
        createManagedExtension({
          id: "admin-cookie-ext",
          installType: "admin",
          mayDisable: false,
          name: "Corporate Cookie Tool",
        }),
        createManagedExtension({
          enabled: false,
          id: "disabled-cookie-ext",
          name: "Disabled Cookie Tool",
        }),
        createManagedExtension({
          id: "non-cookie-ext",
          name: "Dark Theme",
          permissions: ["storage"],
        }),
      ],
    });

    const cookieExtensionManagement = await import("@/lib/cookie-guard/cookieExtensionManagement");

    await expect(cookieExtensionManagement.readCookieGuardExtensionCandidates()).resolves.toEqual([
      {
        iconUrl: "chrome-extension://cookie-ext/icon.png",
        id: "cookie-ext",
        installType: "normal",
        mayDisable: true,
        name: "Cookie Spy",
      },
      {
        iconUrl: null,
        id: "admin-cookie-ext",
        installType: "admin",
        mayDisable: false,
        name: "Corporate Cookie Tool",
      },
    ]);
  });
});

function installManagementChromeStub(options?: { managedExtensions?: chrome.management.ExtensionInfo[] }) {
  const managedExtensions = options?.managedExtensions ?? [];
  const managementGetAll = vi.fn((callback: (extensions: chrome.management.ExtensionInfo[]) => void) => {
    callback(managedExtensions);
  });

  vi.stubGlobal("chrome", {
    management: {
      getAll: managementGetAll,
    },
    runtime: {
      id: "asset-manager-extension",
      lastError: undefined,
    },
  });

  return {
    managementGetAll,
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
    id: overrides?.id ?? "cookie-extension",
    installType: overrides?.installType ?? "normal",
    mayDisable: overrides?.mayDisable ?? true,
    name: overrides?.name ?? "Cookie Extension",
    offlineEnabled: false,
    permissions: overrides?.permissions ?? ["cookies", "storage"],
    shortName: overrides?.name ?? "Cookie Extension",
    type: overrides?.type ?? "extension",
    version: "1.0.0",
    ...overrides,
  } as chrome.management.ExtensionInfo;
}
