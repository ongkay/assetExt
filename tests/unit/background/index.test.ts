import { beforeEach, describe, expect, it, vi } from "vitest";

import { runtimeMessageType, type RuntimeMessage, type RuntimeResponse } from "@/lib/runtime/messages";

describe("background runtime refresh flow", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("syncs local owned layouts before refreshing bootstrap from popup", async () => {
    const callOrder: string[] = [];
    const syncTradingViewOwnedLayoutsMock = vi.fn(async () => {
      callOrder.push("sync");
    });
    let runtimeListener:
      | ((
          message: RuntimeMessage,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response: RuntimeResponse<unknown>) => void,
        ) => boolean)
      | null = null;

    vi.stubGlobal("chrome", {
      runtime: {
        onMessage: {
          addListener: vi.fn((listener) => {
            runtimeListener = listener;
          }),
        },
      },
    });

    vi.doMock("@/lib/api/extensionApi", () => ({
      redeemExtensionCdKey: vi.fn(),
    }));
    vi.doMock("@/background/core/assetAccess", () => ({
      ExtensionApiRequestError: class ExtensionApiRequestError extends Error {
        code: string;

        constructor(code: string, message: string) {
          super(message);
          this.code = code;
        }
      },
      runAssetAccess: vi.fn(),
    }));
    vi.doMock("@/background/core/bootstrap", () => ({
      createExtensionApiConfig: vi.fn(),
      forceRefreshBootstrapCache: vi.fn(async () => {
        callOrder.push("refresh");

        return {
          fetchedAt: 1,
          isValid: true,
          snapshot: {
            assets: [{ mode: "share", platform: "tradingview" }],
            auth: { status: "authenticated" },
            user: {
              avatarUrl: null,
              email: "user@example.com",
              publicId: "MEM-001",
              username: "user",
            },
            version: { status: "supported" },
          },
        };
      }),
      logoutExtensionSession: vi.fn(),
      markExtensionSessionUnauthenticated: vi.fn(),
      readBootstrapState: vi.fn(),
      replaceBootstrapCacheFromSnapshot: vi.fn(),
    }));
    vi.doMock("@/background/core/heartbeat", () => ({
      startHeartbeat: vi.fn(),
      stopHeartbeat: vi.fn(),
    }));
    vi.doMock("@/ext-1/background/core/peerGuard", () => ({
      ensurePeerGuardAccess: vi.fn(() => Promise.resolve()),
      initializePeerGuard: vi.fn(() => Promise.resolve()),
      readCurrentPeerGuardState: vi.fn(),
      refreshPeerGuardState: vi.fn(),
    }));
    vi.doMock("@/background/core/productionOrigin", () => ({
      ensureProductionOriginHeaderRuleReady: vi.fn(() => Promise.resolve()),
    }));
    vi.doMock("@/background/core/proxy", () => ({
      ensureProxyControllerReady: vi.fn(() => Promise.resolve()),
      refreshProxyConflictState: vi.fn(),
    }));
    vi.doMock("@/background/core/startupAssetSync", () => ({
      ensureAssetSessionForPage: vi.fn(),
    }));
    vi.doMock("@/background/core/tvOwnedLayoutTabs", () => ({
      initializeTvOwnedLayoutRedirectListener: vi.fn(),
    }));
    vi.doMock("@/background/core/tvOwnedLayoutController", () => ({
      clearTradingViewOwnedLayoutOperation: vi.fn(),
      clearTradingViewOwnedLayoutOperationById: vi.fn(),
      completeTradingViewOwnedLayoutDelete: vi.fn(),
      confirmTradingViewOwnedLayoutPage: vi.fn(),
      invalidateTradingViewOwnedLayoutPage: vi.fn(),
      openTradingViewOwnedLayoutInNewTabForPublic: vi.fn(),
      readTradingViewOwnedLayoutOperationStatus: vi.fn(),
      rememberTradingViewOwnedLayout: vi.fn(),
      renameTradingViewOwnedLayout: vi.fn(),
      resolveRestrictedTradingViewRouteStatus: vi.fn(),
      submitTradingViewOwnedLayoutOperation: vi.fn(),
    }));
    vi.doMock("@/background/core/tvOwnedLayoutSync", () => ({
      syncTradingViewOwnedLayouts: syncTradingViewOwnedLayoutsMock,
    }));
    vi.doMock("@/lib/storage/bootstrapCache", () => ({
      readBootstrapCache: vi.fn(async () => ({
        fetchedAt: 1,
        isValid: true,
        snapshot: {
          assets: [{ mode: "share", platform: "tradingview" }],
          auth: { status: "authenticated" },
          user: {
            avatarUrl: null,
            email: "user@example.com",
            publicId: "MEM-001",
            username: "user",
          },
          version: { status: "supported" },
        },
      })),
    }));
    vi.doMock("@/lib/tradingview/tvAccessState", () => ({
      getRestrictedTradingViewPublicId: vi.fn(),
    }));

    await import("@/background/index");

    expect(runtimeListener).not.toBeNull();

    const response = await new Promise<RuntimeResponse<unknown>>((resolve) => {
      runtimeListener?.(
        { type: runtimeMessageType.bootstrapRefreshRequested },
        {} as chrome.runtime.MessageSender,
        resolve,
      );
    });

    expect(response).toMatchObject({ ok: true });
    expect(syncTradingViewOwnedLayoutsMock).toHaveBeenCalledWith("manual_refresh");
    expect(callOrder).toEqual(["sync", "refresh"]);
  });
});
