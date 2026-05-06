import { redeemExtensionCdKey } from "@/lib/api/extensionApi";
import {
  runtimeMessageType,
  type AssetAccessRuntimeResponse,
  type AssetSessionEnsureRuntimeResponse,
  type BootstrapRefreshRuntimeResponse,
  type BootstrapRuntimeResponse,
  type LogoutRuntimeResponse,
  type RedeemCdKeyRuntimeResponse,
  type RuntimeMessage,
  type RuntimeResponse,
} from "@/lib/runtime/messages";

import {
  createExtensionApiConfig,
  forceRefreshBootstrapCache,
  logoutExtensionSession,
  readBootstrapState,
  replaceBootstrapCacheFromSnapshot,
} from "./core/bootstrap";
import { runAssetAccess } from "./core/assetAccess";
import { startHeartbeat, stopHeartbeat } from "./core/heartbeat";
import { ensureProductionOriginHeaderRuleReady } from "./core/productionOrigin";
import {
  ensureAssetSessionForPage,
  ensureStartupAssetSync,
  markAssetSessionSyncSuccess,
} from "./core/startupAssetSync";

void ensureProductionOriginHeaderRuleReady().catch(() => undefined);
chrome.runtime.onInstalled.addListener(() => {
  void ensureStartupAssetSync().catch(() => undefined);
});
chrome.runtime.onStartup.addListener(() => {
  void ensureStartupAssetSync().catch(() => undefined);
});

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
      const bootstrapState = await readBootstrapState(false);

      return {
        ok: true,
        value: bootstrapState,
      } satisfies BootstrapRuntimeResponse;
    }

    case runtimeMessageType.bootstrapRefreshRequested: {
      const bootstrapCache = await forceRefreshBootstrapCache();

      return {
        ok: true,
        value: bootstrapCache,
      } satisfies BootstrapRefreshRuntimeResponse;
    }

    case runtimeMessageType.redeemCdKeyRequested: {
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
      const assetResponse = await runAssetAccess({
        platform: message.platform,
        shouldNavigate: true,
        tabId: message.tabId,
      });

      if (assetResponse.status === "ready") {
        await markAssetSessionSyncSuccess(message.platform);
      }

      return {
        ok: true,
        value: assetResponse,
      } satisfies AssetAccessRuntimeResponse;
    }

    case runtimeMessageType.assetSessionEnsureRequested: {
      const assetSessionEnsureResult = await ensureAssetSessionForPage(message.platform);

      return {
        ok: true,
        value: assetSessionEnsureResult,
      } satisfies AssetSessionEnsureRuntimeResponse;
    }

    case runtimeMessageType.heartbeatStarted: {
      const tabId = message.tabId ?? sender.tab?.id;

      if (tabId) {
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
