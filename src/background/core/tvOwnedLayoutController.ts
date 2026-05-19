import { readBootstrapCache } from "@/lib/storage/bootstrapCache";
import {
  queueTvOwnedLayoutOperationWrite,
  readTvOwnedLayoutOperationsRecord,
  writeTvOwnedLayoutOperationsRecord,
  type TvOwnedLayoutOperation,
  type TvOwnedLayoutOperationKind,
} from "@/lib/storage/tvOwnedLayoutOperations";
import {
  clearPendingTvOwnedLayoutIntent,
  createOwnedTvLayoutFromChartUrl,
  readTvOwnedLayoutState,
  removeTvOwnedLayout,
  renameTvOwnedLayout,
  resolveLastOpenedTvOwnedLayoutUrlWithFallback,
  rememberTvOwnedLayout,
  setLastOpenedTvOwnedLayout,
  setPendingTvOwnedLayoutIntent,
  upsertTvOwnedLayout,
} from "@/lib/storage/tvOwnedLayouts";
import { getRestrictedTradingViewPublicId } from "@/lib/tradingview/tvAccessState";
import {
  createTradingViewChartUrl,
  defaultTradingViewChartUrl,
  getTradingViewChartId,
  isTradingViewChartPath,
  isTradingViewHostname,
  normalizeTradingViewChartUrl,
  resolveTradingViewLaunchUrl,
} from "@/lib/tradingview/tvChartUrl";
import { syncTradingViewOwnedLayouts } from "./tvOwnedLayoutSync";
import { getRestrictedTradingViewLaunchUrl } from "@/lib/tradingview/tvAccessState";

type TvOwnedLayoutRouteStatus = {
  currentChartId: string | null;
  expectedTitle: string | null;
  isPendingOperation: boolean;
  isRestricted: boolean;
  operationId: string | null;
  pendingOperationKind: TvOwnedLayoutOperationKind | null;
  redirectUrl: string | null;
  shouldAllow: boolean;
};

type SubmitTvOwnedLayoutOperationInput = {
  expectedTitle: string;
  kind: TvOwnedLayoutOperationKind;
  openInNewTab?: boolean;
  originTabId: number;
  publicId: string;
  sourceChartId: string | null;
};

type RememberTvOwnedLayoutInput = {
  chartId: string;
  publicId: string;
  shouldMarkAsOpened: boolean;
  title: string;
  updatedAt: number;
  url: string;
};

type ConfirmTvOwnedLayoutPageInput = {
  chartId: string;
  publicId: string;
  tabId: number;
  url: string;
};

const pendingSameTabCreateRouteBindingWindowMs = 10_000;
const pendingNewTabCreateTargetBindingWindowMs = 5_000;

type InvalidateTvOwnedLayoutPageInput = {
  chartId: string;
  publicId: string;
};

export async function resolveTradingViewAssetTargetUrl(
  assetLaunchUrl: string | null = null,
): Promise<string> {
  const bootstrapCacheRecord = await readBootstrapCache();
  const publicId = getRestrictedTradingViewPublicId(bootstrapCacheRecord);
  const fallbackLaunchUrl = resolveTradingViewLaunchUrl(
    assetLaunchUrl ?? getRestrictedTradingViewLaunchUrl(bootstrapCacheRecord),
  );

  if (!publicId) {
    return fallbackLaunchUrl ?? defaultTradingViewChartUrl;
  }

  return resolvePreferredTradingViewRedirectUrl(publicId, fallbackLaunchUrl);
}

