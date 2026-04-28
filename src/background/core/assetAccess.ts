import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";
import { getAutomaticAssetMode } from "@/lib/asset-access/mode";
import { fetchExtensionAsset } from "@/lib/api/extensionApi";
import type { ExtensionAssetResponse, ExtensionMode } from "@/lib/api/extensionApiTypes";
import { readBootstrapCache } from "@/lib/storage/bootstrapCache";
import { markInjectionCooldown } from "@/lib/storage/injectionCooldown";
import { markPopupNavigationAutoAccessSkip } from "@/lib/storage/popupNavigationAutoAccessSkip";

import { createExtensionApiConfig } from "./bootstrap";
import { clearAssetPlatformCookies, injectExtensionCookies } from "./cookies";
import { startHeartbeat } from "./heartbeat";
import { openOrReloadTab } from "./tabs";

export type RunAssetAccessOptions = {
  mode?: ExtensionMode;
  platform: AssetPlatform;
  shouldNavigate: boolean;
  tabId?: number;
};

export async function runAssetAccess(
  options: RunAssetAccessOptions,
): Promise<ExtensionAssetResponse> {
  const mode = options.mode ?? (await readAutomaticAssetMode(options.platform));
  let assetResponse = await requestAssetResponse(options.platform, mode ?? undefined);

  if (assetResponse.status === "selection_required") {
    assetResponse = await requestAssetResponse(
      options.platform,
      getAutomaticModeFromSelection(assetResponse),
    );
  }

  if (assetResponse.status !== "ready") {
    return assetResponse;
  }

  await clearAssetPlatformCookies(options.platform);
  await injectExtensionCookies(assetResponse.cookies);
  await markInjectionCooldown(options.platform);

  if (options.shouldNavigate) {
    const platformConfig = getAssetPlatformConfig(options.platform);
    await markPopupNavigationAutoAccessSkip(options.platform);
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

async function requestAssetResponse(
  platform: AssetPlatform,
  mode?: ExtensionMode,
): Promise<ExtensionAssetResponse> {
  const assetResult = await fetchExtensionAsset(createExtensionApiConfig(), platform, mode);

  if (!assetResult.ok) {
    throw new Error(assetResult.error.message);
  }

  return assetResult.value;
}

function getAutomaticModeFromSelection(
  assetResponse: Extract<ExtensionAssetResponse, { status: "selection_required" }>,
): ExtensionMode {
  return assetResponse.availableModes.includes("private")
    ? "private"
    : assetResponse.defaultMode;
}

async function readAutomaticAssetMode(platform: AssetPlatform): Promise<ExtensionMode | null> {
  const bootstrapCache = await readBootstrapCache();
  const asset = bootstrapCache?.snapshot.assets?.find(
    (assetSummary) => assetSummary.platform === platform,
  );

  if (!asset) {
    return null;
  }

  return getAutomaticAssetMode(asset);
}
