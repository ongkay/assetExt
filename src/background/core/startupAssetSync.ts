import { detectAssetPlatformFromHostname, type AssetPlatform } from "@/lib/asset-access/platforms";
import { runtimeMessageType, type OverlayStateChangedMessage } from "@/lib/runtime/messages";
import { readBootstrapCache } from "@/lib/storage/bootstrapCache";
import {
  readAssetSessionSyncState,
  updateAssetSessionSyncEntry,
  type AssetSessionSyncEntry,
} from "@/lib/storage/assetSessionSync";

import { ExtensionApiRequestError, fetchAssetSessionSync, prepareAssetAccessSession } from "./assetAccess";
import { markExtensionSessionUnauthenticated } from "./bootstrap";
import { clearAssetPlatformCookies } from "./cookies";

export type AssetSessionEnsureAction = "none" | "reload_required" | "redirect_login";

export type AssetSessionEnsureResult = {
  action: AssetSessionEnsureAction;
  message: string | null;
  redirectTo: string | null;
  shouldStartHeartbeat: boolean;
};

const syncReloadMessage = "update data terbaru";
const subscriptionRequiredMessage = "Subscription aktif diperlukan untuk membuka asset ini.";

type PageEnsureState = {
  affectedTabIds: Set<number>;
  phase: "checking" | "refreshing";
  promise: Promise<AssetSessionEnsureResult>;
};

const pageEnsureStates = new Map<AssetPlatform, PageEnsureState>();

export async function ensureAssetSessionForPage(
  platform: AssetPlatform,
  tabId?: number,
): Promise<AssetSessionEnsureResult> {
  const currentEnsureState = pageEnsureStates.get(platform);

  if (currentEnsureState) {
    if (typeof tabId === "number") {
      currentEnsureState.affectedTabIds.add(tabId);
    }

    if (currentEnsureState.phase === "refreshing") {
      await notifyOverlayState(tabId, "loading", syncReloadMessage);
    }

    return currentEnsureState.promise;
  }

  const nextEnsurePromise = runAssetSessionEnsureForPage(platform, tabId).finally(() => {
    pageEnsureStates.delete(platform);
  });

  pageEnsureStates.set(platform, {
    affectedTabIds: createAffectedTabIds(tabId),
    phase: "checking",
    promise: nextEnsurePromise,
  });

  return nextEnsurePromise;
}

async function runAssetSessionEnsureForPage(
  platform: AssetPlatform,
  tabId?: number,
): Promise<AssetSessionEnsureResult> {
  const bootstrapCache = await readBootstrapCache();

  if (!bootstrapCache || !bootstrapCache.isValid || bootstrapCache.snapshot.auth.status !== "authenticated") {
    return createEnsureResult("none");
  }

  const currentEntry = await readAssetSessionSyncEntry(platform);

  if (
    currentEntry.skipNextPageSync &&
    typeof tabId === "number" &&
    currentEntry.skipNextPageSyncTabIds.includes(tabId)
  ) {
    await updateAssetSessionSyncEntry(platform, (entry) => ({
      ...entry,
      skipNextPageSync:
        entry.skipNextPageSyncTabIds.filter((currentTabId) => currentTabId !== tabId).length > 0,
      skipNextPageSyncTabIds: entry.skipNextPageSyncTabIds.filter((currentTabId) => currentTabId !== tabId),
    }));

    return createEnsureResult("none", null, null, true);
  }

  try {
    const assetSyncResponse = await fetchAssetSessionSync(platform, currentEntry.revision);

    if (assetSyncResponse.status === "forbidden") {
      await clearAssetPlatformCookies(platform);
      await markAssetSessionSyncSkipped(platform, subscriptionRequiredMessage);
      return createEnsureResult("none");
    }

    if (assetSyncResponse.status === "current") {
      await markAssetSessionSyncCurrent(platform, assetSyncResponse.revision, assetSyncResponse.updatedAt);
      return createEnsureResult("none", null, null, true);
    }

    await syncAffectedTabIdsWithOpenPlatformTabs(platform);
    setPageEnsurePhase(platform, "refreshing");
    await notifyOverlayStateForAffectedTabs(platform, "loading", syncReloadMessage);
    await markAssetSessionSyncRunning(platform);

    const assetResponse = await prepareAssetAccessSession({
      platform,
    });

    if (assetResponse.status === "forbidden") {
      await clearAssetPlatformCookies(platform);
      await notifyOverlayStateForAffectedTabs(platform, "idle", "");
      await markAssetSessionSyncSkipped(platform, subscriptionRequiredMessage);
      return createEnsureResult("none");
    }

    await markAssetSessionSyncReloadRequired(platform, getAffectedTabIds(platform));
    await reloadAffectedPlatformTabs(platform);

    return createEnsureResult("none");
  } catch (error) {
    return handleAssetSessionEnsureError(platform, error);
  }
}

async function handleAssetSessionEnsureError(
  platform: AssetPlatform,
  error: unknown,
): Promise<AssetSessionEnsureResult> {
  if (isExtensionApiRequestError(error) && error.code === "EXT_UNAUTHENTICATED") {
    const redirectTo = await markExtensionSessionUnauthenticated();
    await notifyRedirectToAffectedTabs(platform, redirectTo);

    return createEnsureResult("redirect_login", null, redirectTo);
  }

  await notifyOverlayStateForAffectedTabs(platform, "idle", "");
  await markAssetSessionSyncFailure(platform, getErrorMessage(error));

  return createEnsureResult("none");
}

