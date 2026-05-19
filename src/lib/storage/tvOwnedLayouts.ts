import {
  createTradingViewChartUrl,
  defaultTradingViewChartUrl,
  getTradingViewChartId,
  normalizeTradingViewChartUrl,
} from "@/lib/tradingview/tvChartUrl";
import type {
  ExtensionTradingViewOwnedLayout,
  ExtensionTradingViewOwnedLayoutsSnapshot,
} from "@/lib/api/extensionApiTypes";

export const tvOwnedLayoutsStorageKey = "assetManager.tradingviewOwnedLayouts";

export const tvOwnedLayoutIntentTtlMs = 20_000;

export type TvOwnedLayout = {
  chartId: string;
  title: string;
  updatedAt: number;
  url: string;
};

export type TvPendingLayoutIntent =
  | {
      createdAt: number;
      kind: "copy" | "create";
      sourceChartId: string | null;
      title: string;
    }
  | {
      chartId: string;
      createdAt: number;
      kind: "delete";
      title: string;
    };

export type TvOwnedLayoutState = {
  lastOpenedAt: number | null;
  lastOpenedChartId: string | null;
  layouts: TvOwnedLayout[];
  pendingIntent: TvPendingLayoutIntent | null;
};

export type TvOwnedLayoutDurableState = Omit<TvOwnedLayoutState, "pendingIntent">;

type TvOwnedLayoutsStorageRecord = Record<string, TvOwnedLayoutState>;

let pendingStorageWrite: Promise<void> = Promise.resolve();

export function createEmptyTvOwnedLayoutState(): TvOwnedLayoutState {
  return {
    lastOpenedAt: null,
    lastOpenedChartId: null,
    layouts: [],
    pendingIntent: null,
  };
}

export async function readTvOwnedLayoutState(publicId: string): Promise<TvOwnedLayoutState> {
  const storageRecord = await readTvOwnedLayoutsStorageRecord();

  return normalizeTvOwnedLayoutState(storageRecord[publicId]);
}

export async function readTvOwnedLayout(publicId: string, chartId: string): Promise<TvOwnedLayout | null> {
  const state = await readTvOwnedLayoutState(publicId);

  return state.layouts.find((layout) => layout.chartId === chartId) ?? null;
}

export function createEmptyTvOwnedLayoutDurableState(): TvOwnedLayoutDurableState {
  const emptyState = createEmptyTvOwnedLayoutState();

  return {
    lastOpenedAt: emptyState.lastOpenedAt,
    lastOpenedChartId: emptyState.lastOpenedChartId,
    layouts: emptyState.layouts,
  };
}

export async function upsertTvOwnedLayout(
  publicId: string,
  layout: TvOwnedLayout,
  openedAt = Date.now(),
): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) => {
    const normalizedLayout = normalizeTvOwnedLayout(layout);

    if (!normalizedLayout) {
      return state;
    }

    const nextLayouts = state.layouts.filter(
      (currentLayout) => currentLayout.chartId !== normalizedLayout.chartId,
    );

    nextLayouts.unshift(normalizedLayout);

    return {
      ...state,
      lastOpenedAt: openedAt,
      lastOpenedChartId: normalizedLayout.chartId,
      layouts: nextLayouts,
    };
  });
}

export async function rememberTvOwnedLayout(
  publicId: string,
  layout: TvOwnedLayout,
): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) => {
    const normalizedLayout = normalizeTvOwnedLayout(layout);

    if (!normalizedLayout) {
      return state;
    }

    const existingLayout = state.layouts.find(
      (currentLayout) => currentLayout.chartId === normalizedLayout.chartId,
    );
    const nextLayout: TvOwnedLayout = existingLayout
      ? {
          ...normalizedLayout,
          updatedAt: existingLayout.updatedAt,
        }
      : normalizedLayout;

    const nextLayouts = state.layouts.filter(
      (currentLayout) => currentLayout.chartId !== normalizedLayout.chartId,
    );

    nextLayouts.push(nextLayout);

    return {
      ...state,
      layouts: nextLayouts,
    };
  });
}

export async function renameTvOwnedLayout(
  publicId: string,
  chartId: string,
  title: string,
  updatedAt = Date.now(),
): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) => {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      return state;
    }

    const existingLayout = state.layouts.find((layout) => layout.chartId === chartId);

    if (!existingLayout) {
      return state;
    }

    return {
      ...state,
      layouts: state.layouts.map((layout) =>
        layout.chartId === chartId
          ? {
              ...layout,
              title: normalizedTitle,
              updatedAt,
            }
          : layout,
      ),
    };
  });
}

