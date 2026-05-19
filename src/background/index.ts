import { redeemExtensionCdKey } from "@/lib/api/extensionApi";
import {
  runtimeMessageType,
  type AssetAccessRuntimeResponse,
  type AssetSessionEnsureRuntimeResponse,
  type BootstrapRefreshRuntimeResponse,
  type BootstrapRuntimeResponse,
  type CookieGuardRuntimeResponse,
  type LogoutRuntimeResponse,
  type PeerGuardRuntimeResponse,
  type ProxyConflictRefreshRuntimeResponse,
  type RedeemCdKeyRuntimeResponse,
  type RuntimeMessage,
  type RuntimeResponse,
} from "@/lib/runtime/messages";

import { ExtensionApiRequestError } from "./core/assetAccess";
import {
  createExtensionApiConfig,
  forceRefreshBootstrapCache,
  markExtensionSessionUnauthenticated,
  logoutExtensionSession,
  readBootstrapState,
  replaceBootstrapCacheFromSnapshot,
} from "./core/bootstrap";
import { runAssetAccess } from "./core/assetAccess";
import { startHeartbeat, stopHeartbeat } from "./core/heartbeat";
import {
  ensureCookieGuardAccess,
  initializeCookieGuard,
  refreshCookieGuardState,
} from "@/ext-1/background/core/cookieGuard";
import {
  ensurePeerGuardAccess,
  initializePeerGuard,
  readCurrentPeerGuardState,
  refreshPeerGuardState,
} from "@/ext-1/background/core/peerGuard";
import { ensureProductionOriginHeaderRuleReady } from "./core/productionOrigin";
import { ensureProxyControllerReady, refreshProxyConflictState } from "./core/proxy";
import { ensureAssetSessionForPage } from "./core/startupAssetSync";
import { initializeTvOwnedLayoutRedirectListener } from "./core/tvOwnedLayoutTabs";
import {
  clearTradingViewOwnedLayoutOperationById,
  clearTradingViewOwnedLayoutOperation,
  completeTradingViewOwnedLayoutDelete,
  confirmTradingViewOwnedLayoutPage,
  invalidateTradingViewOwnedLayoutPage,
  openTradingViewOwnedLayoutInNewTabForPublic,
  readTradingViewOwnedLayoutOperationStatus,
  rememberTradingViewOwnedLayout,
  renameTradingViewOwnedLayout,
  resolveRestrictedTradingViewRouteStatus,
  submitTradingViewOwnedLayoutOperation,
} from "./core/tvOwnedLayoutController";
import { syncTradingViewOwnedLayouts } from "./core/tvOwnedLayoutSync";
import type { TvOwnedLayoutOperationKind } from "@/lib/storage/tvOwnedLayoutOperations";
import { readBootstrapCache } from "@/lib/storage/bootstrapCache";
import { getRestrictedTradingViewPublicId } from "@/lib/tradingview/tvAccessState";

void ensureProductionOriginHeaderRuleReady().catch(() => undefined);
void initializeCookieGuard().catch(() => undefined);
void ensureProxyControllerReady().catch(() => undefined);
void initializePeerGuard().catch(() => undefined);
initializeTvOwnedLayoutRedirectListener();

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  void handleRuntimeMessage(message, sender)
    .then(sendResponse)
    .catch((error: unknown) => {
      sendResponse(createRuntimeErrorResponse(getErrorMessage(error)));
    });

  return true;
});

