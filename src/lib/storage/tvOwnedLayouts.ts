import {
  createTradingViewChartUrl,
  defaultTradingViewChartUrl,
  getTradingViewChartId,
  normalizeTradingViewChartUrl,
} from "@/lib/tradingview/tvChartUrl";

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
  lastOpenedChartId: string | null;
  layouts: TvOwnedLayout[];
  pendingIntent: TvPendingLayoutIntent | null;
};

type TvOwnedLayoutsStorageRecord = Record<string, TvOwnedLayoutState>;

let pendingStorageWrite: Promise<void> = Promise.resolve();

export function createEmptyTvOwnedLayoutState(): TvOwnedLayoutState {
  return {
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

export async function upsertTvOwnedLayout(publicId: string, layout: TvOwnedLayout): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) => {
    const normalizedLayout = normalizeTvOwnedLayout(layout);

    if (!normalizedLayout) {
      return state;
    }

    const nextLayouts = state.layouts.filter((currentLayout) => currentLayout.chartId !== normalizedLayout.chartId);

    nextLayouts.unshift(normalizedLayout);

    return {
      ...state,
      lastOpenedChartId: normalizedLayout.chartId,
      layouts: nextLayouts,
    };
  });
}

export async function rememberTvOwnedLayout(publicId: string, layout: TvOwnedLayout): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) => {
    const normalizedLayout = normalizeTvOwnedLayout(layout);

    if (!normalizedLayout) {
      return state;
    }

    const existingLayout = state.layouts.find((currentLayout) => currentLayout.chartId === normalizedLayout.chartId);
    const nextLayout: TvOwnedLayout = existingLayout
      ? {
          ...normalizedLayout,
          updatedAt: existingLayout.updatedAt,
        }
      : normalizedLayout;

    const nextLayouts = state.layouts.filter((currentLayout) => currentLayout.chartId !== normalizedLayout.chartId);

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
  return updateTvOwnedLayoutState(publicId, (state) => ({
    ...state,
    lastOpenedChartId: state.lastOpenedChartId === chartId ? null : state.lastOpenedChartId,
    layouts: state.layouts.filter((layout) => layout.chartId !== chartId),
  }));
}

export async function setLastOpenedTvOwnedLayout(
  publicId: string,
  chartId: string | null,
): Promise<TvOwnedLayoutState> {
  return updateTvOwnedLayoutState(publicId, (state) => ({
    ...state,
    lastOpenedChartId: chartId,
  }));
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
  const state = await readTvOwnedLayoutState(publicId);
  const lastOpenedLayout = state.lastOpenedChartId
    ? (state.layouts.find((layout) => layout.chartId === state.lastOpenedChartId) ?? null)
    : null;

  return lastOpenedLayout?.url ?? defaultTradingViewChartUrl;
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

  const layouts = [...layoutsByChartId.values()].sort((firstLayout, secondLayout) => secondLayout.updatedAt - firstLayout.updatedAt);
  const hasLastOpenedLayout = layouts.some((layout) => layout.chartId === state.lastOpenedChartId);

  return {
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

function normalizeTvPendingLayoutIntent(pendingIntent: TvPendingLayoutIntent | null): TvPendingLayoutIntent | null {
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

function queueTvOwnedLayoutsWrite<TValue>(writeOperation: () => Promise<TValue>): Promise<TValue> {
  const nextWrite = pendingStorageWrite.then(writeOperation, writeOperation);

  pendingStorageWrite = nextWrite.then(
    () => undefined,
    () => undefined,
  );

  return nextWrite;
}

export function createOwnedTvLayoutFromChartUrl(chartUrl: string, title: string, updatedAt = Date.now()): TvOwnedLayout | null {
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
