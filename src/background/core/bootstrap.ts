import { fetchExtensionBootstrap, postExtensionLogout } from "@/lib/api/extensionApi";
import { getExtensionApiBaseUrl, isDev, type ExtensionApiConfig } from "@/lib/api/extensionApiConfig";
import type { ExtensionBootstrap, ExtensionLogoutResponse } from "@/lib/api/extensionApiTypes";
import {
  clearBootstrapCache,
  createBootstrapCacheErrorRecord,
  createInvalidUnauthenticatedBootstrapCache,
  createBootstrapCacheRecord,
  isBootstrapCacheExpired,
  readBootstrapCache,
  writeBootstrapCache,
  type BootstrapCacheRecord,
} from "@/lib/storage/bootstrapCache";
import { clearStoredDeviceId } from "@/lib/storage/deviceIdentity";
import { clearInjectionCooldowns } from "@/lib/storage/injectionCooldown";
import { clearAssetSessionSyncState } from "@/lib/storage/assetSessionSync";

import { clearAllAssetPlatformCookies, clearPeerGuardManagedCookies } from "./cookies";
import { stopAllHeartbeats } from "./heartbeat";
import { ensureProductionOriginHeaderRuleReady } from "./productionOrigin";
import { clearManagedProxyState } from "./proxy";

let bootstrapSyncPromise: Promise<BootstrapCacheRecord> | null = null;
let bootstrapWriteRevision = 0;
let extensionSessionLifecycleRevision = 0;
let latestExplicitBootstrapCache: BootstrapCacheRecord | null = null;

export async function readBootstrapState(forceRefresh: boolean) {
  const previousCache = await readBootstrapCache();

  if (forceRefresh || !previousCache || !previousCache.isValid) {
    const cache = await syncBootstrapCache(previousCache);
    return { cache, isSyncing: false };
  }

  if (!isBootstrapCacheExpired(previousCache)) {
    return { cache: previousCache, isSyncing: false };
  }

  void syncBootstrapCache(previousCache).catch(() => undefined);
  return { cache: previousCache, isSyncing: true };
}

export async function forceRefreshBootstrapCache(): Promise<BootstrapCacheRecord> {
  const previousCache = await readBootstrapCache();

  return syncBootstrapCache(previousCache);
}

export async function replaceBootstrapCacheFromSnapshot(
  snapshot: ExtensionBootstrap,
): Promise<BootstrapCacheRecord> {
  const nextCache = createBootstrapCacheRecord(snapshot);
  latestExplicitBootstrapCache = nextCache;
  bootstrapWriteRevision += 1;
  await writeBootstrapCache(nextCache);
  await clearAssetSessionSyncState();

  return nextCache;
}

export async function logoutExtensionSession(): Promise<ExtensionLogoutResponse> {
  await ensureProductionOriginHeaderRuleReady();
  const extensionApiConfig = createExtensionApiConfig();
  const logoutResult = await postExtensionLogout(extensionApiConfig);

  if (!logoutResult.ok) {
    throw new Error(logoutResult.error.message);
  }

  latestExplicitBootstrapCache = null;
  bootstrapWriteRevision += 1;
  extensionSessionLifecycleRevision += 1;
  await clearBootstrapCache();
  await clearAssetSessionSyncState();
  await clearManagedProxyState();
  await clearAllAssetPlatformCookies();
  await stopAllHeartbeats();

  return {
    ...logoutResult.value,
    redirectTo: new URL(logoutResult.value.redirectTo, extensionApiConfig.apiBaseUrl).toString(),
  };
}

export async function markExtensionSessionUnauthenticated(loginUrl?: string | null): Promise<string> {
  const redirectTo = createAbsoluteExtensionLoginUrl(loginUrl);

  latestExplicitBootstrapCache = null;
  bootstrapWriteRevision += 1;
  extensionSessionLifecycleRevision += 1;
  await writeBootstrapCache(createInvalidUnauthenticatedBootstrapCache(redirectTo));
  await clearAssetSessionSyncState();
  await clearManagedProxyState();
  await clearAllAssetPlatformCookies();
  await stopAllHeartbeats();

  return redirectTo;
}

