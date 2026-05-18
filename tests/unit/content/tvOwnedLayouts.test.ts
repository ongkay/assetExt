import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runtimeMessageType, type RuntimeMessage, type RuntimeResponse } from "@/lib/runtime/messages";
import { bootstrapCacheStorageKey, type BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";
import { tvOwnedLayoutsStorageKey } from "@/lib/storage/tvOwnedLayouts";

const originalChrome = globalThis.chrome;
const restrictedBootstrapCache: BootstrapCacheRecord = {
  fetchedAt: 1,
  isValid: true,
  snapshot: {
    assets: [{ mode: "share", platform: "tradingview" }],
    auth: { status: "authenticated" },
    user: {
      avatarUrl: null,
      email: "user@example.com",
      publicId: "MEM-001",
      username: "user",
    },
    version: { status: "supported" },
  },
};

describe("tv owned layouts content sync", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/chart/SOURCE123/");
  });

  afterEach(() => {
    document.body.innerHTML = "";
    globalThis.chrome = originalChrome;
    vi.useRealTimers();
  });

  it("requests a follow-up sync after bound copy recovery persists the copied layout", async () => {
    const sentMessages: RuntimeMessage[] = [];
    const storageValues: Record<string, unknown> = {
      [bootstrapCacheStorageKey]: restrictedBootstrapCache,
      [tvOwnedLayoutsStorageKey]: {
        "MEM-001": {
          lastOpenedAt: null,
          lastOpenedChartId: null,
          layouts: [],
          pendingIntent: null,
        },
      },
    };

    globalThis.chrome = {
      runtime: {
        sendMessage: vi.fn(
          (message: RuntimeMessage, callback: (response: RuntimeResponse<unknown>) => void) => {
            sentMessages.push(message);

            if (message.type === runtimeMessageType.tvOwnedLayoutRouteStatusRequested) {
              callback({
                ok: true,
                value: {
                  currentChartId: "SOURCE123",
                  expectedTitle: null,
                  isPendingOperation: false,
                  isRestricted: true,
                  operationId: null,
                  pendingOperationKind: null,
                  redirectUrl: null,
                  shouldAllow: true,
                },
              });
              return;
            }

            if (message.type === runtimeMessageType.tvOwnedLayoutPendingOperationSubmitted) {
              callback({ ok: true, value: { operationId: "operation-1" } });
              return;
            }

            if (message.type === runtimeMessageType.tvOwnedLayoutOperationStatusRequested) {
              callback({
                ok: true,
                value: {
                  boundChartId: "COPY123",
                  isActive: true,
                  isBound: true,
                  kind: "copy",
                },
              });
              return;
            }

            callback({ ok: true, value: null });
          },
        ),
      },
      storage: {
        local: {
          get: vi.fn((key: string | string[] | null) => {
            if (key === null) {
              return Promise.resolve(storageValues);
            }

            if (Array.isArray(key)) {
              return Promise.resolve(
                Object.fromEntries(key.map((entryKey) => [entryKey, storageValues[entryKey]])),
              );
            }

            return Promise.resolve({ [key]: storageValues[key] });
          }),
          set: vi.fn((values: Record<string, unknown>) => {
            Object.assign(storageValues, values);
            return Promise.resolve();
          }),
        },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    } as unknown as typeof chrome;

    vi.doMock("@/lib/tradingview/tvChartUrl", async (importOriginal) => {
      const originalTradingViewChartUrl =
        await importOriginal<typeof import("@/lib/tradingview/tvChartUrl")>();

      return {
        ...originalTradingViewChartUrl,
        isTradingViewHostname: vi.fn(() => true),
      };
    });

    const { installTvOwnedLayouts } = await import("@/content/dom/tv/tvOwnedLayouts");

    document.body.innerHTML = `
      <div data-name="rename-dialog">
        <span>Make copy of chart layout</span>
        <input data-qa-id="ui-lib-Input-input" value="Copied Layout" />
        <button data-qa-id="save-btn">Make a copy</button>
      </div>
      <div data-name="load-layout-dialog" data-dialog-name="Layouts">
        <a data-name="load-chart-dialog-item" href="https://www.tradingview.com/chart/COPY123/">
          <span data-name="list-item-title">Copied Layout</span>
        </a>
      </div>
    `;

    const disposeTvOwnedLayouts = installTvOwnedLayouts();

    await flushAsyncWork();
    sentMessages.length = 0;

    const saveButton = document.querySelector('button[data-qa-id="save-btn"]');

    expect(saveButton).toBeInstanceOf(HTMLButtonElement);

    saveButton?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));

    await flushAsyncWork();
    await vi.advanceTimersByTimeAsync(2_000);
    await flushAsyncWork();

    expect(sentMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chartId: "COPY123",
          type: runtimeMessageType.tvOwnedLayoutRememberRequested,
        }),
        expect.objectContaining({
          operationId: "operation-1",
          publicId: "MEM-001",
          type: runtimeMessageType.tvOwnedLayoutOperationStatusRequested,
        }),
        expect.objectContaining({
          trigger: "tv_page_open",
          type: runtimeMessageType.tvOwnedLayoutSyncRequested,
        }),
        expect.objectContaining({
          operationId: "operation-1",
          type: runtimeMessageType.tvOwnedLayoutPendingOperationCleared,
        }),
      ]),
    );

    expect(
      sentMessages.filter((message) => message.type === runtimeMessageType.tvOwnedLayoutSyncRequested).length,
    ).toBeGreaterThanOrEqual(1);

    disposeTvOwnedLayouts();
  });
});

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
