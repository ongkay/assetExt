import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { consumePopupNavigationAutoAccessSkip } from "@/lib/storage/popupNavigationAutoAccessSkip";

import { shouldSkipRecentAutoAccessReload } from "./autoAccessReloadGuard";

type PrepareManualAutoAccessPageLoadOptions = {
  now?: number;
  stopPageLoad?: () => void;
};

export async function prepareManualAutoAccessPageLoad(
  platform: AssetPlatform,
  {
    now = Date.now(),
    stopPageLoad = () => window.stop(),
  }: PrepareManualAutoAccessPageLoadOptions = {},
): Promise<boolean> {
  if (shouldSkipRecentAutoAccessReload(platform, now)) {
    return false;
  }

  if (await consumePopupNavigationAutoAccessSkip(platform, now)) {
    return false;
  }

  stopPageLoad();
  return true;
}