async function markAssetSessionSyncRunning(platform: AssetPlatform): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    lastErrorMessage: null,
    status: "running",
  }));
}

async function markAssetSessionSyncCurrent(
  platform: AssetPlatform,
  revision: string,
  updatedAt: string,
): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    lastErrorMessage: null,
    lastSyncedAt: Date.now(),
    revision,
    skipNextPageSync: false,
    skipNextPageSyncTabIds: [],
    status: "success",
    updatedAt,
  }));
}

async function markAssetSessionSyncReloadRequired(
  platform: AssetPlatform,
  affectedTabIds: number[],
): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    skipNextPageSync: affectedTabIds.length > 0,
    skipNextPageSyncTabIds: affectedTabIds,
  }));
}

async function markAssetSessionSyncSkipped(platform: AssetPlatform, lastErrorMessage: string): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    lastErrorMessage,
    skipNextPageSync: false,
    skipNextPageSyncTabIds: [],
    status: "skipped",
  }));
}

async function markAssetSessionSyncFailure(platform: AssetPlatform, lastErrorMessage: string): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    lastErrorMessage,
    skipNextPageSync: false,
    skipNextPageSyncTabIds: [],
    status: "failed",
  }));
}

async function readAssetSessionSyncEntry(platform: AssetPlatform): Promise<AssetSessionSyncEntry> {
  const assetSessionSyncState = await readAssetSessionSyncState();

  return assetSessionSyncState[platform];
}

function createEnsureResult(
  action: AssetSessionEnsureAction,
  message: string | null = null,
  redirectTo: string | null = null,
  shouldStartHeartbeat = false,
): AssetSessionEnsureResult {
  return {
    action,
    message,
    redirectTo,
    shouldStartHeartbeat,
  };
}

function getErrorMessage(error: unknown): string {
  if (isExtensionApiRequestError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Sinkronisasi akses asset gagal diproses.";
}

function isExtensionApiRequestError(
  error: unknown,
): error is ExtensionApiRequestError | (Error & { code: string }) {
  return error instanceof ExtensionApiRequestError || isErrorWithCode(error);
}

function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return error instanceof Error && typeof Reflect.get(error, "code") === "string";
}

async function notifyOverlayState(
  tabId: number | undefined,
  state: OverlayStateChangedMessage["state"],
  message: string,
  redirectTo?: string,
): Promise<void> {
  if (typeof chrome === "undefined" || !tabId || !chrome.tabs?.sendMessage) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      message,
      redirectTo,
      state,
      type: runtimeMessageType.overlayStateChanged,
    } satisfies OverlayStateChangedMessage);
  } catch {
    return;
  }
}

async function notifyOverlayStateForAffectedTabs(
  platform: AssetPlatform,
  state: OverlayStateChangedMessage["state"],
  message: string,
): Promise<void> {
  await Promise.all(
    getAffectedTabIds(platform).map((affectedTabId) => notifyOverlayState(affectedTabId, state, message)),
  );
}

async function notifyRedirectToAffectedTabs(platform: AssetPlatform, redirectTo: string): Promise<void> {
  await Promise.all(
    getAffectedTabIds(platform).map((affectedTabId) =>
      notifyOverlayState(affectedTabId, "idle", "", redirectTo),
    ),
  );
}

function setPageEnsurePhase(platform: AssetPlatform, phase: PageEnsureState["phase"]): void {
  const currentEnsureState = pageEnsureStates.get(platform);

  if (!currentEnsureState) {
    return;
  }

  pageEnsureStates.set(platform, {
    ...currentEnsureState,
    phase,
  });
}

function createAffectedTabIds(tabId?: number): Set<number> {
  if (typeof tabId !== "number") {
    return new Set<number>();
  }

  return new Set<number>([tabId]);
}

function getAffectedTabIds(platform: AssetPlatform): number[] {
  const currentEnsureState = pageEnsureStates.get(platform);

  if (!currentEnsureState) {
    return [];
  }

  return [...currentEnsureState.affectedTabIds];
}

async function syncAffectedTabIdsWithOpenPlatformTabs(platform: AssetPlatform): Promise<void> {
  const currentEnsureState = pageEnsureStates.get(platform);

  if (!currentEnsureState || typeof chrome === "undefined" || !chrome.tabs?.query) {
    return;
  }

  const openPlatformTabIds = await getOpenPlatformTabIds(platform);

  currentEnsureState.affectedTabIds = new Set(openPlatformTabIds);
}

async function getOpenPlatformTabIds(platform: AssetPlatform): Promise<number[]> {
  const tabs = await chrome.tabs.query({});

  return tabs.flatMap((tab) => {
    if (!tab.id) {
      return [];
    }

    const tabUrl = tab.url ?? tab.pendingUrl;

    if (!tabUrl) {
      return [];
    }

    try {
      return detectAssetPlatformFromHostname(new URL(tabUrl).hostname) === platform ? [tab.id] : [];
    } catch {
      return [];
    }
  });
}

async function reloadAffectedPlatformTabs(platform: AssetPlatform): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.tabs?.reload) {
    return;
  }

  await Promise.all(getAffectedTabIds(platform).map((tabId) => chrome.tabs.reload(tabId)));
}
