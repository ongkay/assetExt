const tvOwnedLayoutSyncStateStorageKey = "assetManager.tradingviewOwnedLayoutSyncState";

let inMemoryTvOwnedLayoutSyncState: TvOwnedLayoutSyncState | null = null;
let pendingTvOwnedLayoutSyncStateWrite = Promise.resolve();

export type TvOwnedLayoutSyncStatus = "idle" | "running" | "success" | "failed";

export type TvOwnedLayoutSyncState = {
  lastErrorMessage: string | null;
  lastSyncedAt: number | null;
  lastUploadedFingerprint: string | null;
  publicId: string | null;
  status: TvOwnedLayoutSyncStatus;
};

export function createEmptyTvOwnedLayoutSyncState(): TvOwnedLayoutSyncState {
  return {
    lastErrorMessage: null,
    lastSyncedAt: null,
    lastUploadedFingerprint: null,
    publicId: null,
    status: "idle",
  };
}

export async function readTvOwnedLayoutSyncState(): Promise<TvOwnedLayoutSyncState> {
  const storageArea = getChromeLocalStorageArea();

  if (!storageArea) {
    return cloneTvOwnedLayoutSyncState(inMemoryTvOwnedLayoutSyncState);
  }

  const storedValues = await storageArea.get(tvOwnedLayoutSyncStateStorageKey);

  return normalizeTvOwnedLayoutSyncState(
    storedValues[tvOwnedLayoutSyncStateStorageKey] as TvOwnedLayoutSyncState | undefined,
  );
}

export async function writeTvOwnedLayoutSyncState(syncState: TvOwnedLayoutSyncState): Promise<void> {
  await enqueueTvOwnedLayoutSyncStateMutation(() => {
    const normalizedSyncState = normalizeTvOwnedLayoutSyncState(syncState);
    const storageArea = getChromeLocalStorageArea();

    if (!storageArea) {
      inMemoryTvOwnedLayoutSyncState = normalizedSyncState;
      return Promise.resolve();
    }

    return storageArea.set({
      [tvOwnedLayoutSyncStateStorageKey]: normalizedSyncState,
    });
  });
}

export async function clearTvOwnedLayoutSyncState(): Promise<void> {
  await enqueueTvOwnedLayoutSyncStateMutation(() => {
    const storageArea = getChromeLocalStorageArea();

    if (!storageArea) {
      inMemoryTvOwnedLayoutSyncState = null;
      return Promise.resolve();
    }

    return storageArea.remove(tvOwnedLayoutSyncStateStorageKey);
  });
}

function normalizeTvOwnedLayoutSyncState(
  syncState: TvOwnedLayoutSyncState | undefined,
): TvOwnedLayoutSyncState {
  if (!syncState) {
    return createEmptyTvOwnedLayoutSyncState();
  }

  return {
    lastErrorMessage: typeof syncState.lastErrorMessage === "string" ? syncState.lastErrorMessage : null,
    lastSyncedAt: Number.isFinite(syncState.lastSyncedAt) ? syncState.lastSyncedAt : null,
    lastUploadedFingerprint: syncState.lastUploadedFingerprint?.trim() || null,
    publicId: syncState.publicId?.trim() || null,
    status: isTvOwnedLayoutSyncStatus(syncState.status) ? syncState.status : "idle",
  };
}

function isTvOwnedLayoutSyncStatus(status: unknown): status is TvOwnedLayoutSyncStatus {
  return status === "idle" || status === "running" || status === "success" || status === "failed";
}

function cloneTvOwnedLayoutSyncState(syncState: TvOwnedLayoutSyncState | null): TvOwnedLayoutSyncState {
  return normalizeTvOwnedLayoutSyncState(syncState ?? undefined);
}

function getChromeLocalStorageArea(): chrome.storage.LocalStorageArea | null {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  return chrome.storage.local;
}

function enqueueTvOwnedLayoutSyncStateMutation<TResult>(mutation: () => Promise<TResult>): Promise<TResult> {
  const nextMutationPromise = pendingTvOwnedLayoutSyncStateWrite.then(mutation, mutation);

  pendingTvOwnedLayoutSyncStateWrite = nextMutationPromise.then(
    () => undefined,
    () => undefined,
  );

  return nextMutationPromise;
}
