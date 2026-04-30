import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { getChromeStorageValue, setChromeStorageValue } from "@/lib/storage/chromeStorage";

const injectionCooldownStorageKey = "assetManager.injectionCooldown";
export const injectionCooldownMs = 5 * 6000 * 1_000;

function getInjectionCooldownStorageKey(platform: AssetPlatform): string {
  return `${injectionCooldownStorageKey}.${platform}`;
}

export async function isInjectionCooldownActive(
  platform: AssetPlatform,
  now = Date.now(),
): Promise<boolean> {
  const lastInjectedAt = await getChromeStorageValue<number>(
    getInjectionCooldownStorageKey(platform),
  );

  if (lastInjectedAt === null) {
    return false;
  }

  return now - lastInjectedAt <= injectionCooldownMs;
}

export async function markInjectionCooldown(
  platform: AssetPlatform,
  now = Date.now(),
): Promise<void> {
  await setChromeStorageValue(getInjectionCooldownStorageKey(platform), now);
}
