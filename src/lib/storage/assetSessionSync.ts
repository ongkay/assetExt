import { assetPlatforms, type AssetPlatform } from "@/lib/asset-access/platforms";

const assetSessionSyncStorageKey = "assetManager.assetSessionSync";

export type AssetSessionSyncStatus = "idle" | "running" | "success" | "failed" | "skipped";

export type AssetSessionSyncEntry = {
  fallbackUsed: boolean;
  lastErrorMessage: string | null;
  lastSyncedAt: number | null;
  status: AssetSessionSyncStatus;
};

export type AssetSessionSyncState = Record<AssetPlatform, AssetSessionSyncEntry>;

let inMemoryAssetSessionSyncState: AssetSessionSyncState | null = null;

export function createAssetSessionSyncEntry(): AssetSessionSyncEntry {
  return {
    fallbackUsed: false,
    lastErrorMessage: null,
    lastSyncedAt: null,
    status: "idle",
  };
}

export function createEmptyAssetSessionSyncState(): AssetSessionSyncState {
  return {
    tradingview: createAssetSessionSyncEntry(),
    fxtester: createAssetSessionSyncEntry(),
  };
}

export async function readAssetSessionSyncState(): Promise<AssetSessionSyncState> {
  const storageArea = getChromeSessionStorageArea();

  if (!storageArea) {
    return cloneAssetSessionSyncState(inMemoryAssetSessionSyncState);
  }

  const storedValues = await storageArea.get(assetSessionSyncStorageKey);
  const storedState = storedValues[assetSessionSyncStorageKey] as Partial<AssetSessionSyncState> | undefined;

  return normalizeAssetSessionSyncState(storedState);
}

export async function writeAssetSessionSyncState(
  assetSessionSyncState: AssetSessionSyncState,
): Promise<void> {
  const normalizedState = normalizeAssetSessionSyncState(assetSessionSyncState);
  const storageArea = getChromeSessionStorageArea();

  if (!storageArea) {
    inMemoryAssetSessionSyncState = normalizedState;
    return;
  }

  await storageArea.set({ [assetSessionSyncStorageKey]: normalizedState });
}

export async function updateAssetSessionSyncEntry(
  platform: AssetPlatform,
  updateEntry: (entry: AssetSessionSyncEntry) => AssetSessionSyncEntry,
): Promise<AssetSessionSyncState> {
  const currentState = await readAssetSessionSyncState();
  const nextState = {
    ...currentState,
    [platform]: updateEntry(currentState[platform]),
  } satisfies AssetSessionSyncState;

  await writeAssetSessionSyncState(nextState);

  return nextState;
}

export async function clearAssetSessionSyncState(): Promise<void> {
  const storageArea = getChromeSessionStorageArea();

  if (!storageArea) {
    inMemoryAssetSessionSyncState = null;
    return;
  }

  await storageArea.remove(assetSessionSyncStorageKey);
}

function cloneAssetSessionSyncState(
  assetSessionSyncState: AssetSessionSyncState | null,
): AssetSessionSyncState {
  return normalizeAssetSessionSyncState(assetSessionSyncState ?? undefined);
}

function normalizeAssetSessionSyncState(
  assetSessionSyncState: Partial<AssetSessionSyncState> | undefined,
): AssetSessionSyncState {
  const emptyState = createEmptyAssetSessionSyncState();

  for (const platform of assetPlatforms) {
    const currentEntry = assetSessionSyncState?.[platform];

    if (!currentEntry) {
      continue;
    }

    emptyState[platform] = {
      ...emptyState[platform],
      ...currentEntry,
    };
  }

  return emptyState;
}

function getChromeSessionStorageArea(): chrome.storage.SessionStorageArea | null {
  if (typeof chrome === "undefined" || !chrome.storage?.session) {
    return null;
  }

  return chrome.storage.session;
}