async function handleRuntimeMessage(
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
): Promise<RuntimeResponse<unknown>> {
  switch (message.type) {
    case runtimeMessageType.bootstrapRequested: {
      const cookieGuardState = await refreshCookieGuardState();

      if (cookieGuardState.isBlocked) {
        return {
          ok: true,
          value: {
            cache: null,
            cookieGuardState,
            isSyncing: false,
            peerGuardState: await readCurrentPeerGuardState(),
          },
        } satisfies BootstrapRuntimeResponse;
      }

      const peerGuardState = await refreshPeerGuardState();

      if (peerGuardState.isBlocked) {
        return {
          ok: true,
          value: {
            cache: null,
            cookieGuardState,
            isSyncing: false,
            peerGuardState,
          },
        } satisfies BootstrapRuntimeResponse;
      }

      const bootstrapState = await readBootstrapState(false);

      return {
        ok: true,
        value: {
          ...bootstrapState,
          cookieGuardState,
          peerGuardState,
        },
      } satisfies BootstrapRuntimeResponse;
    }

    case runtimeMessageType.bootstrapRefreshRequested: {
      await ensureCookieGuardAccess();
      await ensurePeerGuardAccess();
      const currentBootstrapCache = await readBootstrapCache();

      if (currentBootstrapCache?.isValid && currentBootstrapCache.snapshot.auth.status === "authenticated") {
        await syncTradingViewOwnedLayouts("manual_refresh").catch(() => undefined);
      }

      const bootstrapCache = await forceRefreshBootstrapCache();

      return {
        ok: true,
        value: bootstrapCache,
      } satisfies BootstrapRefreshRuntimeResponse;
    }

    case runtimeMessageType.redeemCdKeyRequested: {
      await ensureCookieGuardAccess();
      await ensurePeerGuardAccess();
      await ensureProductionOriginHeaderRuleReady();
      const redeemResult = await redeemExtensionCdKey(createExtensionApiConfig(), message.code);

      if (!redeemResult.ok) {
        return createRuntimeErrorResponse(redeemResult.error.message);
      }

      const nextCache = await replaceBootstrapCacheFromSnapshot(redeemResult.value.bootstrap);

      return {
        ok: true,
        value: nextCache.snapshot,
      } satisfies RedeemCdKeyRuntimeResponse;
    }

    case runtimeMessageType.logoutRequested: {
      const logoutValue = await logoutExtensionSession();

      return {
        ok: true,
        value: logoutValue,
      } satisfies LogoutRuntimeResponse;
    }

    case runtimeMessageType.assetAccessRequested: {
      await ensureCookieGuardAccess();
      await ensurePeerGuardAccess();

      try {
        const assetResponse = await runAssetAccess({
          platform: message.platform,
          shouldNavigate: true,
          tabId: message.tabId,
        });

        return {
          ok: true,
          value: assetResponse,
        } satisfies AssetAccessRuntimeResponse;
      } catch (error) {
        if (error instanceof ExtensionApiRequestError && error.code === "EXT_UNAUTHENTICATED") {
          await markExtensionSessionUnauthenticated();
        }

        throw error;
      }
    }

    case runtimeMessageType.assetSessionEnsureRequested: {
      const assetSessionEnsureResult = await ensureAssetSessionForPage(message.platform, sender.tab?.id);

      return {
        ok: true,
        value: assetSessionEnsureResult,
      } satisfies AssetSessionEnsureRuntimeResponse;
    }

    case runtimeMessageType.peerGuardStatusRequested: {
      return {
        ok: true,
        value: await readCurrentPeerGuardState(),
      } satisfies PeerGuardRuntimeResponse;
    }

    case runtimeMessageType.cookieGuardStatusRequested: {
      return {
        ok: true,
        value: await refreshCookieGuardState(),
      } satisfies CookieGuardRuntimeResponse;
    }

    case runtimeMessageType.cookieGuardRefreshRequested: {
      return {
        ok: true,
        value: await refreshCookieGuardState(),
      } satisfies CookieGuardRuntimeResponse;
    }

    case runtimeMessageType.peerGuardRefreshRequested: {
      return {
        ok: true,
        value: await refreshPeerGuardState(),
      } satisfies PeerGuardRuntimeResponse;
    }

    case runtimeMessageType.proxyConflictRefreshRequested: {
      const assetProxyState = await refreshProxyConflictState();

      return {
        ok: true,
        value: assetProxyState,
      } satisfies ProxyConflictRefreshRuntimeResponse;
    }

    case runtimeMessageType.heartbeatStarted: {
      const tabId = message.tabId ?? sender.tab?.id;

      if ((await refreshCookieGuardState()).isBlocked) {
        return {
          ok: true,
          value: null,
        } satisfies RuntimeResponse<null>;
      }

      if ((await refreshPeerGuardState()).isBlocked) {
        return {
          ok: true,
          value: null,
        } satisfies RuntimeResponse<null>;
      }

      const bootstrapCache = await readBootstrapCache();

      if (tabId && bootstrapCache?.isValid && bootstrapCache.snapshot.auth.status === "authenticated") {
        await startHeartbeat(tabId, message.platform);
      }

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    case runtimeMessageType.heartbeatStopped: {
      const tabId = message.tabId ?? sender.tab?.id;

      if (tabId) {
        stopHeartbeat(tabId);
      }

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    case runtimeMessageType.tvOwnedLayoutRememberRequested: {
      await rememberTradingViewOwnedLayout({
        chartId: message.chartId,
        publicId: message.publicId,
        shouldMarkAsOpened: message.shouldMarkAsOpened,
        title: message.title,
        updatedAt: message.updatedAt,
        url: message.url,
      });

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    case runtimeMessageType.tvOwnedLayoutPendingOperationSubmitted: {
      let operationId: string | null = null;

      if (typeof sender.tab?.id === "number") {
        const pendingOperation = await submitTradingViewOwnedLayoutOperation({
          expectedTitle: message.expectedTitle,
          kind: message.kind,
          openInNewTab: message.openInNewTab,
          originTabId: sender.tab.id,
          publicId: message.publicId,
          sourceChartId: message.sourceChartId,
        });

        operationId = pendingOperation.operationId;
      }

      return {
        ok: true,
        value: { operationId },
      } satisfies RuntimeResponse<{ operationId: string | null }>;
    }

    case runtimeMessageType.tvOwnedLayoutRenameRequested: {
      await renameTradingViewOwnedLayout(message.publicId, message.chartId, message.title);

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    case runtimeMessageType.tvOwnedLayoutDeleteCompleted: {
      await completeTradingViewOwnedLayoutDelete(message.publicId, message.chartId);

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    case runtimeMessageType.tvOwnedLayoutPageConfirmed: {
      if (typeof sender.tab?.id === "number") {
        await confirmTradingViewOwnedLayoutPage({
          chartId: message.chartId,
          publicId: message.publicId,
          tabId: sender.tab.id,
          url: message.url,
        });
      }

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    case runtimeMessageType.tvOwnedLayoutPageInvalid: {
      return {
        ok: true,
        value: {
          redirectUrl: await invalidateTradingViewOwnedLayoutPage({
            chartId: message.chartId,
            publicId: message.publicId,
          }),
        },
      } satisfies RuntimeResponse<{ redirectUrl: string }>;
    }

    case runtimeMessageType.tvOwnedLayoutOpenTabRequested: {
      if (typeof sender.tab?.id === "number") {
        await openTradingViewOwnedLayoutInNewTabForPublic(
          sender.tab.id,
          message.url,
          message.publicId,
          message.operationId,
        );
      }

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    case runtimeMessageType.tvOwnedLayoutRouteStatusRequested: {
      return {
        ok: true,
        value: await resolveRestrictedTradingViewRouteStatus(
          message.url,
          sender.tab?.id,
          sender.tab?.openerTabId,
        ),
      } satisfies RuntimeResponse<{
        currentChartId: string | null;
        expectedTitle: string | null;
        isPendingOperation: boolean;
        isRestricted: boolean;
        operationId: string | null;
        pendingOperationKind: TvOwnedLayoutOperationKind | null;
        redirectUrl: string | null;
        shouldAllow: boolean;
      }>;
    }

    case runtimeMessageType.tvOwnedLayoutOperationStatusRequested: {
      return {
        ok: true,
        value: await readTradingViewOwnedLayoutOperationStatus(message.publicId, message.operationId),
      } satisfies RuntimeResponse<{
        boundChartId: string | null;
        isActive: boolean;
        isBound: boolean;
        kind: TvOwnedLayoutOperationKind | null;
      }>;
    }

    case runtimeMessageType.tvOwnedLayoutPendingOperationCleared: {
      const bootstrapCacheRecord = await readBootstrapCache();
      const publicId = getRestrictedTradingViewPublicId(bootstrapCacheRecord);

      if (publicId) {
        if (message.operationId) {
          await clearTradingViewOwnedLayoutOperationById(publicId, message.operationId, sender.tab?.id);
        } else {
          await clearTradingViewOwnedLayoutOperation(publicId, sender.tab?.id);
        }
      }

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    case runtimeMessageType.tvOwnedLayoutSyncRequested: {
      void syncTradingViewOwnedLayouts(message.trigger).catch(() => undefined);

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    default:
      return createRuntimeErrorResponse("Unsupported runtime message.");
  }
}

function createRuntimeErrorResponse(errorMessage: string) {
  return {
    errorMessage,
    ok: false,
  } as const;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Runtime request failed.";
}
