import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";
import { fetchExtensionAsset } from "@/lib/api/extensionApi";
import type { ExtensionAssetReadyResponse, ExtensionAssetResponse } from "@/lib/api/extensionApiTypes";
import { markInjectionCooldown } from "@/lib/storage/injectionCooldown";

import { createExtensionApiConfig } from "./bootstrap";
import { clearAssetPlatformCookies, injectExtensionCookies } from "./cookies";
import { startHeartbeat } from "./heartbeat";
import { ensureProductionOriginHeaderRuleReady } from "./productionOrigin";
import { openOrReloadTab } from "./tabs";

export type RunAssetAccessOptions = {
  platform: AssetPlatform;
  shouldNavigate: boolean;
  tabId?: number;
};

type PrepareAssetAccessSessionOptions = {
  platform: AssetPlatform;
};

export async function runAssetAccess(options: RunAssetAccessOptions): Promise<ExtensionAssetResponse> {
  const assetResponse = await prepareAssetAccessSession(options);

  if (assetResponse.status !== "ready") {
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
  const assetResponse = await requestAssetResponse(options.platform);

  if (assetResponse.status !== "ready") {
    return assetResponse;
  }

  await applyReadyAssetCookies(options.platform, assetResponse);

  return assetResponse;
}

async function requestAssetResponse(platform: AssetPlatform): Promise<ExtensionAssetResponse> {
  await ensureProductionOriginHeaderRuleReady();
  const assetResult = await fetchExtensionAsset(createExtensionApiConfig(), platform);

  if (!assetResult.ok) {
    throw new Error(assetResult.error.message);
  }

  return assetResult.value;
}

async function applyReadyAssetCookies(
  platform: AssetPlatform,
  assetResponse: ExtensionAssetReadyResponse,
): Promise<void> {
  await clearAssetPlatformCookies(platform);
  await injectExtensionCookies(assetResponse.cookies);
  await markInjectionCooldown(platform);
}
