import { postTradingViewOwnedLayoutsSync } from "@/lib/api/extensionApi";
import {
  type ExtensionBootstrap,
  type ExtensionTradingViewOwnedLayoutsSyncTrigger,
  type PostTradingViewOwnedLayoutsSyncRequest,
} from "@/lib/api/extensionApiTypes";
import { getExtensionApiBaseUrl, isDev } from "@/lib/api/extensionApiConfig";
import { readBootstrapCache } from "@/lib/storage/bootstrapCache";
import {
  buildExtensionTradingViewOwnedLayoutsSnapshot,
  mergeTvOwnedLayoutSnapshot,
  readTvOwnedLayoutState,
} from "@/lib/storage/tvOwnedLayouts";
import {
  readTvOwnedLayoutSyncState,
  writeTvOwnedLayoutSyncState,
} from "@/lib/storage/tvOwnedLayoutSyncState";

let pendingTradingViewOwnedLayoutSync: Promise<void> | null = null;
let queuedTradingViewOwnedLayoutSyncRequest: {
  force: boolean;
  trigger: ExtensionTradingViewOwnedLayoutsSyncTrigger;
} | null = null;

export async function hydrateTradingViewOwnedLayoutsFromBootstrapSnapshot(
  snapshot: ExtensionBootstrap,
): Promise<void> {
  const publicId = resolveTradingViewSharePublicId(snapshot);

  if (!publicId || !snapshot.tradingViewOwnedLayouts) {
    return;
  }

  if (await shouldSkipBootstrapTradingViewOwnedLayoutsHydration(publicId)) {
    return;
  }

  await mergeTvOwnedLayoutSnapshot(publicId, snapshot.tradingViewOwnedLayouts);
}

export async function syncTradingViewOwnedLayouts(
  trigger: ExtensionTradingViewOwnedLayoutsSyncTrigger,
  options?: { force?: boolean },
): Promise<void> {
  if (pendingTradingViewOwnedLayoutSync) {
    queuedTradingViewOwnedLayoutSyncRequest = mergeQueuedTradingViewOwnedLayoutSyncRequest(
      queuedTradingViewOwnedLayoutSyncRequest,
      {
        force: options?.force === true,
        trigger,
      },
    );

    return pendingTradingViewOwnedLayoutSync;
  }

  pendingTradingViewOwnedLayoutSync = processTradingViewOwnedLayoutSyncQueue({
    force: options?.force === true,
    trigger,
  }).finally(() => {
    pendingTradingViewOwnedLayoutSync = null;
  });

  return pendingTradingViewOwnedLayoutSync;
}

async function processTradingViewOwnedLayoutSyncQueue(initialRequest: {
  force: boolean;
  trigger: ExtensionTradingViewOwnedLayoutsSyncTrigger;
}): Promise<void> {
  let nextRequest: { force: boolean; trigger: ExtensionTradingViewOwnedLayoutsSyncTrigger } | null =
    initialRequest;

  while (nextRequest) {
    await runTradingViewOwnedLayoutSync(nextRequest.trigger, { force: nextRequest.force });

    nextRequest = queuedTradingViewOwnedLayoutSyncRequest;
    queuedTradingViewOwnedLayoutSyncRequest = null;
  }
}

