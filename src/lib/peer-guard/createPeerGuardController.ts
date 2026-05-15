import {
  getPeerGuardIdentity,
  type PeerGuardIdentity,
  type PeerGuardRole,
} from "@/lib/peer-guard/peerGuardConfig";
import { readPeerExtensionStatus } from "@/lib/peer-guard/peerExtensionStatus";
import {
  createBlockedPeerGuardState,
  createUnblockedPeerGuardState,
  type PeerGuardState,
} from "@/lib/peer-guard/peerGuardState";
import { readPeerGuardState, writePeerGuardState } from "@/lib/peer-guard/peerGuardStorage";
import { openOrFocusPeerGuardWarningPage } from "@/lib/peer-guard/peerGuardWarningPage";

type PeerGuardControllerOptions = {
  alwaysOpenWarningPageOnFirstBlock?: boolean;
  onBlocked: () => Promise<{ redirectedAssetTabCount?: number } | void>;
  onHealthy?: () => Promise<void>;
  selfRole: PeerGuardRole;
};

export class PeerGuardBlockedError extends Error {
  peerGuardState: PeerGuardState;

  constructor(peerGuardState: PeerGuardState) {
    super(peerGuardState.message ?? "Akses extension diblokir.");
    this.name = "PeerGuardBlockedError";
    this.peerGuardState = peerGuardState;
  }
}

export function createPeerGuardController(options: PeerGuardControllerOptions) {
  const peerGuardIdentity = getPeerGuardIdentity(options.selfRole);
  let isInitialized = false;
  let peerGuardSyncPromise: Promise<PeerGuardState> | null = null;

  return {
    ensureAccess,
    getWarningPageUrl,
    initialize,
    readCurrentState,
    refreshState,
  };

  async function initialize(): Promise<void> {
    if (!isInitialized) {
      registerPeerGuardListeners(peerGuardIdentity, refreshState);
      isInitialized = true;
    }

    await refreshState();
  }

  async function ensureAccess(): Promise<PeerGuardState> {
    const peerGuardState = await refreshState();

    if (peerGuardState.isBlocked) {
      throw new PeerGuardBlockedError(peerGuardState);
    }

    return peerGuardState;
  }

  function getWarningPageUrl(): string {
    return chrome.runtime.getURL(peerGuardIdentity.warningPagePath);
  }

  async function readCurrentState(): Promise<PeerGuardState> {
    const storedPeerGuardState = await readPeerGuardState();

    return storedPeerGuardState ?? createUnblockedPeerGuardState(options.selfRole);
  }

  async function refreshState(): Promise<PeerGuardState> {
    if (peerGuardSyncPromise) {
      return peerGuardSyncPromise;
    }

    peerGuardSyncPromise = syncPeerGuardState(options, peerGuardIdentity).finally(() => {
      peerGuardSyncPromise = null;
    });

    return peerGuardSyncPromise;
  }
}

async function syncPeerGuardState(
  options: PeerGuardControllerOptions,
  identity: PeerGuardIdentity,
): Promise<PeerGuardState> {
  const storedPeerGuardState = await readPeerGuardState();
  const previousPeerGuardState = storedPeerGuardState ?? createUnblockedPeerGuardState(options.selfRole);
  const peerStatus = await readPeerExtensionStatus(identity.peerExtensionId);

  if (!peerStatus.exists || !peerStatus.isEnabled) {
    const nextPeerGuardState = createBlockedPeerGuardState(
      options.selfRole,
      peerStatus.reason ?? "peer_missing",
    );
    let redirectedAssetTabCount = 0;

    await writePeerGuardState(nextPeerGuardState);

    if (!previousPeerGuardState.isBlocked) {
      try {
        const blockedOutcome = await options.onBlocked();
        redirectedAssetTabCount = blockedOutcome?.redirectedAssetTabCount ?? 0;
      } catch {
        // Keep the extension fail-closed even when cleanup only completes partially.
      }
    }

    if (
      !previousPeerGuardState.isBlocked &&
      redirectedAssetTabCount === 0 &&
      (storedPeerGuardState !== null || options.alwaysOpenWarningPageOnFirstBlock === true)
    ) {
      try {
        await openOrFocusPeerGuardWarningPage(identity.warningPagePath);
      } catch {
        // Persisted blocked state is more important than surfacing the warning tab perfectly.
      }
    }

    return nextPeerGuardState;
  }

  if (previousPeerGuardState.isBlocked) {
    await options.onHealthy?.();
  }

  const nextPeerGuardState = createUnblockedPeerGuardState(options.selfRole);
  await writePeerGuardState(nextPeerGuardState);

  return nextPeerGuardState;
}

function registerPeerGuardListeners(
  identity: PeerGuardIdentity,
  refreshState: () => Promise<PeerGuardState>,
): void {
  if (typeof chrome === "undefined" || !chrome.management) {
    return;
  }

  chrome.management.onDisabled?.addListener((extensionInfo) => {
    if (extensionInfo.id === identity.peerExtensionId) {
      void refreshState().catch(() => undefined);
    }
  });

  chrome.management.onEnabled?.addListener((extensionInfo) => {
    if (extensionInfo.id === identity.peerExtensionId) {
      void refreshState().catch(() => undefined);
    }
  });

  chrome.management.onInstalled?.addListener((extensionInfo) => {
    if (extensionInfo.id === identity.peerExtensionId) {
      void refreshState().catch(() => undefined);
    }
  });

  chrome.management.onUninstalled?.addListener((extensionId) => {
    if (extensionId === identity.peerExtensionId) {
      void refreshState().catch(() => undefined);
    }
  });
}
