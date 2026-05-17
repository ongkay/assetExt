import { runtimeMessageType, type RuntimeMessage } from "@/lib/runtime/messages";
import { readBootstrapCache } from "@/lib/storage/bootstrapCache";
import { readTvOwnedLayoutState } from "@/lib/storage/tvOwnedLayouts";
import { getRestrictedTradingViewPublicId } from "@/lib/tradingview/tvAccessState";
import {
  getTradingViewChartId,
  isTradingViewChartPath,
  isTradingViewHostname,
} from "@/lib/tradingview/tvChartUrl";

import { assignPageLocation, normalizeText, replacePageLocation, setInputValue } from "./tvDomUtils";

const createLayoutDialogSelector = '[data-name="create-dialog"]';
const renameLayoutDialogSelector = '[data-name="rename-dialog"]';
const layoutDialogInputSelector = '[data-qa-id="ui-lib-Input-input"]';
const layoutDialogSaveButtonSelector = 'button[data-qa-id="save-btn"]';
const layoutDialogCancelButtonSelector = 'button[data-qa-id="cancel-btn"]';
const openLayoutsDialogSelector = '[data-name="load-layout-dialog"][data-dialog-name="Layouts"]';
const openLayoutsDialogSearchInputSelector = `${openLayoutsDialogSelector} input[role="searchbox"]`;
const openLayoutRowSelector = '[data-name="load-chart-dialog-item"][href]';
const openLayoutRowTitleSelector = '[data-name="list-item-title"]';
const openLayoutDeleteButtonSelector = '[data-name="list-item-remove-button"]';
const manageLayoutsButtonSelector = 'button[aria-label="Manage layouts"]';
const menuItemSelector = '[data-role="menuitem"], [role="menuitem"]';
const openLayoutMenuItemLabel = 'Open layout';
const openLayoutsDialogCloseButtonSelector = `${openLayoutsDialogSelector} button[data-qa-id="close"], ${openLayoutsDialogSelector} button[data-name="close"]`;
const currentLayoutTitleSelector = '#header-toolbar-layouts + .wrap-n5bmFxyX span.text-Uy_he976';
const confirmDialogDeleteButtonSelector = 'button[data-qa-id="yes-btn"]';
const confirmDialogDismissButtonSelector = 'button[data-qa-id="no-btn"], button[data-name="close"]';
const chartNotFoundSelector = '.js-chart-not-found';
const pendingIntentBypassAttribute = 'data-asset-manager-layout-intent-bypass';
const copyRecoveryInitialDelayMs = 2_000;
const copyRecoveryRetryDelayMs = 300;
const copyRecoveryMaxAttempts = 30;
const deleteVerificationRetryDelayMs = 300;
const deleteVerificationTtlMs = 5_000;
const invalidPageVerificationDelayMs = 1_000;
const copyRecoveryTimestampToleranceMs = 2_000;

type DeleteCandidate = {
  chartId: string;
  title: string;
};

type PendingCopyRecovery = {
  attempts: number;
  expectedTitle: string;
  operationId: string;
  sourceChartId: string;
  sourceLayoutLabel: string;
  submittedAt: number;
};

type PendingDeleteVerification = {
  chartId: string;
  confirmedAt: number;
  title: string;
};

type PendingRenameVerification = {
  chartId: string;
  submittedAt: number;
  title: string;
};

type PendingInvalidPageVerification = {
  chartId: string;
  firstDetectedAt: number;
};

type RouteStatus = {
  currentChartId: string | null;
  expectedTitle: string | null;
  isPendingOperation: boolean;
  isRestricted: boolean;
  operationId: string | null;
  pendingOperationKind: "copy" | "create" | null;
  redirectUrl: string | null;
  shouldAllow: boolean;
};

type DialogSaveAction = "copy" | "create" | "rename" | null;

