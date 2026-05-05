import { beforeEach, describe, expect, it, vi } from "vitest";

describe("production origin header rule", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("installs a dynamic Origin rule when production header mode is active", async () => {
    vi.doMock("@/lib/api/extensionApiConfig", () => ({
      getExtensionApiBaseUrl: () => "http://localhost:3000",
      isDev: false,
    }));
    const updateDynamicRules = vi.fn(() => Promise.resolve());
    vi.stubGlobal("chrome", {
      declarativeNetRequest: {
        HeaderOperation: { SET: "set" },
        ResourceType: { XMLHTTPREQUEST: "xmlhttprequest" },
        RuleActionType: { MODIFY_HEADERS: "modifyHeaders" },
        updateDynamicRules,
      },
      runtime: { id: "runtime-id" },
    });

    const { syncProductionOriginHeaderRule } = await import("@/background/core/productionOrigin");

    await syncProductionOriginHeaderRule();

    expect(updateDynamicRules).toHaveBeenCalledWith({
      addRules: [
        expect.objectContaining({
          action: {
            requestHeaders: [
              {
                header: "Origin",
                operation: "set",
                value: "chrome-extension://runtime-id",
              },
            ],
            type: "modifyHeaders",
          },
          condition: expect.objectContaining({
            regexFilter: "^http://localhost:3000/api/ext/",
            resourceTypes: ["xmlhttprequest"],
          }),
          id: 1001,
          priority: 1,
        }),
      ],
      removeRuleIds: [1001],
    });
  });

  it("reuses the same production Origin sync while the first install is in flight", async () => {
    vi.doMock("@/lib/api/extensionApiConfig", () => ({
      getExtensionApiBaseUrl: () => "http://localhost:3000",
      isDev: false,
    }));

    let releaseSync!: () => void;
    const pendingSync = new Promise<void>((resolve) => {
      releaseSync = resolve;
    });
    const updateDynamicRules = vi.fn(() => pendingSync);

    vi.stubGlobal("chrome", {
      declarativeNetRequest: {
        HeaderOperation: { SET: "set" },
        ResourceType: { XMLHTTPREQUEST: "xmlhttprequest" },
        RuleActionType: { MODIFY_HEADERS: "modifyHeaders" },
        updateDynamicRules,
      },
      runtime: { id: "runtime-id" },
    });

    const { ensureProductionOriginHeaderRuleReady } = await import("@/background/core/productionOrigin");

    const firstSync = ensureProductionOriginHeaderRuleReady();
    const secondSync = ensureProductionOriginHeaderRuleReady();

    expect(updateDynamicRules).toHaveBeenCalledTimes(1);

    releaseSync();
    await Promise.all([firstSync, secondSync]);
    await ensureProductionOriginHeaderRuleReady();

    expect(updateDynamicRules).toHaveBeenCalledTimes(1);
  });

  it("removes the dynamic Origin rule when dev header mode is active", async () => {
    vi.doMock("@/lib/api/extensionApiConfig", () => ({
      getExtensionApiBaseUrl: () => "http://localhost:3000",
      isDev: true,
    }));
    const updateDynamicRules = vi.fn(() => Promise.resolve());
    vi.stubGlobal("chrome", {
      declarativeNetRequest: { updateDynamicRules },
      runtime: { id: "runtime-id" },
    });

    const { syncProductionOriginHeaderRule } = await import("@/background/core/productionOrigin");

    await syncProductionOriginHeaderRule();

    expect(updateDynamicRules).toHaveBeenCalledWith({ removeRuleIds: [1001] });
  });
});