export async function removeTvOwnedLayout(publicId: string, chartId: string): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) => {
    return {
      ...state,
      lastOpenedAt: state.lastOpenedChartId === chartId ? null : state.lastOpenedAt,
      lastOpenedChartId: state.lastOpenedChartId === chartId ? null : state.lastOpenedChartId,
      layouts: state.layouts.filter((layout) => layout.chartId !== chartId),
    };
  });
}

export async function setLastOpenedTvOwnedLayout(
  publicId: string,
  chartId: string | null,
  openedAt = Date.now(),
): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) => {
    if (state.lastOpenedChartId === chartId) {
      return state;
    }

    return {
      ...state,
      lastOpenedAt: chartId ? openedAt : null,
      lastOpenedChartId: chartId,
    };
  });
}

export async function setPendingTvOwnedLayoutIntent(
  publicId: string,
  pendingIntent: TvPendingLayoutIntent | null,
): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) => ({
    ...state,
    pendingIntent,
  }));
}

export async function clearPendingTvOwnedLayoutIntent(publicId: string): Promise<TvOwnedLayoutState> {
  return setPendingTvOwnedLayoutIntent(publicId, null);
}

export async function resolveLastOpenedTvOwnedLayoutUrl(publicId: string): Promise<string> {
  return resolveLastOpenedTvOwnedLayoutUrlWithFallback(publicId, defaultTradingViewChartUrl);
}

export async function resolveLastOpenedTvOwnedLayoutUrlWithFallback(
  publicId: string,
  fallbackUrl: string | null,
): Promise<string> {
  const state = await readTvOwnedLayoutState(publicId);
  const lastOpenedLayout = state.lastOpenedChartId
    ? (state.layouts.find((layout) => layout.chartId === state.lastOpenedChartId) ?? null)
    : null;

  return lastOpenedLayout?.url ?? fallbackUrl ?? defaultTradingViewChartUrl;
}

export function buildExtensionTradingViewOwnedLayoutsSnapshot(
  state: TvOwnedLayoutState | TvOwnedLayoutDurableState,
): ExtensionTradingViewOwnedLayoutsSnapshot {
  const normalizedState = normalizeTvOwnedLayoutState({
    ...createEmptyTvOwnedLayoutState(),
    ...state,
    pendingIntent: "pendingIntent" in state ? state.pendingIntent : null,
  });

  return {
    lastOpenedAt: formatTimestampAsIsoString(normalizedState.lastOpenedAt),
    lastOpenedChartId: normalizedState.lastOpenedChartId,
    layouts: normalizedState.layouts.map((layout) => ({
      chartId: layout.chartId,
      title: layout.title,
      updatedAt: formatTimestampAsIsoString(layout.updatedAt) ?? new Date(layout.updatedAt).toISOString(),
      url: layout.url,
    })),
  };
}

export async function mergeTvOwnedLayoutSnapshot(
  publicId: string,
  snapshot: ExtensionTradingViewOwnedLayoutsSnapshot | null | undefined,
): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) =>
    mergeTvOwnedLayoutState(state, createTvOwnedLayoutDurableStateFromSnapshot(snapshot)),
  );
}

export function createTvOwnedLayoutDurableStateFromSnapshot(
  snapshot: ExtensionTradingViewOwnedLayoutsSnapshot | null | undefined,
): TvOwnedLayoutDurableState {
  return normalizeTvOwnedLayoutState({
    lastOpenedAt: parseTimestamp(snapshot?.lastOpenedAt),
    lastOpenedChartId: snapshot?.lastOpenedChartId?.trim() || null,
    layouts: (snapshot?.layouts ?? []).flatMap((layout) => {
      const normalizedLayout = normalizeExtensionTradingViewOwnedLayout(layout);

      return normalizedLayout ? [normalizedLayout] : [];
    }),
    pendingIntent: null,
  });
}

