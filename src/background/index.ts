import { redeemExtensionCdKey } from "@/lib/api/extensionApi";
import {
  runtimeMessageType,
  type AssetAccessRuntimeResponse,
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
import { syncProductionOriginHeaderRule } from "./core/productionOrigin";

void syncProductionOriginHeaderRule().catch(() => undefined);

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
      const redeemResult = await redeemExtensionCdKey(
        createExtensionApiConfig(),
        message.code,
      );

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
        mode: message.mode,
        platform: message.platform,
        shouldNavigate: true,
        tabId: message.tabId,
      });

      return {
        ok: true,
        value: assetResponse,
      } satisfies AssetAccessRuntimeResponse;
    }

    case runtimeMessageType.autoAccessRequested: {
      const assetResponse = await runAssetAccess({
        mode: message.mode,
        platform: message.platform,
        shouldNavigate: false,
        tabId: sender.tab?.id,
      });

      return {
        ok: true,
        value: assetResponse,
      } satisfies AssetAccessRuntimeResponse;
    }

    case runtimeMessageType.heartbeatStarted: {
      await startHeartbeat(message.tabId, message.platform);

      return {
        ok: true,
        value: null,
      } satisfies RuntimeResponse<null>;
    }

    case runtimeMessageType.heartbeatStopped: {
      stopHeartbeat(message.tabId);

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