export async function resolveRestrictedTradingViewRouteStatus(
  tabUrl: string,
  tabId?: number,
  openerTabId?: number,
): Promise<TvOwnedLayoutRouteStatus> {
  const parsedUrl = tryParseUrl(tabUrl);

  if (!parsedUrl || !isTradingViewHostname(parsedUrl.hostname)) {
    return createRouteStatus({ isRestricted: false, shouldAllow: true });
  }

  const bootstrapCacheRecord = await readBootstrapCache();
  const publicId = getRestrictedTradingViewPublicId(bootstrapCacheRecord);
  const fallbackLaunchUrl = resolveTradingViewLaunchUrl(
    getRestrictedTradingViewLaunchUrl(bootstrapCacheRecord),
  );

  if (!publicId) {
    return createRouteStatus({ isRestricted: false, shouldAllow: true });
  }

  const preferredRedirectUrl = await resolvePreferredTradingViewRedirectUrl(publicId, fallbackLaunchUrl);

  if (!isTradingViewChartPath(parsedUrl.pathname)) {
    return createRouteStatus({
      isRestricted: true,
      redirectUrl: preferredRedirectUrl,
      shouldAllow: false,
    });
  }

  if (normalizeTradingViewChartUrl(parsedUrl.toString()) === preferredRedirectUrl) {
    return createRouteStatus({
      currentChartId: getTradingViewChartId(parsedUrl.pathname),
      isRestricted: true,
      shouldAllow: true,
    });
  }

  const currentChartId = getTradingViewChartId(parsedUrl.pathname);

  if (!currentChartId) {
    return createRouteStatus({
      isRestricted: true,
      redirectUrl: await resolveLastOpenedTvOwnedLayoutUrlWithFallback(publicId, fallbackLaunchUrl),
      shouldAllow: false,
    });
  }

  const ownedLayoutState = await readTvOwnedLayoutState(publicId);

  if (ownedLayoutState.layouts.some((layout) => layout.chartId === currentChartId)) {
    return createRouteStatus({
      currentChartId,
      isRestricted: true,
      shouldAllow: true,
    });
  }

  const activeOperations = await readActiveTvOwnedLayoutOperations(publicId);

  if (activeOperations.length === 0 || typeof tabId !== "number") {
    return createRouteStatus({
      currentChartId,
      isRestricted: true,
      redirectUrl: preferredRedirectUrl,
      shouldAllow: false,
    });
  }

  let matchedOperation: TvOwnedLayoutOperation | null = null;

  for (const activeOperation of activeOperations) {
    matchedOperation = await bindOrMatchPendingOperation(activeOperation, {
      currentChartId,
      openerTabId,
      tabId,
    });

    if (matchedOperation) {
      break;
    }
  }

  if (!matchedOperation) {
    return createRouteStatus({
      currentChartId,
      isRestricted: true,
      redirectUrl: preferredRedirectUrl,
      shouldAllow: false,
    });
  }

  return createRouteStatus({
    currentChartId,
    expectedTitle: matchedOperation.expectedTitle,
    isPendingOperation: true,
    isRestricted: true,
    operationId: matchedOperation.operationId,
    pendingOperationKind: matchedOperation.kind,
    shouldAllow: true,
  });
}

export async function rememberTradingViewOwnedLayout(input: RememberTvOwnedLayoutInput): Promise<void> {
  const rememberedLayout = createOwnedTvLayoutFromChartUrl(input.url, input.title, input.updatedAt);

  if (!rememberedLayout) {
    return;
  }

  if (input.shouldMarkAsOpened) {
    await upsertTvOwnedLayout(input.publicId, rememberedLayout);
    return;
  }

  await rememberTvOwnedLayout(input.publicId, rememberedLayout);
}

export async function submitTradingViewOwnedLayoutOperation(
  input: SubmitTvOwnedLayoutOperationInput,
): Promise<TvOwnedLayoutOperation> {
  const nextOperation: TvOwnedLayoutOperation = {
    candidateTabIds: [],
    createdAt: Date.now(),
    expectedTitle: input.expectedTitle.trim(),
    kind: input.kind,
    openInNewTab: input.kind === "create" && input.openInNewTab === true,
    operationId: crypto.randomUUID(),
    originTabId: input.originTabId,
    provisionalChartId: null,
    publicId: input.publicId,
    sourceChartId: input.sourceChartId,
    targetTabId: null,
  };

  await queueTvOwnedLayoutOperationWrite(async () => {
    const operationsRecord = await readTvOwnedLayoutOperationsRecord();
    const nextOperationsRecord = Object.fromEntries(
      Object.entries(operationsRecord).filter(([, activeOperation]) => {
        return !(
          activeOperation.publicId === input.publicId && activeOperation.originTabId === input.originTabId
        );
      }),
    );

    nextOperationsRecord[nextOperation.operationId] = nextOperation;

    await writeTvOwnedLayoutOperationsRecord(nextOperationsRecord);
    await setPendingTvOwnedLayoutIntent(input.publicId, {
      createdAt: nextOperation.createdAt,
      kind: nextOperation.kind,
      sourceChartId: nextOperation.sourceChartId,
      title: nextOperation.expectedTitle,
    });
  });

  return nextOperation;
}