export function mergeTvOwnedLayoutState(
  currentState: TvOwnedLayoutState,
  incomingState: TvOwnedLayoutDurableState,
): TvOwnedLayoutState {
  const normalizedCurrentState = normalizeTvOwnedLayoutState(currentState);
  const normalizedIncomingState = normalizeTvOwnedLayoutState({
    ...incomingState,
    pendingIntent: null,
  });
  const layoutsByChartId = new Map<string, TvOwnedLayout>();

  for (const layout of [...normalizedCurrentState.layouts, ...normalizedIncomingState.layouts]) {
    const currentLayout = layoutsByChartId.get(layout.chartId);

    if (!currentLayout || currentLayout.updatedAt < layout.updatedAt) {
      layoutsByChartId.set(layout.chartId, layout);
    }
  }

  const preferredLastOpened = resolvePreferredLastOpenedEntry(
    normalizedCurrentState,
    normalizedIncomingState,
    layoutsByChartId,
  );

  return normalizeTvOwnedLayoutState({
    lastOpenedAt: preferredLastOpened.lastOpenedAt,
    lastOpenedChartId: preferredLastOpened.lastOpenedChartId,
    layouts: [...layoutsByChartId.values()],
    pendingIntent: normalizedCurrentState.pendingIntent,
  });
}

export function isFreshTvPendingLayoutIntent(
  pendingIntent: TvPendingLayoutIntent | null,
  now = Date.now(),
): boolean {
  if (!pendingIntent) {
    return false;
  }

  return now - pendingIntent.createdAt <= tvOwnedLayoutIntentTtlMs;
}

async function updateTvOwnedLayoutState(
  publicId: string,
  updateState: (state: TvOwnedLayoutState) => TvOwnedLayoutState,
): Promise<TvOwnedLayoutState> {
  return queueTvOwnedLayoutsWrite(async () => {
    const storageRecord = await readTvOwnedLayoutsStorageRecord();
    const currentState = normalizeTvOwnedLayoutState(storageRecord[publicId]);
    const nextState = normalizeTvOwnedLayoutState(updateState(currentState));

    await writeTvOwnedLayoutsStorageRecord({
      ...storageRecord,
      [publicId]: nextState,
    });

    return nextState;
  });
}

async function readTvOwnedLayoutsStorageRecord(): Promise<TvOwnedLayoutsStorageRecord> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return {};
  }

  const storedValues = await chrome.storage.local.get(tvOwnedLayoutsStorageKey);
  const storageRecord = storedValues[tvOwnedLayoutsStorageKey];

  if (!storageRecord || typeof storageRecord !== "object") {
    return {};
  }

  return storageRecord as TvOwnedLayoutsStorageRecord;
}

async function writeTvOwnedLayoutsStorageRecord(storageRecord: TvOwnedLayoutsStorageRecord): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.set({
    [tvOwnedLayoutsStorageKey]: storageRecord,
  });
}

function normalizeTvOwnedLayoutState(state: TvOwnedLayoutState | undefined): TvOwnedLayoutState {
  if (!state) {
    return createEmptyTvOwnedLayoutState();
  }

  const layoutsByChartId = new Map<string, TvOwnedLayout>();

  for (const layout of state.layouts) {
    const normalizedLayout = normalizeTvOwnedLayout(layout);

    if (!normalizedLayout) {
      continue;
    }

    const currentLayout = layoutsByChartId.get(normalizedLayout.chartId);

    if (!currentLayout || currentLayout.updatedAt < normalizedLayout.updatedAt) {
      layoutsByChartId.set(normalizedLayout.chartId, normalizedLayout);
    }
  }

  const layouts = [...layoutsByChartId.values()].sort(
    (firstLayout, secondLayout) => secondLayout.updatedAt - firstLayout.updatedAt,
  );
  const nextLastOpenedAt = normalizeLastOpenedAt(state.lastOpenedAt, state.lastOpenedChartId, layouts);
  const hasLastOpenedLayout = layouts.some((layout) => layout.chartId === state.lastOpenedChartId);

  return {
    lastOpenedAt: hasLastOpenedLayout ? nextLastOpenedAt : null,
    lastOpenedChartId: hasLastOpenedLayout ? state.lastOpenedChartId : null,
    layouts,
    pendingIntent: normalizeTvPendingLayoutIntent(state.pendingIntent),
  };
}

function normalizeTvOwnedLayout(layout: TvOwnedLayout): TvOwnedLayout | null {
  const normalizedUrl = normalizeTradingViewChartUrl(layout.url);
  const chartId = layout.chartId.trim() || (normalizedUrl ? getTradingViewChartId(normalizedUrl) : null);
  const title = layout.title.trim();

  if (!normalizedUrl || !chartId || !title) {
    return null;
  }

  return {
    chartId,
    title,
    updatedAt: Number.isFinite(layout.updatedAt) ? layout.updatedAt : Date.now(),
    url: normalizedUrl,
  };
}

function normalizeExtensionTradingViewOwnedLayout(
  layout: ExtensionTradingViewOwnedLayout,
): TvOwnedLayout | null {
  return normalizeTvOwnedLayout({
    chartId: layout.chartId,
    title: layout.title,
    updatedAt: parseTimestamp(layout.updatedAt) ?? Date.now(),
    url: layout.url,
  });
}