async function runTradingViewOwnedLayoutSync(
  trigger: ExtensionTradingViewOwnedLayoutsSyncTrigger,
  options?: { force?: boolean },
): Promise<void> {
  const bootstrapCacheRecord = await readBootstrapCache();

  if (!bootstrapCacheRecord?.isValid) {
    return;
  }

  const publicId = resolveTradingViewSharePublicId(bootstrapCacheRecord.snapshot);

  if (!publicId) {
    return;
  }

  const localState = await readTvOwnedLayoutState(publicId);
  const localSnapshot = buildExtensionTradingViewOwnedLayoutsSnapshot(localState);
  const localFingerprint = JSON.stringify(localSnapshot);
  const currentSyncState = await readTvOwnedLayoutSyncState();

  if (
    options?.force !== true &&
    currentSyncState.publicId === publicId &&
    currentSyncState.status === "success" &&
    currentSyncState.lastUploadedFingerprint === localFingerprint
  ) {
    return;
  }

  await writeTvOwnedLayoutSyncState({
    lastErrorMessage: null,
    lastSyncedAt: currentSyncState.publicId === publicId ? currentSyncState.lastSyncedAt : null,
    lastUploadedFingerprint:
      currentSyncState.publicId === publicId ? currentSyncState.lastUploadedFingerprint : null,
    publicId,
    status: "running",
  });

  const requestBody: PostTradingViewOwnedLayoutsSyncRequest = {
    ...localSnapshot,
    isAuthoritativeSnapshot: false,
    snapshotCapturedAt: new Date().toISOString(),
    trigger,
  };
  const requestFingerprint = localFingerprint;

  try {
    const syncResult = await postTradingViewOwnedLayoutsSync(createExtensionApiConfig(), requestBody);

    if (!syncResult.ok) {
      await writeTvOwnedLayoutSyncState({
        lastErrorMessage: syncResult.error.message,
        lastSyncedAt: currentSyncState.lastSyncedAt,
        lastUploadedFingerprint: currentSyncState.lastUploadedFingerprint,
        publicId,
        status: "failed",
      });
      return;
    }

    await mergeTvOwnedLayoutSnapshot(publicId, syncResult.value);

    await writeTvOwnedLayoutSyncState({
      lastErrorMessage: null,
      lastSyncedAt: Date.now(),
      lastUploadedFingerprint: requestFingerprint,
      publicId,
      status: "success",
    });
  } catch (error) {
    await writeTvOwnedLayoutSyncState({
      lastErrorMessage: getErrorMessage(error),
      lastSyncedAt: currentSyncState.lastSyncedAt,
      lastUploadedFingerprint: currentSyncState.lastUploadedFingerprint,
      publicId,
      status: "failed",
    });
  }
}

function resolveTradingViewSharePublicId(snapshot: ExtensionBootstrap): string | null {
  if (snapshot.auth.status !== "authenticated") {
    return null;
  }

  const hasTradingViewShareAccess = snapshot.assets?.some(
    (assetSummary) => assetSummary.platform === "tradingview" && assetSummary.mode === "share",
  );

  if (!hasTradingViewShareAccess) {
    return null;
  }

  return snapshot.user?.publicId?.trim() || null;
}

function createExtensionApiConfig() {
  return {
    apiBaseUrl: getExtensionApiBaseUrl(),
    extensionId: chrome.runtime.id ?? null,
    extensionVersion: chrome.runtime.getManifest().version,
    isDev,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "TradingView owned layout sync failed.";
}

function mergeQueuedTradingViewOwnedLayoutSyncRequest(
  currentRequest: { force: boolean; trigger: ExtensionTradingViewOwnedLayoutsSyncTrigger } | null,
  nextRequest: { force: boolean; trigger: ExtensionTradingViewOwnedLayoutsSyncTrigger },
): { force: boolean; trigger: ExtensionTradingViewOwnedLayoutsSyncTrigger } {
  if (!currentRequest) {
    return nextRequest;
  }

  return {
    force: currentRequest.force || nextRequest.force,
    trigger: nextRequest.trigger,
  };
}

async function shouldSkipBootstrapTradingViewOwnedLayoutsHydration(publicId: string): Promise<boolean> {
  const currentSyncState = await readTvOwnedLayoutSyncState();

  if (currentSyncState.publicId !== publicId) {
    return false;
  }

  if (currentSyncState.status === "running") {
    return true;
  }

  if (!currentSyncState.lastUploadedFingerprint) {
    return false;
  }

  const localState = await readTvOwnedLayoutState(publicId);
  const localFingerprint = JSON.stringify(buildExtensionTradingViewOwnedLayoutsSnapshot(localState));

  return currentSyncState.lastUploadedFingerprint !== localFingerprint;
}
