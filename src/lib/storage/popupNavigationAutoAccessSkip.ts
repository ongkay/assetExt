import type { AssetPlatform } from "@/lib/asset-access/platforms";

import {
  getChromeStorageValue,
  removeChromeStorageValue,
  setChromeStorageValue,
} from "./chromeStorage";

const popupNavigationAutoAccessSkipStorageKey = "assetManager.popupNavigationAutoAccessSkip";
const popupNavigationAutoAccessSkipTtlMs = 30_000;

function getPopupNavigationAutoAccessSkipStorageKey(platform: AssetPlatform): string {
  return `${popupNavigationAutoAccessSkipStorageKey}.${platform}`;
}

export function markPopupNavigationAutoAccessSkip(
  platform: AssetPlatform,
  now = Date.now(),
): Promise<void> {
  return setChromeStorageValue(getPopupNavigationAutoAccessSkipStorageKey(platform), now);
}

export async function consumePopupNavigationAutoAccessSkip(
  platform: AssetPlatform,
  now = Date.now(),
): Promise<boolean> {
  const storageKey = getPopupNavigationAutoAccessSkipStorageKey(platform);
  const markedAt = await getChromeStorageValue<number>(storageKey);

  if (markedAt === null) {
    return false;
  }

  await removeChromeStorageValue(storageKey);

  return now - markedAt <= popupNavigationAutoAccessSkipTtlMs;
}