export async function confirmTradingViewOwnedLayoutPage(input: ConfirmTvOwnedLayoutPageInput): Promise<void> {
  const activeOperations = await readActiveTvOwnedLayoutOperations(input.publicId);

  for (const activeOperation of activeOperations) {
    if (activeOperation.provisionalChartId !== input.chartId || activeOperation.targetTabId !== input.tabId) {
      continue;
    }

    const createdLayout = createOwnedTvLayoutFromChartUrl(input.url, activeOperation.expectedTitle);

    if (createdLayout) {
      await upsertTvOwnedLayout(input.publicId, createdLayout);
    }

    await clearActiveTvOwnedLayoutOperationById(activeOperation.operationId, input.publicId);
    await syncTradingViewOwnedLayouts("tv_page_open");
    return;
  }

  const ownedLayoutState = await readTvOwnedLayoutState(input.publicId);

  if (ownedLayoutState.layouts.some((layout) => layout.chartId === input.chartId)) {
    await setLastOpenedTvOwnedLayout(input.publicId, input.chartId);
  }
}

export async function renameTradingViewOwnedLayout(
  publicId: string,
  chartId: string,
  title: string,
): Promise<void> {
  await renameTvOwnedLayout(publicId, chartId, title);
}

export async function completeTradingViewOwnedLayoutDelete(publicId: string, chartId: string): Promise<void> {
  await removeTvOwnedLayout(publicId, chartId);
}

export async function invalidateTradingViewOwnedLayoutPage(
  input: InvalidateTvOwnedLayoutPageInput,
): Promise<string> {
  const ownedLayoutState = await readTvOwnedLayoutState(input.publicId);
  const activeOperations = await readActiveTvOwnedLayoutOperations(input.publicId);

  if (ownedLayoutState.layouts.some((layout) => layout.chartId === input.chartId)) {
    await removeTvOwnedLayout(input.publicId, input.chartId);
    return resolveTradingViewAssetTargetUrl();
  }

  const matchingOperation =
    activeOperations.find((activeOperation) => activeOperation.provisionalChartId === input.chartId) ?? null;

  if (matchingOperation) {
    await clearActiveTvOwnedLayoutOperationById(matchingOperation.operationId, input.publicId);
    return resolveTradingViewAssetTargetUrl();
  }

  return resolveTradingViewAssetTargetUrl();
}

export async function clearTradingViewOwnedLayoutOperation(publicId: string, tabId?: number): Promise<void> {
  await clearTradingViewOwnedLayoutOperationById(publicId, undefined, tabId);
}

export async function clearTradingViewOwnedLayoutOperationById(
  publicId: string,
  operationId?: string,
  tabId?: number,
): Promise<void> {
  if (operationId) {
    await clearActiveTvOwnedLayoutOperationById(operationId, publicId);
    return;
  }

  if (typeof tabId !== "number") {
    await clearActiveTvOwnedLayoutOperationsByPublicId(publicId);
    return;
  }

  const activeOperations = await readActiveTvOwnedLayoutOperations(publicId);

  await Promise.all(
    activeOperations.flatMap((activeOperation) =>
      activeOperation.originTabId === tabId || activeOperation.targetTabId === tabId
        ? [clearActiveTvOwnedLayoutOperationById(activeOperation.operationId, publicId)]
        : [],
    ),
  );
}

export async function readTradingViewOwnedLayoutOperationStatus(
  publicId: string,
  operationId: string,
): Promise<{
  boundChartId: string | null;
  isActive: boolean;
  isBound: boolean;
  kind: TvOwnedLayoutOperationKind | null;
}> {
  const activeOperations = await readActiveTvOwnedLayoutOperations(publicId);
  const activeOperation = activeOperations.find((operation) => operation.operationId === operationId) ?? null;

  if (!activeOperation) {
    return {
      boundChartId: null,
      isActive: false,
      isBound: false,
      kind: null,
    };
  }

  return {
    boundChartId: activeOperation.provisionalChartId,
    isActive: true,
    isBound: activeOperation.targetTabId !== null || activeOperation.provisionalChartId !== null,
    kind: activeOperation.kind,
  };
}

