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
    vi.doMock("@/ext-1/background/core/cookieGuard", () => ({
      ensureCookieGuardAccess: vi.fn(() => Promise.resolve()),
      getCookieGuardWarningPageUrl: vi.fn(),
      initializeCookieGuard: vi.fn(() => Promise.resolve()),
      readCurrentCookieGuardState: vi.fn(),
      refreshCookieGuardState: vi.fn(() => Promise.resolve({ isBlocked: false })),
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

  it("returns blocked bootstrap state when cookie guard is active", async () => {
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
      forceRefreshBootstrapCache: vi.fn(),
      logoutExtensionSession: vi.fn(),
      markExtensionSessionUnauthenticated: vi.fn(),
      readBootstrapState: vi.fn(),
      replaceBootstrapCacheFromSnapshot: vi.fn(),
    }));
    vi.doMock("@/background/core/heartbeat", () => ({
      startHeartbeat: vi.fn(),
      stopHeartbeat: vi.fn(),
    }));
    vi.doMock("@/ext-1/background/core/cookieGuard", () => ({
      ensureCookieGuardAccess: vi.fn(() => Promise.resolve()),
      getCookieGuardWarningPageUrl: vi.fn(),
      initializeCookieGuard: vi.fn(() => Promise.resolve()),
      readCurrentCookieGuardState: vi.fn(),
      refreshCookieGuardState: vi.fn(() =>
        Promise.resolve({
          blockedAt: 1,
          extensions: [
            {
              iconUrl: null,
              id: "cookie-ext",
              installType: "normal",
              mayDisable: true,
              name: "Cookie Extension",
            },
          ],
          isBlocked: true,
          message: "Cookie extension detected",
          reason: "cookies_permission_detected",
          updatedAt: 1,
        }),
      ),
    }));
    vi.doMock("@/ext-1/background/core/peerGuard", () => ({
      ensurePeerGuardAccess: vi.fn(() => Promise.resolve()),
      initializePeerGuard: vi.fn(() => Promise.resolve()),
      readCurrentPeerGuardState: vi.fn(() =>
        Promise.resolve({
          blockedAt: null,
          isBlocked: false,
          message: null,
          peerExtensionId: "ext-2",
          peerLabel: "ext-2",
          reason: null,
          selfRole: "ext-1",
          updatedAt: 1,
        }),
      ),
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
      syncTradingViewOwnedLayouts: vi.fn(),
    }));
    vi.doMock("@/lib/storage/bootstrapCache", () => ({
      readBootstrapCache: vi.fn(),
    }));
    vi.doMock("@/lib/tradingview/tvAccessState", () => ({
      getRestrictedTradingViewPublicId: vi.fn(),
    }));

    await import("@/background/index");

    expect(runtimeListener).not.toBeNull();

    const response = await new Promise<RuntimeResponse<unknown>>((resolve) => {
      runtimeListener?.(
        { type: runtimeMessageType.bootstrapRequested },
        {} as chrome.runtime.MessageSender,
        resolve,
      );
    });

    expect(response).toEqual({
      ok: true,
      value: {
        cache: null,
        cookieGuardState: {
          blockedAt: 1,
          extensions: [
            {
              iconUrl: null,
              id: "cookie-ext",
              installType: "normal",
              mayDisable: true,
              name: "Cookie Extension",
            },
          ],
          isBlocked: true,
          message: "Cookie extension detected",
          reason: "cookies_permission_detected",
          updatedAt: 1,
        },
        isSyncing: false,
        peerGuardState: {
          blockedAt: null,
          isBlocked: false,
          message: null,
          peerExtensionId: "ext-2",
          peerLabel: "ext-2",
          reason: null,
          selfRole: "ext-1",
          updatedAt: 1,
        },
      },
    });
  });

  it("recomputes cookie guard state for the warning page status request", async () => {
    let runtimeListener:
      | ((
          message: RuntimeMessage,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response: RuntimeResponse<unknown>) => void,
        ) => boolean)
      | null = null;

    const refreshedCookieGuardState = {
      blockedAt: 2,
      extensions: [
        {
          iconUrl: null,
          id: "cookie-ext",
          installType: "normal",
          mayDisable: true,
          name: "Cookie Extension",
        },
      ],
      isBlocked: true,
      message: "Cookie extension detected",
      reason: "cookies_permission_detected" as const,
      updatedAt: 2,
    };

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
      forceRefreshBootstrapCache: vi.fn(),
      logoutExtensionSession: vi.fn(),
      markExtensionSessionUnauthenticated: vi.fn(),
      readBootstrapState: vi.fn(),
      replaceBootstrapCacheFromSnapshot: vi.fn(),
    }));
    vi.doMock("@/background/core/heartbeat", () => ({
      startHeartbeat: vi.fn(),
      stopHeartbeat: vi.fn(),
    }));
    vi.doMock("@/ext-1/background/core/cookieGuard", () => ({
      ensureCookieGuardAccess: vi.fn(() => Promise.resolve()),
      getCookieGuardWarningPageUrl: vi.fn(),
      initializeCookieGuard: vi.fn(() => Promise.resolve()),
      refreshCookieGuardState: vi.fn(() => Promise.resolve(refreshedCookieGuardState)),
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
      syncTradingViewOwnedLayouts: vi.fn(),
    }));
    vi.doMock("@/lib/storage/bootstrapCache", () => ({
      readBootstrapCache: vi.fn(),
    }));
    vi.doMock("@/lib/tradingview/tvAccessState", () => ({
      getRestrictedTradingViewPublicId: vi.fn(),
    }));

    await import("@/background/index");

    expect(runtimeListener).not.toBeNull();

    const response = await new Promise<RuntimeResponse<unknown>>((resolve) => {
      runtimeListener?.(
        { type: runtimeMessageType.cookieGuardStatusRequested },
        {} as chrome.runtime.MessageSender,
        resolve,
      );
    });

    expect(response).toEqual({
      ok: true,
      value: refreshedCookieGuardState,
    });
  });
});
