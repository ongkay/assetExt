export const tvOwnedLayoutOperationsStorageKey = "assetManager.tradingviewOwnedLayoutOperations";

export const tvOwnedLayoutOperationTtlMs = 20_000;

export type TvOwnedLayoutOperationKind = "copy" | "create";

export type TvOwnedLayoutOperation = {
  candidateTabIds: number[];
  createdAt: number;
  expectedTitle: string;
  kind: TvOwnedLayoutOperationKind;
  openInNewTab: boolean;
  operationId: string;
  originTabId: number;
  provisionalChartId: string | null;
  publicId: string;
  sourceChartId: string | null;
  targetTabId: number | null;
};

export type TvOwnedLayoutOperationsRecord = Record<string, TvOwnedLayoutOperation>;

let pendingTvOwnedLayoutOperationWrite: Promise<void> = Promise.resolve();

export async function readTvOwnedLayoutOperationsRecord(): Promise<TvOwnedLayoutOperationsRecord> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return {};
  }

  const storedValues = await chrome.storage.local.get(tvOwnedLayoutOperationsStorageKey);
  const storedOperations = storedValues[tvOwnedLayoutOperationsStorageKey];

  if (!storedOperations || typeof storedOperations !== "object") {
    return {};
  }

  return normalizeTvOwnedLayoutOperationsRecord(storedOperations as TvOwnedLayoutOperationsRecord);
}

export async function writeTvOwnedLayoutOperationsRecord(
  operationsRecord: TvOwnedLayoutOperationsRecord,
): Promise<TvOwnedLayoutOperationsRecord> {
  const normalizedOperationsRecord = normalizeTvOwnedLayoutOperationsRecord(operationsRecord);

  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return normalizedOperationsRecord;
  }

  await chrome.storage.local.set({
    [tvOwnedLayoutOperationsStorageKey]: normalizedOperationsRecord,
  });

  return normalizedOperationsRecord;
}

export function queueTvOwnedLayoutOperationWrite<TValue>(
  writeOperation: () => Promise<TValue>,
): Promise<TValue> {
  const nextWrite = pendingTvOwnedLayoutOperationWrite.then(writeOperation, writeOperation);

  pendingTvOwnedLayoutOperationWrite = nextWrite.then(
    () => undefined,
    () => undefined,
  );

  return nextWrite;
}

export function normalizeTvOwnedLayoutOperation(
  operation: TvOwnedLayoutOperation | null | undefined,
): TvOwnedLayoutOperation | null {
  if (!operation) {
    return null;
  }

  const operationId = operation.operationId.trim();
  const publicId = operation.publicId.trim();
  const expectedTitle = operation.expectedTitle.trim();

  if (!operationId || !publicId || !expectedTitle || !Number.isInteger(operation.originTabId)) {
    return null;
  }

  return {
    candidateTabIds: Array.isArray(operation.candidateTabIds)
      ? operation.candidateTabIds.filter((candidateTabId) => Number.isInteger(candidateTabId))
      : [],
    createdAt: Number.isFinite(operation.createdAt) ? operation.createdAt : Date.now(),
    expectedTitle,
    kind: operation.kind,
    openInNewTab: operation.openInNewTab === true,
    operationId,
    originTabId: operation.originTabId,
    provisionalChartId: operation.provisionalChartId?.trim() || null,
    publicId,
    sourceChartId: operation.sourceChartId?.trim() || null,
    targetTabId: Number.isInteger(operation.targetTabId) ? operation.targetTabId : null,
  };
}

export function isFreshTvOwnedLayoutOperation(operation: TvOwnedLayoutOperation | null, now = Date.now()): boolean {
  if (!operation) {
    return false;
  }

  return now - operation.createdAt <= tvOwnedLayoutOperationTtlMs;
}

function normalizeTvOwnedLayoutOperationsRecord(
  operationsRecord: TvOwnedLayoutOperationsRecord,
): TvOwnedLayoutOperationsRecord {
  return Object.fromEntries(
    Object.entries(operationsRecord).flatMap(([publicId, operation]) => {
      const normalizedOperation = normalizeTvOwnedLayoutOperation(operation);

      return normalizedOperation ? [[publicId, normalizedOperation]] : [];
    }),
  );
}
