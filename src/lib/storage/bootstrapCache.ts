import type { ExtensionBootstrap } from "@/lib/api/extensionApiTypes";
import {
  getChromeStorageValue,
  removeChromeStorageValue,
  setChromeStorageValue,
} from "@/lib/storage/chromeStorage";

export const bootstrapCacheStorageKey = "assetManager.bootstrapCache";
export const bootstrapCacheTtlMs = 10 * 60 * 1_000;

export type BootstrapCacheRecord = {
  fetchedAt: number;
  isValid: boolean;
  lastErrorMessage?: string;
  snapshot: ExtensionBootstrap;
};

export function isBootstrapCacheExpired(
  bootstrapCacheRecord: BootstrapCacheRecord,
  now = Date.now(),
): boolean {
  return now - bootstrapCacheRecord.fetchedAt > bootstrapCacheTtlMs;
}

export function createBootstrapCacheRecord(
  snapshot: ExtensionBootstrap,
  now = Date.now(),
): BootstrapCacheRecord {
  return {
    fetchedAt: now,
    isValid: true,
    snapshot,
  };
}

export function createBootstrapCacheErrorRecord(
  bootstrapCacheRecord: BootstrapCacheRecord,
  lastErrorMessage: string,
): BootstrapCacheRecord {
  return {
    ...bootstrapCacheRecord,
    lastErrorMessage,
  };
}

export function createInvalidUnauthenticatedBootstrapCache(
  loginUrl: string,
  now = Date.now(),
): BootstrapCacheRecord {
  return {
    fetchedAt: now,
    isValid: false,
    snapshot: {
      auth: { status: "unauthenticated", loginUrl },
      version: { status: "supported" },
    },
  };
}

export function readBootstrapCache(): Promise<BootstrapCacheRecord | null> {
  return getChromeStorageValue<BootstrapCacheRecord>(bootstrapCacheStorageKey);
}

export function writeBootstrapCache(
  bootstrapCacheRecord: BootstrapCacheRecord,
): Promise<void> {
  return setChromeStorageValue(bootstrapCacheStorageKey, bootstrapCacheRecord);
}

export function clearBootstrapCache(): Promise<void> {
  return removeChromeStorageValue(bootstrapCacheStorageKey);
}