export function installTvOwnedLayouts(): () => void {
  let isDisposed = false;
  let hasScheduledRouteCheck = false;
  let isRouteCheckRunning = false;
  let shouldRunRouteCheckAgain = false;
  let lastConfirmedRouteKey = "";
  let restrictedPublicIdPromise: Promise<string | null> | null = null;
  let deleteCandidate: DeleteCandidate | null = null;
  let pendingCopyRecovery: PendingCopyRecovery | null = null;
  const pendingDeleteVerifications = new Map<string, PendingDeleteVerification>();
  let pendingRenameVerification: PendingRenameVerification | null = null;
  let pendingInvalidPageVerification: PendingInvalidPageVerification | null = null;

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  const resolveRestrictedPublicId = () => {
    if (restrictedPublicIdPromise) {
      return restrictedPublicIdPromise;
    }

    restrictedPublicIdPromise = readBootstrapCache()
      .then((bootstrapCacheRecord) => getRestrictedTradingViewPublicId(bootstrapCacheRecord))
      .catch(() => null);

    return restrictedPublicIdPromise;
  };

  const scheduleRouteCheck = () => {
    if (isDisposed || hasScheduledRouteCheck) {
      return;
    }

    if (isRouteCheckRunning) {
      shouldRunRouteCheckAgain = true;
      return;
    }

    hasScheduledRouteCheck = true;
    window.setTimeout(() => {
      hasScheduledRouteCheck = false;
      void runRouteCheck();
    }, 0);
  };

  const scheduleCopyRecovery = (delayMs = copyRecoveryRetryDelayMs) => {
    window.setTimeout(() => {
      if (!pendingCopyRecovery) {
        return;
      }

      void runCopyRecovery();
    }, delayMs);
  };

  const scheduleDeleteVerification = () => {
    window.setTimeout(() => {
      if (pendingDeleteVerifications.size === 0) {
        return;
      }

      void runDeleteVerification();
    }, deleteVerificationRetryDelayMs);
  };

  const scheduleRenameVerification = () => {
    window.setTimeout(() => {
      if (!pendingRenameVerification) {
        return;
      }

      void runRenameVerification();
    }, deleteVerificationRetryDelayMs);
  };

  const runRouteCheck = async () => {
    if (isDisposed) {
      return;
    }

    isRouteCheckRunning = true;

    try {
      const publicId = await resolveRestrictedPublicId();

      if (!publicId || !isTradingViewHostname(window.location.hostname)) {
        return;
      }

      const routeStatus = await requestRouteStatus(window.location.href);

      if (routeStatus.redirectUrl) {
        pendingInvalidPageVerification = null;
        replaceLocation(routeStatus.redirectUrl);
        return;
      }

      if (!routeStatus.shouldAllow || !routeStatus.currentChartId || !isTradingViewChartPath(window.location.pathname)) {
        pendingInvalidPageVerification = null;
        return;
      }

      if (hasInvalidChartPageSignal()) {
        if (pendingInvalidPageVerification?.chartId !== routeStatus.currentChartId) {
          pendingInvalidPageVerification = {
            chartId: routeStatus.currentChartId,
            firstDetectedAt: Date.now(),
          };
          window.setTimeout(scheduleRouteCheck, invalidPageVerificationDelayMs);
          return;
        }

        if (Date.now() - pendingInvalidPageVerification.firstDetectedAt < invalidPageVerificationDelayMs) {
          window.setTimeout(scheduleRouteCheck, invalidPageVerificationDelayMs);
          return;
        }

        pendingInvalidPageVerification = null;
        const invalidRedirectResult = await sendRuntimeMessage<{ redirectUrl: string }>({
          chartId: routeStatus.currentChartId,
          publicId,
          type: runtimeMessageType.tvOwnedLayoutPageInvalid,
        });

        replaceLocation(invalidRedirectResult.redirectUrl ?? routeStatus.redirectUrl ?? window.location.href);
        return;
      }

      pendingInvalidPageVerification = null;

      const currentRouteKey = `${routeStatus.currentChartId}:${window.location.href}`;

      if (lastConfirmedRouteKey === currentRouteKey) {
        return;
      }

      lastConfirmedRouteKey = currentRouteKey;

      if (routeStatus.isPendingOperation && routeStatus.pendingOperationKind === "copy") {
        return;
      }

      await sendRuntimeMessage<null>({
        chartId: routeStatus.currentChartId,
        publicId,
        type: runtimeMessageType.tvOwnedLayoutPageConfirmed,
        url: window.location.href,
      });
    } finally {
      isRouteCheckRunning = false;

      if (shouldRunRouteCheckAgain) {
        shouldRunRouteCheckAgain = false;
        scheduleRouteCheck();
      }
    }
  };

  const runCopyRecovery = async () => {
    const currentCopyRecovery = pendingCopyRecovery;
    const publicId = await resolveRestrictedPublicId();

    if (!currentCopyRecovery || !publicId || isDisposed) {
      return;
    }

    const currentChartId = getTradingViewChartId(window.location.pathname);

    if (currentChartId !== currentCopyRecovery.sourceChartId) {
      pendingCopyRecovery = null;
      return;
    }

    const copyOperationStatus = await readPendingOperationStatus(publicId, currentCopyRecovery.operationId).catch(() => null);

    if (!copyOperationStatus || !copyOperationStatus.isActive || copyOperationStatus.kind !== "copy") {
      pendingCopyRecovery = null;
      return;
    }

    if (copyOperationStatus.isBound && copyOperationStatus.boundChartId) {
      const boundCopiedLayout = await findLayoutByChartIdFromDialog(copyOperationStatus.boundChartId, publicId);

      if (!boundCopiedLayout) {
        pendingCopyRecovery = {
          ...currentCopyRecovery,
          attempts: currentCopyRecovery.attempts + 1,
        };
        scheduleCopyRecovery();
        return;
      }

      pendingCopyRecovery = null;
      await rememberOwnedLayout(publicId, boundCopiedLayout, true);
      await sendRuntimeMessage<null>({
        operationId: currentCopyRecovery.operationId,
        type: runtimeMessageType.tvOwnedLayoutPendingOperationCleared,
      }).catch(() => undefined);
      return;
    }

    if (currentCopyRecovery.attempts >= copyRecoveryMaxAttempts) {
      pendingCopyRecovery = null;
      await sendRuntimeMessage<null>({
        operationId: currentCopyRecovery.operationId,
        type: runtimeMessageType.tvOwnedLayoutPendingOperationCleared,
      }).catch(() => undefined);
      return;
    }

    const copiedLayout = await findCopiedLayoutFromDialog(currentCopyRecovery, publicId);

    if (!copiedLayout) {
      pendingCopyRecovery = {
        ...currentCopyRecovery,
        attempts: currentCopyRecovery.attempts + 1,
      };
      scheduleCopyRecovery();
      return;
    }

    pendingCopyRecovery = null;
    await rememberOwnedLayout(publicId, copiedLayout, true);
    await sendRuntimeMessage<null>({
      operationId: currentCopyRecovery.operationId,
      publicId,
      type: runtimeMessageType.tvOwnedLayoutOpenTabRequested,
      url: copiedLayout.url,
    });
  };

  const runDeleteVerification = async () => {
    const publicId = await resolveRestrictedPublicId();

    if (!publicId || isDisposed || pendingDeleteVerifications.size === 0) {
      return;
    }

    const currentChartId = getTradingViewChartId(window.location.pathname);

    for (const [chartId, currentDeleteVerification] of pendingDeleteVerifications) {
      const isCurrentChartDeleted = currentChartId === currentDeleteVerification.chartId && hasInvalidChartPageSignal();
      const isDeletedLayoutStillPresent = await isLayoutPresentInDialog(
        currentDeleteVerification.title,
        currentDeleteVerification.chartId,
      );

      if (isCurrentChartDeleted || isDeletedLayoutStillPresent === false) {
        pendingDeleteVerifications.delete(chartId);
        await sendRuntimeMessage<null>({
          chartId: currentDeleteVerification.chartId,
          publicId,
          type: runtimeMessageType.tvOwnedLayoutDeleteCompleted,
        });
        continue;
      }

      if (Date.now() - currentDeleteVerification.confirmedAt > deleteVerificationTtlMs) {
        pendingDeleteVerifications.delete(chartId);
      }
    }

    if (pendingDeleteVerifications.size > 0) {
      scheduleDeleteVerification();
    }
  };

  const runRenameVerification = async () => {
    const currentRenameVerification = pendingRenameVerification;
    const publicId = await resolveRestrictedPublicId();

    if (!currentRenameVerification || !publicId || isDisposed) {
      return;
    }

    if (document.querySelector(renameLayoutDialogSelector) instanceof HTMLElement) {
      if (Date.now() - currentRenameVerification.submittedAt > deleteVerificationTtlMs) {
        pendingRenameVerification = null;
        return;
      }

      scheduleRenameVerification();
      return;
    }

    pendingRenameVerification = null;
    await sendRuntimeMessage<null>({
      chartId: currentRenameVerification.chartId,
      publicId,
      title: currentRenameVerification.title,
      type: runtimeMessageType.tvOwnedLayoutRenameRequested,
    });
  };

  const mutationObserver = new MutationObserver(() => {
    if (pendingDeleteVerifications.size > 0 || hasInvalidChartPageSignal()) {
      scheduleRouteCheck();
    }
  });

  const handleDocumentMouseDown = (event: MouseEvent) => {
    const mouseDownTarget = event.target;

    if (!(mouseDownTarget instanceof Element)) {
      return;
    }

    const layoutRow = mouseDownTarget.closest(openLayoutRowSelector);

    if (!(layoutRow instanceof HTMLAnchorElement) || !shouldPreloadOpenLayoutFromMouseEvent(event)) {
      return;
    }

    void rememberOwnedLayoutFromRow(layoutRow, resolveRestrictedPublicId, false).catch(() => undefined);
  };

  const handleDocumentContextMenu = (event: Event) => {
    const contextMenuTarget = event.target;

    if (!(contextMenuTarget instanceof Element)) {
      return;
    }

    const layoutRow = contextMenuTarget.closest(openLayoutRowSelector);

    if (!(layoutRow instanceof HTMLAnchorElement)) {
      return;
    }

    void rememberOwnedLayoutFromRow(layoutRow, resolveRestrictedPublicId, false).catch(() => undefined);
  };

  const handleDocumentClick = (event: Event) => {
    const clickTarget = event.target;

    if (!(clickTarget instanceof Element)) {
      return;
    }

    const deleteButton = clickTarget.closest(openLayoutDeleteButtonSelector);

    if (deleteButton instanceof HTMLElement) {
      deleteCandidate = readDeleteCandidate(deleteButton);
      return;
    }

    const confirmDeleteButton = clickTarget.closest(confirmDialogDeleteButtonSelector);

    if (confirmDeleteButton instanceof HTMLButtonElement) {
      if (deleteCandidate) {
        pendingDeleteVerifications.set(deleteCandidate.chartId, {
          chartId: deleteCandidate.chartId,
          confirmedAt: Date.now(),
          title: deleteCandidate.title,
        });
        deleteCandidate = null;
        scheduleDeleteVerification();
      }

      return;
    }

    if (clickTarget.closest(confirmDialogDismissButtonSelector)) {
      deleteCandidate = null;
      return;
    }

    const saveButton = clickTarget.closest(layoutDialogSaveButtonSelector);

    if (saveButton instanceof HTMLButtonElement) {
      void handleLayoutDialogSaveClick(saveButton, event, resolveRestrictedPublicId, () => {
        pendingCopyRecovery = null;
      }, (nextCopyRecovery) => {
        pendingCopyRecovery = nextCopyRecovery;
      }, scheduleCopyRecovery, (nextRenameVerification) => {
        pendingRenameVerification = nextRenameVerification;
      }, scheduleRenameVerification);
      return;
    }

    if (clickTarget.closest(layoutDialogCancelButtonSelector)) {
      pendingCopyRecovery = null;
      pendingRenameVerification = null;
      return;
    }

    const layoutRow = clickTarget.closest(openLayoutRowSelector);

    if (layoutRow instanceof HTMLAnchorElement) {
      void handleOpenLayoutRowClick(layoutRow, event, resolveRestrictedPublicId).catch(() => undefined);
    }
  };

  const handleRouteChanged = () => {
    lastConfirmedRouteKey = "";
    scheduleRouteCheck();
  };

  window.history.pushState = function pushState(...args) {
    const pushStateResult = originalPushState.apply(this, args);

    handleRouteChanged();

    return pushStateResult;
  };

  window.history.replaceState = function replaceState(...args) {
    const replaceStateResult = originalReplaceState.apply(this, args);

    handleRouteChanged();

    return replaceStateResult;
  };

  mutationObserver.observe(document.documentElement, {
    characterData: true,
    childList: true,
    subtree: true,
  });
  document.addEventListener("mousedown", handleDocumentMouseDown, true);
  document.addEventListener("click", handleDocumentClick, true);
  document.addEventListener("contextmenu", handleDocumentContextMenu, true);
  window.addEventListener("hashchange", handleRouteChanged);
  window.addEventListener("popstate", handleRouteChanged);

  scheduleRouteCheck();

  return () => {
    isDisposed = true;
    mutationObserver.disconnect();
    document.removeEventListener("mousedown", handleDocumentMouseDown, true);
    document.removeEventListener("click", handleDocumentClick, true);
    document.removeEventListener("contextmenu", handleDocumentContextMenu, true);
    window.removeEventListener("hashchange", handleRouteChanged);
    window.removeEventListener("popstate", handleRouteChanged);
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
  };
}

