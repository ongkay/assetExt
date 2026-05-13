import { assetPlatforms, type AssetPlatform } from "@/lib/asset-access/platforms";
import type {
  AssetProxyConflictState,
  AssetProxyPlatformState,
  AssetProxyState,
} from "@/lib/proxy/assetProxy";

export const assetProxyStateStorageKey = "assetManager.assetProxyState";

let assetProxyWriteQueue = Promise.resolve();
let inMemoryAssetProxyState: AssetProxyState | null = null;

export function createEmptyAssetProxyPlatformState(): AssetProxyPlatformState {
  return {
    proxy: null,
    updatedAt: null,
  };
}

export function createEmptyAssetProxyConflictState(): AssetProxyConflictState {
  return {
    detectedAt: null,
    extensions: [],
    isActive: false,
    levelOfControl: null,
    message: null,
  };
}

export function createEmptyAssetProxyState(): AssetProxyState {
  return {
    conflict: createEmptyAssetProxyConflictState(),
    platforms: {
      tradingview: createEmptyAssetProxyPlatformState(),
      fxtester: createEmptyAssetProxyPlatformState(),
    },
  };
}

export async function readAssetProxyState(): Promise<AssetProxyState> {
  const storageArea = getChromeLocalStorageArea();

  if (!storageArea) {
    return cloneAssetProxyState(inMemoryAssetProxyState);
  }

  const storedValues = await storageArea.get(assetProxyStateStorageKey);
  const storedState = storedValues[assetProxyStateStorageKey] as Partial<AssetProxyState> | undefined;

  return normalizeAssetProxyState(storedState);
}

export async function writeAssetProxyState(assetProxyState: AssetProxyState): Promise<void> {
  await enqueueAssetProxyMutation(() => writeAssetProxyStateInternal(assetProxyState));
}

export async function updateAssetProxyState(
  updateState: (assetProxyState: AssetProxyState) => AssetProxyState,
): Promise<AssetProxyState> {
  return enqueueAssetProxyMutation(async () => {
    const currentState = await readAssetProxyState();
    const nextState = updateState(currentState);

    await writeAssetProxyStateInternal(nextState);

    return nextState;
  });
}

export async function updateAssetProxyPlatformState(
  platform: AssetPlatform,
  updatePlatformState: (platformState: AssetProxyPlatformState) => AssetProxyPlatformState,
): Promise<AssetProxyState> {
  return updateAssetProxyState((assetProxyState) => ({
    ...assetProxyState,
    platforms: {
      ...assetProxyState.platforms,
      [platform]: updatePlatformState(assetProxyState.platforms[platform]),
    },
  }));
}

export async function updateAssetProxyConflictState(
  updateConflictState: (conflictState: AssetProxyConflictState) => AssetProxyConflictState,
): Promise<AssetProxyState> {
  return updateAssetProxyState((assetProxyState) => ({
    ...assetProxyState,
    conflict: updateConflictState(assetProxyState.conflict),
  }));
}

export async function clearAssetProxyState(): Promise<void> {
  await enqueueAssetProxyMutation(clearAssetProxyStateInternal);
}

function writeAssetProxyStateInternal(assetProxyState: AssetProxyState): Promise<void> {
  const normalizedState = normalizeAssetProxyState(assetProxyState);
  const storageArea = getChromeLocalStorageArea();

  if (!storageArea) {
    inMemoryAssetProxyState = normalizedState;
    return Promise.resolve();
  }

  return storageArea.set({ [assetProxyStateStorageKey]: normalizedState });
}

function clearAssetProxyStateInternal(): Promise<void> {
  const storageArea = getChromeLocalStorageArea();

  if (!storageArea) {
    inMemoryAssetProxyState = null;
    return Promise.resolve();
  }

  return storageArea.remove(assetProxyStateStorageKey);
}

function normalizeAssetProxyState(assetProxyState: Partial<AssetProxyState> | undefined): AssetProxyState {
  const emptyState = createEmptyAssetProxyState();

  if (assetProxyState?.conflict) {
    emptyState.conflict = {
      ...emptyState.conflict,
      ...assetProxyState.conflict,
    };
  }

  if (assetProxyState?.platforms) {
    for (const platform of assetPlatforms) {
      const currentPlatformState = assetProxyState.platforms[platform];

      if (!currentPlatformState) {
        continue;
      }

      emptyState.platforms[platform] = {
        ...emptyState.platforms[platform],
        ...currentPlatformState,
      };
    }
  }

  return emptyState;
}

function cloneAssetProxyState(assetProxyState: AssetProxyState | null): AssetProxyState {
  return normalizeAssetProxyState(assetProxyState ?? undefined);
}

function getChromeLocalStorageArea(): chrome.storage.LocalStorageArea | null {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  return chrome.storage.local;
}

function enqueueAssetProxyMutation<TResult>(mutation: () => Promise<TResult>): Promise<TResult> {
  const nextMutationPromise = assetProxyWriteQueue.then(mutation, mutation);

  assetProxyWriteQueue = nextMutationPromise.then(
    () => undefined,
    () => undefined,
  );

  return nextMutationPromise;
}
