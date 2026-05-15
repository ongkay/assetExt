import {
  runtimeMessageType,
  type PeerGuardRuntimeResponse,
  type RuntimeMessage,
  type RuntimeResponse,
} from "@/lib/runtime/messages";
import { redirectPeerGuardProtectedAssetTabs } from "@/background/core/tabs";
import { getPeerGuardIdentity, peerGuardStateStorageKey } from "@/lib/peer-guard/peerGuardConfig";
import { createPeerGuardController } from "@/lib/peer-guard/createPeerGuardController";
import { clearPeerGuardManagedCookies } from "@/lib/peer-guard/managedCookies";

const ext2PeerGuardWarningPagePath = getPeerGuardIdentity("ext-2").warningPagePath;

const peerGuardController = createPeerGuardController({
  alwaysOpenWarningPageOnFirstBlock: true,
  onBlocked: async () => {
    await clearPeerGuardManagedCookies();
    await clearExt2Storage();
    const assetRedirectResult = await redirectPeerGuardProtectedAssetTabs(chrome.runtime.getURL(ext2PeerGuardWarningPagePath));

    return {
      redirectedAssetTabCount: assetRedirectResult.redirectedTabCount,
    };
  },
  selfRole: "ext-2",
});

void peerGuardController.initialize().catch(() => undefined);

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  void handleRuntimeMessage(message)
    .then(sendResponse)
    .catch((error: unknown) => {
      sendResponse(createRuntimeErrorResponse(getErrorMessage(error)));
    });

  return true;
});

async function handleRuntimeMessage(message: RuntimeMessage): Promise<RuntimeResponse<unknown>> {
  switch (message.type) {
    case runtimeMessageType.peerGuardStatusRequested: {
      return {
        ok: true,
        value: await peerGuardController.readCurrentState(),
      } satisfies PeerGuardRuntimeResponse;
    }

    case runtimeMessageType.peerGuardRefreshRequested: {
      return {
        ok: true,
        value: await peerGuardController.refreshState(),
      } satisfies PeerGuardRuntimeResponse;
    }

    default:
      return createRuntimeErrorResponse("Unsupported runtime message.");
  }
}

async function clearExt2Storage(): Promise<void> {
  if (typeof chrome === "undefined") {
    return;
  }

  // Keep the blocked peer-guard state in local storage so the warning page stays open
  // until the paired extension is actually enabled again.
  if (chrome.storage?.session) {
    await chrome.storage.session.remove([peerGuardStateStorageKey]);
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
