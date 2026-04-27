import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { injectionCooldownMs } from "@/lib/storage/injectionCooldown";

const autoAccessReloadStorageKey = "assetManager.autoAccessReload";

export function shouldSkipRecentAutoAccessReload(
  platform: AssetPlatform,
  now = Date.now(),
): boolean {
  const storage = getSessionStorage();

  if (!storage) {
    return false;
  }

  const lastReloadedAt = Number.parseInt(
    storage.getItem(getAutoAccessReloadStorageKey(platform)) ?? "",
    10,
  );

  if (!Number.isFinite(lastReloadedAt)) {
    return false;
  }

  return now - lastReloadedAt <= injectionCooldownMs;
}

export function markRecentAutoAccessReload(platform: AssetPlatform, now = Date.now()): void {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  storage.setItem(getAutoAccessReloadStorageKey(platform), String(now));
}

function getAutoAccessReloadStorageKey(platform: AssetPlatform): string {
  return `${autoAccessReloadStorageKey}.${platform}`;
}

function getSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
