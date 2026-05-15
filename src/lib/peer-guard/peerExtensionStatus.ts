import type { PeerGuardBlockReason } from "@/lib/peer-guard/peerGuardState";

export type PeerExtensionStatus = {
  exists: boolean;
  isEnabled: boolean;
  reason: PeerGuardBlockReason | null;
};

export async function readPeerExtensionStatus(peerExtensionId: string): Promise<PeerExtensionStatus> {
  if (typeof chrome === "undefined" || !chrome.management?.get) {
    return {
      exists: false,
      isEnabled: false,
      reason: "peer_missing",
    };
  }

  return new Promise((resolve) => {
    chrome.management.get(peerExtensionId, (extensionInfo) => {
      const runtimeError = chrome.runtime.lastError;

      if (runtimeError || !extensionInfo) {
        resolve({
          exists: false,
          isEnabled: false,
          reason: "peer_missing",
        });
        return;
      }

      resolve({
        exists: true,
        isEnabled: extensionInfo.enabled,
        reason: extensionInfo.enabled ? null : "peer_disabled",
      });
    });
  });
}
