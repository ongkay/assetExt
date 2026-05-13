import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";
import { fetchExtensionAsset, fetchExtensionAssetSync } from "@/lib/api/extensionApi";
import type {
  ExtensionApiError,
  ExtensionAssetReadyResponse,
  ExtensionAssetResponse,
  ExtensionAssetSyncResponse,
} from "@/lib/api/extensionApiTypes";
import { markInjectionCooldown } from "@/lib/storage/injectionCooldown";
import { updateAssetSessionSyncEntry } from "@/lib/storage/assetSessionSync";

import { createExtensionApiConfig, getExtensionSessionLifecycleRevision } from "./bootstrap";
import { clearAssetPlatformCookies, injectExtensionCookies } from "./cookies";
import { startHeartbeat } from "./heartbeat";
import { ensureProductionOriginHeaderRuleReady } from "./productionOrigin";
import { clearAssetPlatformProxy, ensureProxyAccessAvailable, syncAssetPlatformProxy } from "./proxy";
import { openOrReloadTab } from "./tabs";

export type RunAssetAccessOptions = {
  platform: AssetPlatform;
  shouldNavigate: boolean;
  tabId?: number;
};

type PrepareAssetAccessSessionOptions = {
  platform: AssetPlatform;
  skipNextPageSync?: boolean;
  skipNextPageSyncTabIds?: number[];
};

export class ExtensionApiRequestError extends Error {
  readonly code: ExtensionApiError["code"];

  constructor(error: ExtensionApiError) {
    super(error.message);
    this.code = error.code;
    this.name = "ExtensionApiRequestError";
  }
}

export async function runAssetAccess(options: RunAssetAccessOptions): Promise<ExtensionAssetResponse> {
  const sessionRevisionAtStart = getExtensionSessionLifecycleRevision();
  await ensureProxyAccessAvailable();
  const assetResponse = await prepareAssetAccessSession(options);

  assertActiveExtensionSession(sessionRevisionAtStart);

  if (assetResponse.status !== "ready") {
    await clearAssetPlatformProxy(options.platform);
    return assetResponse;
  }

  if (options.shouldNavigate) {
    const platformConfig = getAssetPlatformConfig(options.platform);
    const assetTab = await openOrReloadTab(platformConfig.targetUrl, options.tabId);
    const heartbeatTabId = assetTab.id ?? options.tabId;

    if (heartbeatTabId) {
      await startHeartbeat(heartbeatTabId, options.platform);
    }
  } else if (options.tabId) {
    await startHeartbeat(options.tabId, options.platform);
  }

  return assetResponse;
}

export async function prepareAssetAccessSession(
  options: PrepareAssetAccessSessionOptions,
): Promise<ExtensionAssetResponse> {
  const sessionRevisionAtStart = getExtensionSessionLifecycleRevision();
  const assetResponse = await requestAssetResponse(options.platform);

  assertActiveExtensionSession(sessionRevisionAtStart);

  if (assetResponse.status !== "ready") {
    return assetResponse;
  }

  await applyReadyAssetCookies(options.platform, assetResponse);
  assertActiveExtensionSession(sessionRevisionAtStart);
  await persistReadyAssetSession(
    options.platform,
    assetResponse,
    options.skipNextPageSync ?? false,
    options.skipNextPageSyncTabIds ?? [],
  );

  return assetResponse;
}

export async function fetchAssetSessionSync(
  platform: AssetPlatform,
  revision: string | null,
): Promise<ExtensionAssetSyncResponse> {
  await ensureProductionOriginHeaderRuleReady();
  const assetSyncResult = await fetchExtensionAssetSync(createExtensionApiConfig(), platform, revision);

  if (!assetSyncResult.ok) {
    throw new ExtensionApiRequestError(assetSyncResult.error);
  }

  return assetSyncResult.value;
}

async function requestAssetResponse(platform: AssetPlatform): Promise<ExtensionAssetResponse> {
  await ensureProxyAccessAvailable();
  await ensureProductionOriginHeaderRuleReady();
  const assetResult = await fetchExtensionAsset(createExtensionApiConfig(), platform);

  if (!assetResult.ok) {
    throw new ExtensionApiRequestError(assetResult.error);
  }

  return assetResult.value;
}

async function applyReadyAssetCookies(
  platform: AssetPlatform,
  assetResponse: ExtensionAssetReadyResponse,
): Promise<void> {
  await syncAssetPlatformProxy(platform, assetResponse.proxy, assetResponse.updatedAt);
  await clearAssetPlatformCookies(platform);
  await injectExtensionCookies(assetResponse.cookies);
  await markInjectionCooldown(platform);
}

async function persistReadyAssetSession(
  platform: AssetPlatform,
  assetResponse: ExtensionAssetReadyResponse,
  skipNextPageSync: boolean,
  skipNextPageSyncTabIds: number[],
): Promise<void> {
  await updateAssetSessionSyncEntry(platform, (entry) => ({
    ...entry,
    lastErrorMessage: null,
    lastSyncedAt: Date.now(),
    revision: assetResponse.revision,
    skipNextPageSync,
    skipNextPageSyncTabIds,
    status: "success",
    updatedAt: assetResponse.updatedAt,
  }));
}

function assertActiveExtensionSession(sessionRevisionAtStart: number): void {
  if (sessionRevisionAtStart !== getExtensionSessionLifecycleRevision()) {
    throw new Error("Extension session changed while asset access was still running.");
  }
}
