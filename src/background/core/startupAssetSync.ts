import { getAutomaticAssetMode } from "@/lib/asset-access/mode";
import { assetPlatforms, type AssetPlatform } from "@/lib/asset-access/platforms";
import type { ExtensionAssetResponse, ExtensionMode } from "@/lib/api/extensionApiTypes";
import {
  readAssetSessionSyncState,
  updateAssetSessionSyncEntry,
  type AssetSessionSyncEntry,
} from "@/lib/storage/assetSessionSync";

import { forceRefreshBootstrapCache } from "./bootstrap";
import { prepareAssetAccessSession } from "./assetAccess";

export type AssetSessionEnsureAction = "none" | "reload_required";

export type AssetSessionEnsureResult = {
  action: AssetSessionEnsureAction;
  fallbackUsed: boolean;
  lastErrorMessage: string | null;
  status: AssetSessionSyncEntry["status"];
};

let startupAssetSyncPromise: Promise<void> | null = null;

export async function ensureStartupAssetSync(): Promise<void> {
  if (startupAssetSyncPromise) {
    await startupAssetSyncPromise;
    return;
  }

  if (!(await shouldRunStartupAssetSync())) {
    return;
  }

  startupAssetSyncPromise = runStartupAssetSync().finally(() => {
    startupAssetSyncPromise = null;
  });

  await startupAssetSyncPromise;
}

export async function ensureAssetSessionForPage(platform: AssetPlatform): Promise<AssetSessionEnsureResult> {
  await ensureStartupAssetSync();

  let currentEntry = await readAssetSessionSyncEntry(platform);

  if (currentEntry.status === "success") {
    return createEnsureResult("none", currentEntry);
  }

  if (currentEntry.fallbackUsed) {
    return createEnsureResult("none", currentEntry);
  }

  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    fallbackUsed: true,
    lastErrorMessage: null,
    status: "running",
  }));

  try {
    const assetResponse = await prepareAssetAccessSession({ platform });

    if (assetResponse.status !== "ready") {
      await markAssetSessionSyncFailure(platform, getAssetSessionFailureMessage(assetResponse));
      currentEntry = await readAssetSessionSyncEntry(platform);
      return createEnsureResult("none", currentEntry);
    }

    await markAssetSessionSyncSuccess(platform);
    currentEntry = await readAssetSessionSyncEntry(platform);

    return createEnsureResult("reload_required", currentEntry);
  } catch (error) {
    await markAssetSessionSyncFailure(platform, getErrorMessage(error));
    currentEntry = await readAssetSessionSyncEntry(platform);
    return createEnsureResult("none", currentEntry);
  }
}

export async function markAssetSessionSyncSuccess(platform: AssetPlatform): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    lastErrorMessage: null,
    lastSyncedAt: Date.now(),
    status: "success",
  }));
}

export async function markAssetSessionSyncSkipped(platform: AssetPlatform): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    lastErrorMessage: null,
    status: "skipped",
  }));
}

async function shouldRunStartupAssetSync(): Promise<boolean> {
  const assetSessionSyncState = await readAssetSessionSyncState();

  return assetPlatforms.some((platform) => assetSessionSyncState[platform].status === "idle");
}

async function runStartupAssetSync(): Promise<void> {
  try {
    const bootstrapCache = await forceRefreshBootstrapCache();

    if (!bootstrapCache.isValid || bootstrapCache.snapshot.auth.status !== "authenticated") {
      await markAllAssetSessionSyncFailures("Login extension diperlukan untuk menyiapkan akses asset.");
      return;
    }

    for (const platform of assetPlatforms) {
      const assetSummary = bootstrapCache.snapshot.assets?.find((asset) => asset.platform === platform);
      const automaticMode = assetSummary ? getAutomaticAssetMode(assetSummary) : null;

      if (!automaticMode) {
        await markAssetSessionSyncSkipped(platform);
        continue;
      }

      await syncStartupAssetPlatform(platform, automaticMode);
    }
  } catch (error) {
    await markAllAssetSessionSyncFailures(getErrorMessage(error));
  }
}

async function syncStartupAssetPlatform(platform: AssetPlatform, mode: ExtensionMode): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    lastErrorMessage: null,
    status: "running",
  }));

  try {
    const assetResponse = await prepareAssetAccessSession({ mode, platform });

    if (assetResponse.status !== "ready") {
      await markAssetSessionSyncFailure(platform, getAssetSessionFailureMessage(assetResponse));
      return;
    }

    await markAssetSessionSyncSuccess(platform);
  } catch (error) {
    await markAssetSessionSyncFailure(platform, getErrorMessage(error));
  }
}

async function markAllAssetSessionSyncFailures(lastErrorMessage: string): Promise<void> {
  for (const platform of assetPlatforms) {
    await markAssetSessionSyncFailure(platform, lastErrorMessage);
  }
}

async function markAssetSessionSyncFailure(platform: AssetPlatform, lastErrorMessage: string): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    lastErrorMessage,
    status: "failed",
  }));
}

async function readAssetSessionSyncEntry(platform: AssetPlatform): Promise<AssetSessionSyncEntry> {
  const assetSessionSyncState = await readAssetSessionSyncState();

  return assetSessionSyncState[platform];
}

function createEnsureResult(
  action: AssetSessionEnsureAction,
  entry: AssetSessionSyncEntry,
): AssetSessionEnsureResult {
  return {
    action,
    fallbackUsed: entry.fallbackUsed,
    lastErrorMessage: entry.lastErrorMessage,
    status: entry.status,
  };
}

function getAssetSessionFailureMessage(assetResponse: ExtensionAssetResponse): string {
  if (assetResponse.status === "selection_required") {
    return "Mode akses belum bisa ditentukan otomatis.";
  }

  return "Subscription aktif diperlukan untuk membuka asset ini.";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Sinkronisasi akses asset gagal diproses.";
}