async function handleOpenLayoutRowClick(
  layoutRow: HTMLAnchorElement,
  event: Event,
  resolveRestrictedPublicId: () => Promise<string | null>,
): Promise<void> {
  if (layoutRow.getAttribute(pendingIntentBypassAttribute) === "true") {
    layoutRow.removeAttribute(pendingIntentBypassAttribute);
    return;
  }

  if (!shouldInterceptClick(event)) {
    await rememberOwnedLayoutFromRow(layoutRow, resolveRestrictedPublicId, false);
    return;
  }

  const publicId = await resolveRestrictedPublicId();

  if (!publicId) {
    return;
  }

  const ownedLayout = readOwnedLayoutFromRow(layoutRow);

  if (!ownedLayout) {
    return;
  }

  stopClick(event);
  try {
    await rememberOwnedLayout(publicId, ownedLayout, true);
  } catch {
    // Fall back to the native TradingView navigation if the extension runtime is temporarily unavailable.
  }
  assignPageLocation(ownedLayout.url);
}

async function handleLayoutDialogSaveClick(
  saveButton: HTMLButtonElement,
  event: Event,
  resolveRestrictedPublicId: () => Promise<string | null>,
  clearPendingCopyRecovery: () => void,
  setPendingCopyRecovery: (pendingCopyRecovery: PendingCopyRecovery | null) => void,
  scheduleCopyRecovery: (delayMs?: number) => void,
  setPendingRenameVerification: (pendingRenameVerification: PendingRenameVerification | null) => void,
  scheduleRenameVerification: () => void,
): Promise<void> {
  if (saveButton.getAttribute(pendingIntentBypassAttribute) === "true") {
    saveButton.removeAttribute(pendingIntentBypassAttribute);
    return;
  }

  const dialogRoot = saveButton.closest(`${createLayoutDialogSelector}, ${renameLayoutDialogSelector}`);

  if (!(dialogRoot instanceof HTMLElement)) {
    return;
  }

  const saveAction = readDialogSaveAction(dialogRoot, saveButton);

  if (!saveAction) {
    return;
  }

  const layoutTitle = readDialogInputTitle(dialogRoot);

  if (!layoutTitle) {
    return;
  }

  const publicId = await resolveRestrictedPublicId();

  if (!publicId) {
    return;
  }

  if (saveAction === "rename") {
    const currentChartId = getTradingViewChartId(window.location.pathname);

    if (!currentChartId) {
      return;
    }

    setPendingRenameVerification({
      chartId: currentChartId,
      submittedAt: Date.now(),
      title: layoutTitle,
    });
    scheduleRenameVerification();
    return;
  }

  if (!shouldInterceptClick(event)) {
    return;
  }

  const currentChartId = getTradingViewChartId(window.location.pathname);

  stopClick(event);
  let pendingOperationResult: { operationId: string | null } = { operationId: null };

  try {
    pendingOperationResult = await sendRuntimeMessage<{ operationId: string | null }>({
      expectedTitle: layoutTitle,
      kind: saveAction,
      openInNewTab: saveAction === "create" ? readCreateDialogShouldOpenInNewTab(dialogRoot) : false,
      publicId,
      sourceChartId: currentChartId,
      type: runtimeMessageType.tvOwnedLayoutPendingOperationSubmitted,
    });
  } catch {
    clearPendingCopyRecovery();
    replayLayoutDialogSaveButton(saveButton);
    return;
  }

  if (saveAction === "copy" && currentChartId) {
    const currentLayoutTitle = readCurrentLayoutTitle();

    setPendingCopyRecovery({
      attempts: 0,
      expectedTitle: layoutTitle,
      operationId: pendingOperationResult.operationId ?? crypto.randomUUID(),
      sourceChartId: currentChartId,
      sourceLayoutLabel: currentLayoutTitle || layoutTitle,
      submittedAt: Date.now(),
    });
    scheduleCopyRecovery(copyRecoveryInitialDelayMs);
  } else {
    clearPendingCopyRecovery();
  }

  saveButton.setAttribute(pendingIntentBypassAttribute, "true");
  saveButton.click();
}