export async function clearExtensionSessionArtifactsForPeerGuard(): Promise<void> {
  latestExplicitBootstrapCache = null;
  bootstrapWriteRevision += 1;
  extensionSessionLifecycleRevision += 1;
  await clearBootstrapCache();
  await clearAssetSessionSyncState();
  await clearManagedProxyState();
  await clearPeerGuardManagedCookies();
  await clearStoredDeviceId();
  await clearInjectionCooldowns();
  await stopAllHeartbeats();
}

export function createExtensionApiConfig(): ExtensionApiConfig {
  return {
    apiBaseUrl: getExtensionApiBaseUrl(),
    extensionId: chrome.runtime.id ?? null,
    extensionVersion: chrome.runtime.getManifest().version,
    isDev,
  };
}

export function createAbsoluteExtensionLoginUrl(loginUrl?: string | null): string {
  return new URL(loginUrl?.trim() || "/login", getExtensionApiBaseUrl()).toString();
}

export function getExtensionSessionLifecycleRevision(): number {
  return extensionSessionLifecycleRevision;
}

async function syncBootstrapCache(previousCache: BootstrapCacheRecord | null): Promise<BootstrapCacheRecord> {
  if (bootstrapSyncPromise) {
    return bootstrapSyncPromise;
  }

  const writeRevisionAtSyncStart = bootstrapWriteRevision;

  bootstrapSyncPromise = fetchAndWriteBootstrapCache(previousCache, writeRevisionAtSyncStart).finally(() => {
    bootstrapSyncPromise = null;
  });

  return bootstrapSyncPromise;
}

async function fetchAndWriteBootstrapCache(
  previousCache: BootstrapCacheRecord | null,
  writeRevisionAtSyncStart: number,
): Promise<BootstrapCacheRecord> {
  try {
    await ensureProductionOriginHeaderRuleReady();
    const bootstrapResult = await fetchExtensionBootstrap(createExtensionApiConfig());

    if (bootstrapResult.ok) {
      if (bootstrapResult.value.auth.status === "unauthenticated") {
        const nextCache = createInvalidUnauthenticatedBootstrapCache(bootstrapResult.value.auth.loginUrl);

        return writeBootstrapCacheIfSyncIsCurrent(nextCache, writeRevisionAtSyncStart);
      }

      const nextCache = createBootstrapCacheRecord(bootstrapResult.value);
      return writeBootstrapCacheIfSyncIsCurrent(nextCache, writeRevisionAtSyncStart);
    }

    if (!previousCache) {
      throw new Error(bootstrapResult.error.message);
    }

    const nextCache = createBootstrapCacheErrorRecord(previousCache, bootstrapResult.error.message);

    return writeBootstrapCacheIfSyncIsCurrent(nextCache, writeRevisionAtSyncStart);
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    if (!previousCache) {
      throw new Error(errorMessage);
    }

    const nextCache = createBootstrapCacheErrorRecord(previousCache, errorMessage);

    return writeBootstrapCacheIfSyncIsCurrent(nextCache, writeRevisionAtSyncStart);
  }
}

async function writeBootstrapCacheIfSyncIsCurrent(
  nextCache: BootstrapCacheRecord,
  writeRevisionAtSyncStart: number,
): Promise<BootstrapCacheRecord> {
  if (bootstrapWriteRevision !== writeRevisionAtSyncStart) {
    const latestCache = await readBootstrapCache();

    if (latestCache) {
      return latestCache;
    }

    if (latestExplicitBootstrapCache) {
      return latestExplicitBootstrapCache;
    }

    return nextCache;
  }

  await writeBootstrapCache(nextCache);

  return nextCache;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Bootstrap request failed.";
}