export async function rememberTradingViewOwnedLayoutCreateCandidateTab(
  openerTabId?: number,
  targetTabId?: number,
): Promise<void> {
  if (!Number.isInteger(openerTabId) || !Number.isInteger(targetTabId)) {
    return;
  }

  const nextTargetTabId = Number(targetTabId);

  const bootstrapCacheRecord = await readBootstrapCache();
  const publicId = getRestrictedTradingViewPublicId(bootstrapCacheRecord);

  if (!publicId) {
    return;
  }

  const activeOperations = await readActiveTvOwnedLayoutOperations(publicId);
  const pendingCreateOperation =
    activeOperations.find((activeOperation) => {
      return (
        activeOperation.kind === "create" &&
        activeOperation.openInNewTab &&
        activeOperation.originTabId === openerTabId &&
        activeOperation.targetTabId === null &&
        Date.now() - activeOperation.createdAt <= pendingNewTabCreateTargetBindingWindowMs
      );
    }) ?? null;

  if (!pendingCreateOperation) {
    return;
  }

  await persistActiveTvOwnedLayoutOperation({
    ...pendingCreateOperation,
    candidateTabIds: [...new Set([...pendingCreateOperation.candidateTabIds, nextTargetTabId])],
  });
}

export async function openTradingViewOwnedLayoutInNewTab(
  originTabId: number,
  targetUrl: string,
): Promise<void> {
  await openTradingViewOwnedLayoutInNewTabForPublic(originTabId, targetUrl, null, null);
}

export async function openTradingViewOwnedLayoutInNewTabForPublic(
  originTabId: number,
  targetUrl: string,
  publicId: string | null,
  operationId: string | null,
): Promise<void> {
  if (publicId) {
    const activeOperations = await readActiveTvOwnedLayoutOperations(publicId);
    const activeCopyOperation = operationId
      ? (activeOperations.find((activeOperation) => activeOperation.operationId === operationId) ?? null)
      : (activeOperations.find((activeOperation) => activeOperation.kind === "copy") ?? null);

    if (
      activeCopyOperation &&
      activeCopyOperation.targetTabId !== null &&
      activeCopyOperation.provisionalChartId
    ) {
      return;
    }
  }

  if (!chrome.tabs?.create) {
    return;
  }

  await chrome.tabs.create({ active: true, openerTabId: originTabId, url: targetUrl });

  if (publicId && operationId) {
    await clearActiveTvOwnedLayoutOperationById(operationId, publicId);
  }
}

async function bindOrMatchPendingOperation(
  operation: TvOwnedLayoutOperation,
  input: { currentChartId: string; openerTabId?: number; tabId: number },
): Promise<TvOwnedLayoutOperation | null> {
  if (operation.kind === "create") {
    if (operation.targetTabId !== null) {
      if (operation.targetTabId !== input.tabId) {
        return null;
      }

      if (operation.provisionalChartId === input.currentChartId) {
        return operation;
      }

      const nextOperation = {
        ...operation,
        provisionalChartId: input.currentChartId,
      } satisfies TvOwnedLayoutOperation;

      await persistActiveTvOwnedLayoutOperation(nextOperation);

      return nextOperation;
    }

    if (
      !operation.openInNewTab &&
      Date.now() - operation.createdAt > pendingSameTabCreateRouteBindingWindowMs
    ) {
      return null;
    }

    const shouldBindCreateToCurrentTab = operation.openInNewTab
      ? input.openerTabId === operation.originTabId &&
        input.tabId !== operation.originTabId &&
        operation.candidateTabIds.includes(input.tabId)
      : input.tabId === operation.originTabId;

    if (!shouldBindCreateToCurrentTab) {
      return null;
    }

    const nextOperation = {
      ...operation,
      provisionalChartId: input.currentChartId,
      targetTabId: input.tabId,
    } satisfies TvOwnedLayoutOperation;

    await persistActiveTvOwnedLayoutOperation(nextOperation);

    return nextOperation;
  }

  if (operation.targetTabId !== null) {
    if (operation.targetTabId !== input.tabId || operation.provisionalChartId !== input.currentChartId) {
      return null;
    }

    return operation;
  }

  const shouldBindCopyToCurrentTab =
    input.tabId === operation.originTabId || input.openerTabId === operation.originTabId;

  if (!shouldBindCopyToCurrentTab) {
    return null;
  }

  const nextOperation = {
    ...operation,
    provisionalChartId: input.currentChartId,
    targetTabId: input.tabId,
  } satisfies TvOwnedLayoutOperation;

  await persistActiveTvOwnedLayoutOperation(nextOperation);

  return nextOperation;
}

