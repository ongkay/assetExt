import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";
import { fetchExtensionAsset } from "@/lib/api/extensionApi";
import type { ExtensionAssetResponse, ExtensionMode } from "@/lib/api/extensionApiTypes";
import { markInjectionCooldown } from "@/lib/storage/injectionCooldown";

import { createExtensionApiConfig } from "./bootstrap";
import { clearAssetPlatformCookies, injectExtensionCookies } from "./cookies";
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
  const assetResult = await fetchExtensionAsset(
    createExtensionApiConfig(),
    options.platform,
    options.mode,
  );

  if (!assetResult.ok) {
    throw new Error(assetResult.error.message);
  }

  if (assetResult.value.status !== "ready") {
    return assetResult.value;
  }

  await clearAssetPlatformCookies(options.platform);
  await injectExtensionCookies(assetResult.value.cookies);
  await markInjectionCooldown(options.platform);

  if (options.shouldNavigate) {
    const platformConfig = getAssetPlatformConfig(options.platform);
    await openOrReloadTab(platformConfig.targetUrl, options.tabId);
  }

  return assetResult.value;
}