function normalizeTvPendingLayoutIntent(
  pendingIntent: TvPendingLayoutIntent | null,
): TvPendingLayoutIntent | null {
  if (!pendingIntent) {
    return null;
  }

  if (pendingIntent.kind === "delete") {
    const chartId = pendingIntent.chartId.trim();
    const title = pendingIntent.title.trim();

    if (!chartId || !title) {
      return null;
    }

    return {
      chartId,
      createdAt: pendingIntent.createdAt,
      kind: "delete",
      title,
    };
  }

  const title = pendingIntent.title.trim();

  if (!title) {
    return null;
  }

  return {
    createdAt: pendingIntent.createdAt,
    kind: pendingIntent.kind,
    sourceChartId: pendingIntent.sourceChartId?.trim() || null,
    title,
  };
}

function resolvePreferredLastOpenedEntry(
  currentState: TvOwnedLayoutState,
  incomingState: TvOwnedLayoutDurableState,
  layoutsByChartId: Map<string, TvOwnedLayout>,
): { lastOpenedAt: number | null; lastOpenedChartId: string | null } {
  const currentEntry = {
    lastOpenedAt: normalizeLastOpenedAt(
      currentState.lastOpenedAt,
      currentState.lastOpenedChartId,
      currentState.layouts,
    ),
    lastOpenedChartId: currentState.lastOpenedChartId,
  };
  const incomingEntry = {
    lastOpenedAt: normalizeLastOpenedAt(
      incomingState.lastOpenedAt,
      incomingState.lastOpenedChartId,
      incomingState.layouts,
    ),
    lastOpenedChartId: incomingState.lastOpenedChartId,
  };
  const preferredEntry =
    (incomingEntry.lastOpenedAt ?? -1) > (currentEntry.lastOpenedAt ?? -1) ? incomingEntry : currentEntry;
  const fallbackEntry = preferredEntry === incomingEntry ? currentEntry : incomingEntry;

  return (
    resolveValidLastOpenedEntry(preferredEntry, layoutsByChartId) ??
    resolveValidLastOpenedEntry(fallbackEntry, layoutsByChartId) ?? {
      lastOpenedAt: null,
      lastOpenedChartId: null,
    }
  );
}

function normalizeLastOpenedAt(
  lastOpenedAt: number | null | undefined,
  lastOpenedChartId: string | null,
  layouts: TvOwnedLayout[],
): number | null {
  if (!lastOpenedChartId) {
    return null;
  }

  if (Number.isFinite(lastOpenedAt)) {
    return Number(lastOpenedAt);
  }

  return layouts.find((layout) => layout.chartId === lastOpenedChartId)?.updatedAt ?? null;
}

function parseTimestamp(timestamp: string | null | undefined): number | null {
  if (!timestamp) {
    return null;
  }

  const parsedTimestamp = Date.parse(timestamp);

  return Number.isNaN(parsedTimestamp) ? null : parsedTimestamp;
}

function formatTimestampAsIsoString(timestamp: number | null): string | null {
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(Number(timestamp)).toISOString();
}

function resolveValidLastOpenedEntry(
  entry: { lastOpenedAt: number | null; lastOpenedChartId: string | null },
  layoutsByChartId: Map<string, TvOwnedLayout>,
): { lastOpenedAt: number | null; lastOpenedChartId: string | null } | null {
  if (!entry.lastOpenedChartId || !entry.lastOpenedAt) {
    return null;
  }

  if (!layoutsByChartId.has(entry.lastOpenedChartId)) {
    return null;
  }

  return entry;
}

function queueTvOwnedLayoutsWrite<TValue>(writeOperation: () => Promise<TValue>): Promise<TValue> {
  const nextWrite = pendingStorageWrite.then(writeOperation, writeOperation);

  pendingStorageWrite = nextWrite.then(
    () => undefined,
    () => undefined,
  );

  return nextWrite;
}

export function createOwnedTvLayoutFromChartUrl(
  chartUrl: string,
  title: string,
  updatedAt = Date.now(),
): TvOwnedLayout | null {
  const normalizedUrl = normalizeTradingViewChartUrl(chartUrl);
  const chartId = normalizedUrl ? getTradingViewChartId(normalizedUrl) : null;

  if (!normalizedUrl || !chartId) {
    return null;
  }

  return {
    chartId,
    title: title.trim(),
    updatedAt,
    url: createTradingViewChartUrl(chartId),
  };
}