function readOwnedLayoutFromRow(layoutRow: HTMLAnchorElement) {
  if (!layoutRow.closest(openLayoutsDialogSelector)) {
    return null;
  }

  const chartId = getTradingViewChartId(layoutRow.href);
  const layoutTitle = normalizeText(layoutRow.querySelector(openLayoutRowTitleSelector)?.textContent);

  if (!chartId || !layoutTitle) {
    return null;
  }

  return {
    chartId,
    title: layoutTitle,
    updatedAt: readOpenLayoutRowUpdatedAt(layoutRow),
    url: layoutRow.href,
  };
}

function readDeleteCandidate(deleteButton: HTMLElement): DeleteCandidate | null {
  const layoutRow = deleteButton.closest(openLayoutRowSelector);

  if (!(layoutRow instanceof HTMLAnchorElement)) {
    return null;
  }

  const ownedLayout = readOwnedLayoutFromRow(layoutRow);

  return ownedLayout
    ? {
        chartId: ownedLayout.chartId,
        title: ownedLayout.title,
      }
    : null;
}

function readDialogSaveAction(dialogRoot: HTMLElement, saveButton: HTMLButtonElement): DialogSaveAction {
  const buttonLabel = normalizeText(saveButton.textContent).toLowerCase();
  const dialogText = normalizeText(dialogRoot.textContent).toLowerCase();

  if (dialogRoot.matches(createLayoutDialogSelector)) {
    return buttonLabel.includes("create") && dialogText.includes("create layout") ? "create" : null;
  }

  if (!dialogRoot.matches(renameLayoutDialogSelector)) {
    return null;
  }

  if (buttonLabel.includes("make copy") || dialogText.includes("make copy of chart layout")) {
    return "copy";
  }

  if (buttonLabel.includes("rename") || dialogText.includes("rename chart layout")) {
    return "rename";
  }

  return null;
}

