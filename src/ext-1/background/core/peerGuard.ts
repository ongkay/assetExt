import { clearExtensionSessionArtifactsForPeerGuard } from "@/background/core/bootstrap";
import { redirectPeerGuardProtectedAssetTabs } from "@/background/core/tabs";
import { getPeerGuardIdentity } from "@/lib/peer-guard/peerGuardConfig";

import { PeerGuardBlockedError, createPeerGuardController } from "@/lib/peer-guard/createPeerGuardController";

const ext1PeerGuardWarningPagePath = getPeerGuardIdentity("ext-1").warningPagePath;

const peerGuardController = createPeerGuardController({
  onBlocked: async () => {
    await clearExtensionSessionArtifactsForPeerGuard();
    const assetRedirectResult = await redirectPeerGuardProtectedAssetTabs(chrome.runtime.getURL(ext1PeerGuardWarningPagePath));

    return {
      redirectedAssetTabCount: assetRedirectResult.redirectedTabCount,
    };
  },
  selfRole: "ext-1",
});

export const ensurePeerGuardAccess = peerGuardController.ensureAccess;
export const getPeerGuardWarningPageUrl = peerGuardController.getWarningPageUrl;
export const initializePeerGuard = peerGuardController.initialize;
export const readCurrentPeerGuardState = peerGuardController.readCurrentState;
export const refreshPeerGuardState = peerGuardController.refreshState;
export { PeerGuardBlockedError };