async function readActiveTvOwnedLayoutOperations(publicId: string): Promise<TvOwnedLayoutOperation[]> {
  const operationsRecord = await readTvOwnedLayoutOperationsRecord();
  const activeOperations = Object.values(operationsRecord).filter(
    (activeOperation) => activeOperation.publicId === publicId,
  );
  const freshOperations = activeOperations.filter(
    (activeOperation) => Date.now() - activeOperation.createdAt <= 20_000,
  );
  const staleOperationIds = activeOperations
    .filter((activeOperation) => Date.now() - activeOperation.createdAt > 20_000)
    .map((activeOperation) => activeOperation.operationId);

  if (staleOperationIds.length > 0) {
    await Promise.all(
      staleOperationIds.map((staleOperationId) =>
        clearActiveTvOwnedLayoutOperationById(staleOperationId, publicId),
      ),
    );
  }

  return freshOperations.sort(
    (firstOperation, secondOperation) => secondOperation.createdAt - firstOperation.createdAt,
  );
}

async function resolvePreferredTradingViewRedirectUrl(
  publicId: string,
  fallbackLaunchUrl: string | null,
): Promise<string> {
  const activeOperations = await readActiveTvOwnedLayoutOperations(publicId);
  const provisionalChartId =
    activeOperations.find((activeOperation) => activeOperation.provisionalChartId)?.provisionalChartId ??
    null;

  if (provisionalChartId) {
    return createTradingViewChartUrl(provisionalChartId);
  }

  return resolveLastOpenedTvOwnedLayoutUrlWithFallback(publicId, fallbackLaunchUrl);
}

async function persistActiveTvOwnedLayoutOperation(operation: TvOwnedLayoutOperation): Promise<void> {
  await queueTvOwnedLayoutOperationWrite(async () => {
    const operationsRecord = await readTvOwnedLayoutOperationsRecord();

    await writeTvOwnedLayoutOperationsRecord({
      ...operationsRecord,
      [operation.operationId]: operation,
    });
  });
}

async function clearActiveTvOwnedLayoutOperationById(operationId: string, publicId: string): Promise<void> {
  await queueTvOwnedLayoutOperationWrite(async () => {
    const operationsRecord = await readTvOwnedLayoutOperationsRecord();
    const nextOperationsRecord = { ...operationsRecord };

    delete nextOperationsRecord[operationId];

    await writeTvOwnedLayoutOperationsRecord(nextOperationsRecord);

    const hasRemainingOperations = Object.values(nextOperationsRecord).some(
      (activeOperation) => activeOperation.publicId === publicId,
    );

    if (!hasRemainingOperations) {
      await clearPendingTvOwnedLayoutIntent(publicId);
    }
  });
}

async function clearActiveTvOwnedLayoutOperationsByPublicId(publicId: string): Promise<void> {
  const activeOperations = await readActiveTvOwnedLayoutOperations(publicId);

  await Promise.all(
    activeOperations.map((activeOperation) =>
      clearActiveTvOwnedLayoutOperationById(activeOperation.operationId, publicId),
    ),
  );
}

function createRouteStatus(partialStatus: Partial<TvOwnedLayoutRouteStatus>): TvOwnedLayoutRouteStatus {
  return {
    currentChartId: partialStatus.currentChartId ?? null,
    expectedTitle: partialStatus.expectedTitle ?? null,
    isPendingOperation: partialStatus.isPendingOperation ?? false,
    isRestricted: partialStatus.isRestricted ?? false,
    operationId: partialStatus.operationId ?? null,
    pendingOperationKind: partialStatus.pendingOperationKind ?? null,
    redirectUrl: partialStatus.redirectUrl ?? null,
    shouldAllow: partialStatus.shouldAllow ?? false,
  };
}

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