function readDialogInputTitle(dialogRoot: HTMLElement): string {
  const dialogInput = dialogRoot.querySelector(layoutDialogInputSelector);

  return dialogInput instanceof HTMLInputElement ? normalizeText(dialogInput.value) : "";
}

function readCurrentLayoutTitle(): string {
  const currentLayoutTitle = document.querySelector(currentLayoutTitleSelector);

  return normalizeText(currentLayoutTitle?.textContent);
}

function readCreateDialogShouldOpenInNewTab(dialogRoot: HTMLElement): boolean {
  if (!dialogRoot.matches(createLayoutDialogSelector)) {
    return false;
  }

  const openInNewTabCheckbox = dialogRoot.querySelector('input[type="checkbox"]');

  return openInNewTabCheckbox instanceof HTMLInputElement ? openInNewTabCheckbox.checked : false;
}

function hasInvalidChartPageSignal(): boolean {
  const bodyText = document.body?.innerText ?? document.body?.textContent ?? "";

  return (
    document.querySelector(chartNotFoundSelector) instanceof HTMLElement ||
    document.title.includes("Chart Not Found") ||
    bodyText.includes("We can't open this chart layout for you") ||
    bodyText.includes("This isn't the page you're looking for")
  );
}

function shouldInterceptClick(event: Event): boolean {
  if (!(event instanceof MouseEvent)) {
    return true;
  }

  return !event.defaultPrevented && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

function shouldPreloadOpenLayoutFromMouseEvent(event: MouseEvent): boolean {
  return event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

function stopClick(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function replayLayoutDialogSaveButton(saveButton: HTMLButtonElement) {
  saveButton.setAttribute(pendingIntentBypassAttribute, "true");
  saveButton.click();
}

function replaceLocation(targetUrl: string) {
  if (!targetUrl || window.location.href === targetUrl) {
    return;
  }

  replacePageLocation(targetUrl);
}

function readOpenLayoutRowUpdatedAt(layoutRow: HTMLAnchorElement): number {
  const rowTimestamp = layoutRow.querySelector("time[datetime]")?.getAttribute("datetime");
  const parsedTimestamp = rowTimestamp ? Date.parse(rowTimestamp) : Number.NaN;

  return Number.isNaN(parsedTimestamp) ? 0 : parsedTimestamp;
}

async function rememberOwnedLayoutFromRow(
  layoutRow: HTMLAnchorElement,
  resolveRestrictedPublicId: () => Promise<string | null>,
  shouldMarkAsOpened: boolean,
): Promise<void> {
  const publicId = await resolveRestrictedPublicId();
  const ownedLayout = readOwnedLayoutFromRow(layoutRow);

  if (!publicId || !ownedLayout) {
    return;
  }

  await rememberOwnedLayout(publicId, ownedLayout, shouldMarkAsOpened);
}

async function rememberOwnedLayout(
  publicId: string,
  ownedLayout: { chartId: string; title: string; updatedAt: number; url: string },
  shouldMarkAsOpened: boolean,
): Promise<void> {
  await sendRuntimeMessage<null>({
    chartId: ownedLayout.chartId,
    publicId,
    shouldMarkAsOpened,
    title: ownedLayout.title,
    type: runtimeMessageType.tvOwnedLayoutRememberRequested,
    updatedAt: ownedLayout.updatedAt,
    url: ownedLayout.url,
  });
}

async function requestRouteStatus(currentUrl: string): Promise<RouteStatus> {
  return sendRuntimeMessage<RouteStatus>({
    type: runtimeMessageType.tvOwnedLayoutRouteStatusRequested,
    url: currentUrl,
  });
}

async function readPendingOperationStatus(
  publicId: string,
  operationId: string,
): Promise<{ boundChartId: string | null; isActive: boolean; isBound: boolean; kind: "copy" | "create" | null }> {
  return sendRuntimeMessage<{ boundChartId: string | null; isActive: boolean; isBound: boolean; kind: "copy" | "create" | null }>({
    operationId,
    publicId,
    type: runtimeMessageType.tvOwnedLayoutOperationStatusRequested,
  });
}

async function findLayoutByChartIdFromDialog(
  chartId: string,
  publicId: string,
): Promise<{ chartId: string; title: string; updatedAt: number; url: string } | null> {
  const hadOpenLayoutsDialog = document.querySelector(openLayoutsDialogSelector) instanceof HTMLElement;
  const ownedLayoutState = await readTvOwnedLayoutState(publicId);

  if (ownedLayoutState.layouts.some((layout) => layout.chartId === chartId)) {
    return null;
  }

  if (!hadOpenLayoutsDialog && !(await openLayoutsDialog())) {
    return null;
  }

  const layoutRow = document.querySelector(
    `${openLayoutsDialogSelector} ${openLayoutRowSelector}[href$="/chart/${chartId}/"]`,
  );
  const copiedLayout = layoutRow instanceof HTMLAnchorElement ? readOwnedLayoutFromRow(layoutRow) : null;

  if (!hadOpenLayoutsDialog) {
    closeOpenLayoutsDialog();
  }

  return copiedLayout;
}

async function findCopiedLayoutFromDialog(
  pendingCopyRecovery: PendingCopyRecovery,
  publicId: string,
): Promise<{ chartId: string; title: string; updatedAt: number; url: string } | null> {
  const hadOpenLayoutsDialog = document.querySelector(openLayoutsDialogSelector) instanceof HTMLElement;
  const ownedLayoutState = await readTvOwnedLayoutState(publicId);
  const knownOwnedChartIds = new Set(ownedLayoutState.layouts.map((layout) => layout.chartId));

  if (!hadOpenLayoutsDialog && !(await openLayoutsDialog())) {
    return null;
  }

  const matchingCopiedLayouts = [...document.querySelectorAll(`${openLayoutsDialogSelector} ${openLayoutRowSelector}`)]
    .flatMap((layoutRow) => {
      if (!(layoutRow instanceof HTMLAnchorElement)) {
        return [];
      }

      const copiedChartId = getTradingViewChartId(layoutRow.href);
      const copiedUpdatedAt = readOpenLayoutRowUpdatedAt(layoutRow);
      const copiedTitle = normalizeText(layoutRow.querySelector(openLayoutRowTitleSelector)?.textContent);

      if (
        !copiedChartId ||
        copiedChartId === pendingCopyRecovery.sourceChartId ||
        knownOwnedChartIds.has(copiedChartId) ||
        copiedUpdatedAt < pendingCopyRecovery.submittedAt - copyRecoveryTimestampToleranceMs
      ) {
        return [];
      }

      return [
        {
          chartId: copiedChartId,
          title: copiedTitle || pendingCopyRecovery.expectedTitle,
          updatedAt: copiedUpdatedAt,
          url: layoutRow.href,
        },
      ];
    })
    .sort((firstLayout, secondLayout) => secondLayout.updatedAt - firstLayout.updatedAt);

  const exactTitleMatches = matchingCopiedLayouts.filter((layout) => layout.title === pendingCopyRecovery.expectedTitle);
  const sourceTitleMatches = matchingCopiedLayouts.filter((layout) => layout.title === pendingCopyRecovery.sourceLayoutLabel);
  const copiedLayout =
    exactTitleMatches[0] ??
    (pendingCopyRecovery.expectedTitle === pendingCopyRecovery.sourceLayoutLabel ? (sourceTitleMatches[0] ?? null) : null);

  if (!hadOpenLayoutsDialog) {
    closeOpenLayoutsDialog();
  }

  return copiedLayout;
}

async function isLayoutPresentInDialog(expectedTitle: string | null, chartId: string): Promise<boolean | null> {
  const hadOpenLayoutsDialog = document.querySelector(openLayoutsDialogSelector) instanceof HTMLElement;

  if (!hadOpenLayoutsDialog && !(await openLayoutsDialog())) {
    return null;
  }

  const restoreDialogSearch = applyOpenLayoutsDialogTitleFilter(expectedTitle);

  if (restoreDialogSearch) {
    await waitForDelay(50);
  }

  const isLayoutPresent =
    document.querySelector(`${openLayoutsDialogSelector} ${openLayoutRowSelector}[href$="/chart/${chartId}/"]`) !== null;

  restoreDialogSearch?.();

  if (!hadOpenLayoutsDialog) {
    closeOpenLayoutsDialog();
  }

  return isLayoutPresent;
}

async function openLayoutsDialog(): Promise<boolean> {
  if (document.querySelector(openLayoutsDialogSelector) instanceof HTMLElement) {
    return true;
  }

  const manageLayoutsButton = document.querySelector(manageLayoutsButtonSelector);

  if (!(manageLayoutsButton instanceof HTMLButtonElement)) {
    return false;
  }

  manageLayoutsButton.click();

  const openLayoutMenuItem = await waitForElement(() => {
    const menuItems = document.querySelectorAll(menuItemSelector);

    return [...menuItems].find((menuItem) => normalizeText(menuItem.textContent).startsWith(openLayoutMenuItemLabel)) ?? null;
  });

  if (!(openLayoutMenuItem instanceof HTMLElement)) {
    return false;
  }

  openLayoutMenuItem.click();

  return (await waitForElement(() => document.querySelector(openLayoutsDialogSelector), 20, 50)) instanceof HTMLElement;
}

function closeOpenLayoutsDialog() {
  const closeButton = document.querySelector(openLayoutsDialogCloseButtonSelector);

  if (closeButton instanceof HTMLButtonElement) {
    closeButton.click();
    return;
  }

  document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
}

function applyOpenLayoutsDialogTitleFilter(expectedTitle: string | null): (() => void) | null {
  const searchInput = document.querySelector(openLayoutsDialogSearchInputSelector);

  if (!(searchInput instanceof HTMLInputElement) || !expectedTitle) {
    return null;
  }

  const previousValue = searchInput.value;
  const previousReadOnly = searchInput.readOnly;

  searchInput.readOnly = false;
  setInputValue(searchInput, expectedTitle);

  return () => {
    searchInput.readOnly = false;
    setInputValue(searchInput, previousValue);
    searchInput.readOnly = previousReadOnly;
  };
}

async function waitForElement(
  readElement: () => Element | null,
  maxAttempts = 10,
  retryDelayMs = 30,
): Promise<Element | null> {
  for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex += 1) {
    const currentElement = readElement();

    if (currentElement) {
      return currentElement;
    }

    await waitForDelay(retryDelayMs);
  }

  return null;
}

async function waitForDelay(delayMs: number): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function sendRuntimeMessage<TValue>(message: RuntimeMessage): Promise<TValue> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    throw new Error("Runtime extension tidak tersedia.");
  }

  return new Promise<TValue>((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: { ok?: boolean; value?: TValue; errorMessage?: string } | undefined) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message ?? "Runtime request failed."));
        return;
      }

      if (!response?.ok) {
        reject(new Error(response?.errorMessage ?? "Runtime request failed."));
        return;
      }

      resolve((response.value ?? null) as TValue);
    });
  });
}
