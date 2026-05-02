import { detectAssetPlatformFromHostname } from "@/lib/asset-access/platforms";
import { readBootstrapCache, type BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";
import { runtimeMessageType } from "@/lib/runtime/messages";

const mainMenuButtonSelector = 'button[data-qa-id="main-menu-button"]';
const mainAvatarImageSelector = `${mainMenuButtonSelector} img`;
const mainAvatarBadgeSelector = `${mainMenuButtonSelector} + span`;
const desktopPopupMenuSelector = '[data-qa-id="popup-menu-container"][role="treegrid"]';
const mobilePopupMenuSelector = '[data-qa-id="overlap-manager-root"] .container-U2jIw4km';
const desktopProfileMenuItemSelector =
  '[data-qa-id="main-menu-user-menu-item"][data-role="menuitem"]';
const profileMenuImageSelector = "img.profileItem-U2jIw4km";
const homeMenuItemSelector = 'a[aria-label="Home"][data-role="menuitem"]';
const logoutMenuItemSelector = '[data-qa-id="main-menu-sign-out-item"][data-role="menuitem"]';
const desktopPublishSelector = "#header-toolbar-publish-desktop";
const mobilePublishSelector = "#header-toolbar-publish-mobile";
const mobilePublishWrapperSelector = ".mobilePublish-OhqNVIYA";
const desktopTradeSelector = "#header-toolbar-trade-desktop";
const quickSearchSelector = "#header-toolbar-quick-search";
const createAlertSelector = "#header-toolbar-alerts";
const favoriteIndicatorsSelector =
  '#header-toolbar-indicators button[data-name="show-favorite-indicators"]';
const sidebarAlertsSelector = 'button[data-name="alerts"]';
const sidebarChatsSelector = 'button[data-name="union_chats"]';
const sidebarProductsSelector = 'button[data-qa-id="products-button"]';
const sidebarHelpSelector = 'button[data-name="help-button"]';
const presetMenuFavoriteButtonSelector = 'button[data-qa-id="preset-menu-favorite-button"]';
const presetMenuFavoriteIconSelector =
  'span.favorite-_FRQhM5Y[aria-label="Add to favorites"], span.favorite-_FRQhM5Y[aria-label="Remove from favorites"]';
const createDialogSelector = '.wrap-B02UUUN3[data-name="create-dialog"]';
const renameDialogSelector = '[data-name="rename-dialog"]';
const saveIndicatorTemplateDialogSelector =
  '[data-dialog-name="Save indicator template"][data-name="save-rename-dialog"]';
const dialogInputSelector = '[data-qa-id="ui-lib-Input-input"]';
const dialogSelectButtonSelector =
  ".inner-slot-W53jtLjw.interactive-W53jtLjw button.button-PYEOTd6i";
const dialogSuggestionsSelector = ".suggestions-uszkUMOz";
const dialogSaveButtonSelector =
  'button[data-qa-id="save-btn"], button[data-qa-id="submit-button"]';
const indicatorTemplatesDialogRootSelector =
  '[role="dialog"], .wrapper-b8SxMnzX, .dialog-b8SxMnzX';
const indicatorTemplatesDialogSelector =
  '.wrapper-b8SxMnzX[data-name="indicator-templates-dialog"][data-dialog-name="Indicator templates"]';
const indicatorTemplatesMyTemplatesDialogSelector =
  '.wrapper-b8SxMnzX[data-name="indicator-templates-dialog"][data-dialog-name="My templates"]';
const indicatorTemplatesTabSelector =
  'button[role="tab"][id="my templates"], button[role="tab"][id="technicals"], button[role="tab"][id="financials"]';
const indicatorTemplatesMyTemplatesTabSelector = 'button[role="tab"][id="my templates"]';
const indicatorTemplatesRestrictedTabSelector =
  'button[role="tab"][id="technicals"], button[role="tab"][id="financials"]';
const indicatorTemplatesSearchInputSelector = 'input[role="searchbox"]';
const indicatorTemplatesRowSelector = 'div[data-role="list-item"][data-title]';
const restrictedIndicatorTemplatesTabOverlaySelector =
  '[data-asset-manager-restricted-tab-overlay="true"]';
const saveLoadMenuButtonSelector = 'button[data-name="save-load-menu"]';
const indicatorTemplatesButtonSelector = 'button[aria-label="Indicator templates"]';
const watchlistsButtonSelector = 'button[data-name="watchlists-button"]';
const drawingTemplatesMenuSelector = 'div[data-qa-id="menu-inner"].menuBox-XktvVkFF';
const drawingTemplatesMenuRowSelector = 'tbody > tr';
const drawingTemplateMenuItemSelector = 'tr[data-role="menuitem"]';
const drawingTemplateLabelSelector = 'span[data-label="true"]';
const drawingTemplateRemoveButtonSelector = 'span[aria-label="Remove"]';
const drawingTemplateSpacerRowSelector = 'tr.subMenu-GJX1EXhk';
const layoutsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="load-layout-dialog"][data-dialog-name="Layouts"]';
const layoutsSearchInputSelector = 'input[role="searchbox"]';
const layoutsSearchClearButtonSelector = 'button[aria-label="Clear"]';
const watchlistsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="Watchlists"]';
const myWatchlistsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="My watchlists"]';
const searchWatchlistsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="Search"]';
const watchlistsSearchInputSelector = 'input[role="searchbox"][placeholder="Search lists"]';
const desktopMyWatchlistsTabSelector = 'button[role="tab"]#my-watch-lists';
const desktopHotlistsTabSelector = 'button[role="tab"]#hot-lists';
const watchlistsRowSelector = 'div[data-role="list-item"][data-title]';
const watchlistsSectionContainerSelector = ".container-UmsFKpIc";
const watchlistsSectionTitleSelector = ".title-RvmSCAQq";
const recentTitleListItemSelector = '[data-qa-id="ui-lib-title-list-item"]';
const recentLayoutMenuItemSelector = '[data-qa-id="save-load-menu-item-recent"]';
const recentIndicatorMenuItemSelector = '[data-group-name="recent"]';
const menuDividerSelector = '.menu-divider-YZ5qU_gy[role="separator"]';
const watchlistsRecentTitleSelector = ".columnsTitle-mQBvegEO.title-GlrQ9d9L";
const watchlistsSeparatorSelector = '.separator-UZn6u4sU[role="separator"]';

const restrictedMenuLabels = [
  "Help Center",
  "What's new",
  "Keyboard shortcuts",
  "Get desktop app",
] as const;
const restrictedMenuPrefixes = ["Support request", "Language"] as const;

const googleHomeUrl = "https://google.com";
const logoutRedirectDelayMs = 250;
const restrictedIndicatorTemplatesAccessDeniedMessage =
  "Access denied, silahkan beli akun full private untuk akses fitur ini!!";
const relevantTradingViewSelectors = [
  mainMenuButtonSelector,
  mainAvatarImageSelector,
  mainAvatarBadgeSelector,
  desktopPopupMenuSelector,
  mobilePopupMenuSelector,
  desktopProfileMenuItemSelector,
  profileMenuImageSelector,
  homeMenuItemSelector,
  logoutMenuItemSelector,
  desktopPublishSelector,
  mobilePublishSelector,
  mobilePublishWrapperSelector,
  desktopTradeSelector,
  quickSearchSelector,
  createAlertSelector,
  favoriteIndicatorsSelector,
  sidebarAlertsSelector,
  sidebarChatsSelector,
  sidebarProductsSelector,
  sidebarHelpSelector,
  presetMenuFavoriteButtonSelector,
  presetMenuFavoriteIconSelector,
  createDialogSelector,
  renameDialogSelector,
  saveIndicatorTemplateDialogSelector,
  dialogInputSelector,
  dialogSelectButtonSelector,
  dialogSuggestionsSelector,
  dialogSaveButtonSelector,
  indicatorTemplatesDialogRootSelector,
  indicatorTemplatesDialogSelector,
  indicatorTemplatesMyTemplatesDialogSelector,
  indicatorTemplatesTabSelector,
  indicatorTemplatesMyTemplatesTabSelector,
  indicatorTemplatesRestrictedTabSelector,
  indicatorTemplatesSearchInputSelector,
  indicatorTemplatesRowSelector,
  saveLoadMenuButtonSelector,
  indicatorTemplatesButtonSelector,
  watchlistsButtonSelector,
  drawingTemplatesMenuSelector,
  drawingTemplatesMenuRowSelector,
  drawingTemplateMenuItemSelector,
  drawingTemplateLabelSelector,
  drawingTemplateRemoveButtonSelector,
  drawingTemplateSpacerRowSelector,
  layoutsDialogSelector,
  layoutsSearchInputSelector,
  layoutsSearchClearButtonSelector,
  watchlistsDialogSelector,
  myWatchlistsDialogSelector,
  searchWatchlistsDialogSelector,
  watchlistsSearchInputSelector,
  desktopMyWatchlistsTabSelector,
  desktopHotlistsTabSelector,
  watchlistsRowSelector,
  watchlistsSectionContainerSelector,
  watchlistsSectionTitleSelector,
  recentTitleListItemSelector,
  recentLayoutMenuItemSelector,
  recentIndicatorMenuItemSelector,
  menuDividerSelector,
  watchlistsRecentTitleSelector,
  watchlistsSeparatorSelector,
].join(", ");

type TradingViewMenuMode = "default" | "restricted";
type TradingViewMenuVariant = "desktop" | "mobile";

type TradingViewOverrideState = {
  avatarAlt: string | null;
  avatarSrc: string | null;
  menuMode: TradingViewMenuMode;
  publicId: string | null;
};

type TradingViewLogoutStatus = "idle" | "loading" | "success" | "error";

export function installTradingViewAvatarOverride(): () => void {
  if (!isTradingViewPage()) {
    return () => undefined;
  }

  const usesMobileLayout = isTradingViewMobileLayout();
  let overrideState: TradingViewOverrideState | null = null;
  let logoutStatus: TradingViewLogoutStatus = "idle";
  let isWaitingForFirstMenuOpen = false;
  let loadOverrideStatePromise: Promise<void> | null = null;
  let mutationObserver: MutationObserver | null = null;
  let isObserverActive = false;

  const syncTradingViewPage = () => {
    runWithoutObserver(() => {
      syncMainAvatar(overrideState);
      removeMainAvatarBadge();
      syncRestrictedTradingViewActions(overrideState);
      syncOpenPopupMenu({ logoutStatus, overrideState, onLogoutClick: handleLogoutClick });
    });
  };

  const ensureOverrideStateLoaded = () => {
    if (overrideState) {
      return Promise.resolve();
    }

    if (loadOverrideStatePromise) {
      return loadOverrideStatePromise;
    }

    loadOverrideStatePromise = readBootstrapCache()
      .then((bootstrapCacheRecord) => {
        overrideState = createTradingViewOverrideState(bootstrapCacheRecord);
        syncTradingViewPage();
      })
      .finally(() => {
        loadOverrideStatePromise = null;
      });

    return loadOverrideStatePromise;
  };

  const handleMutations: MutationCallback = (mutations) => {
    const openMenu = findOpenTradingViewMenu();

    if (openMenu && !overrideState) {
      hideMenuUntilStateIsReady(openMenu.root);
      void ensureOverrideStateLoaded().catch(() => undefined);
      return;
    }

    if (mutations.some(isRelevantTradingViewMutation)) {
      syncTradingViewPage();
    }
  };

  const handleMainMenuButtonClick = (event: Event) => {
    if (usesMobileLayout || overrideState) {
      return;
    }

    const clickTarget = event.target;

    if (!(clickTarget instanceof Element)) {
      return;
    }

    const mainMenuButton = clickTarget.closest(mainMenuButtonSelector);

    if (!(mainMenuButton instanceof HTMLButtonElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (isWaitingForFirstMenuOpen) {
      return;
    }

    isWaitingForFirstMenuOpen = true;

    void ensureOverrideStateLoaded()
      .catch(() => undefined)
      .finally(() => {
        isWaitingForFirstMenuOpen = false;
        mainMenuButton.click();
      });
  };

  function handleLogoutClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (logoutStatus === "loading") {
      return;
    }

    logoutStatus = "loading";
    syncTradingViewPage();

    void requestTradingViewLogout()
      .then((redirectTo) => {
        logoutStatus = "success";
        syncTradingViewPage();

        window.setTimeout(() => {
          window.location.assign(redirectTo);
        }, logoutRedirectDelayMs);
      })
      .catch(() => {
        logoutStatus = "error";
        syncTradingViewPage();
      });
  }

  function pauseObserver() {
    if (!mutationObserver || !isObserverActive) {
      return;
    }

    mutationObserver.disconnect();
    isObserverActive = false;
  }

  function resumeObserver() {
    if (!mutationObserver || isObserverActive) {
      return;
    }

    mutationObserver.observe(document.documentElement, {
      attributeFilter: ["src"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    isObserverActive = true;
  }

  function runWithoutObserver(callback: () => void) {
    pauseObserver();

    try {
      callback();
    } finally {
      resumeObserver();
    }
  }

  mutationObserver = new MutationObserver(handleMutations);
  resumeObserver();
  document.addEventListener("click", handleMainMenuButtonClick, true);

  void ensureOverrideStateLoaded().catch(() => undefined);
  syncTradingViewPage();

  return () => {
    pauseObserver();
    document.removeEventListener("click", handleMainMenuButtonClick, true);
  };
}

function isTradingViewPage() {
  return detectAssetPlatformFromHostname(window.location.hostname) === "tradingview";
}

function isTradingViewMobileLayout() {
  return document.documentElement.classList.contains("feature-mobiletouch");
}

function syncMainAvatar(overrideState: TradingViewOverrideState | null) {
  const avatarImage = document.querySelector(mainAvatarImageSelector);

  if (!(avatarImage instanceof HTMLImageElement) || !overrideState) {
    return;
  }

  if (overrideState.avatarSrc && avatarImage.src !== overrideState.avatarSrc) {
    avatarImage.src = overrideState.avatarSrc;
  }

  if (overrideState.avatarAlt && avatarImage.alt !== overrideState.avatarAlt) {
    avatarImage.alt = overrideState.avatarAlt;
  }
}

function syncRestrictedTradingViewActions(overrideState: TradingViewOverrideState | null) {
  if (!overrideState || overrideState.menuMode !== "restricted") {
    return;
  }

  removeRestrictedHeaderActions();
  removeRestrictedRightSidebarActions();
  disableRestrictedRightSidebarActions();
  disableRestrictedFavoriteButtons();
  removeRestrictedRecentSections();
  syncRestrictedTradingViewDialogs(overrideState.publicId);
  syncRestrictedIndicatorTemplatesDialogs(overrideState.publicId);
  syncRestrictedDrawingTemplatesMenu(overrideState.publicId);
  syncRestrictedLayoutsDialogs(overrideState.publicId);
  syncRestrictedWatchlistsDialogs(overrideState.publicId);
}

function removeRestrictedHeaderActions() {
  removeElement(document.querySelector(desktopPublishSelector));
  removeElement(findMobilePublishWrapper());
  removeElement(document.querySelector(desktopTradeSelector));
  removeElement(document.querySelector(quickSearchSelector));
  removeElement(document.querySelector(createAlertSelector));
  removeElement(document.querySelector(favoriteIndicatorsSelector));
}

function removeRestrictedRightSidebarActions() {
  removeElement(document.querySelector(sidebarAlertsSelector));
  removeElement(document.querySelector(sidebarChatsSelector));
}

function disableRestrictedRightSidebarActions() {
  disableButton(document.querySelector(sidebarProductsSelector));
  disableButton(document.querySelector(sidebarHelpSelector));
}

function disableRestrictedFavoriteButtons() {
  const favoriteButtons = document.querySelectorAll(presetMenuFavoriteButtonSelector);
  const favoriteIcons = document.querySelectorAll(presetMenuFavoriteIconSelector);

  for (const favoriteButton of favoriteButtons) {
    disableFavoriteButton(favoriteButton);
  }

  for (const favoriteIcon of favoriteIcons) {
    disableFavoriteIcon(favoriteIcon);
  }
}

function removeRestrictedRecentSections() {
  removeRestrictedRecentLayoutSection();
  removeRestrictedRecentIndicatorSection();
  removeRestrictedRecentWatchlistsSection();
}

function removeRestrictedRecentLayoutSection() {
  removeRecentRowgroupSections(recentLayoutMenuItemSelector);
}

function removeRestrictedRecentIndicatorSection() {
  removeRecentRowgroupSections(recentIndicatorMenuItemSelector);
}

function removeRestrictedRecentWatchlistsSection() {
  const recentTitleNodes = document.querySelectorAll(watchlistsRecentTitleSelector);

  for (const recentTitleNode of recentTitleNodes) {
    if (!(recentTitleNode instanceof HTMLElement)) {
      continue;
    }

    if (normalizeText(recentTitleNode.textContent) !== "Recently used") {
      continue;
    }

    const sectionRoot = recentTitleNode.parentElement;

    if (!(sectionRoot instanceof HTMLElement)) {
      continue;
    }

    const previousElement = sectionRoot.previousElementSibling;

    if (
      previousElement instanceof HTMLElement &&
      previousElement.matches(watchlistsSeparatorSelector)
    ) {
      previousElement.remove();
    }

    sectionRoot.remove();
  }
}

function syncRestrictedTradingViewDialogs(publicId: string | null) {
  const dialogRoots = findRestrictedDialogRoots();

  for (const dialogRoot of dialogRoots) {
    syncRestrictedTradingViewDialog(dialogRoot, publicId);
  }
}

function findRestrictedDialogRoots() {
  const dialogRoots = new Set<HTMLElement>();

  for (const selector of [
    createDialogSelector,
    renameDialogSelector,
    saveIndicatorTemplateDialogSelector,
  ]) {
    const matchedRoots = document.querySelectorAll(selector);

    for (const matchedRoot of matchedRoots) {
      if (matchedRoot instanceof HTMLElement) {
        dialogRoots.add(matchedRoot);
      }
    }
  }

  return [...dialogRoots];
}

function syncRestrictedIndicatorTemplatesDialogs(publicId: string | null) {
  const dialogRoots = findRestrictedIndicatorTemplatesDialogRoots();

  for (const dialogRoot of dialogRoots) {
    syncRestrictedIndicatorTemplatesDialog(dialogRoot, publicId);
  }
}

function findRestrictedIndicatorTemplatesDialogRoots() {
  const dialogRoots = new Set<HTMLElement>();

  for (const selector of [
    indicatorTemplatesDialogSelector,
    indicatorTemplatesMyTemplatesDialogSelector,
  ]) {
    const matchedRoots = document.querySelectorAll(selector);

    for (const matchedRoot of matchedRoots) {
      if (matchedRoot instanceof HTMLElement) {
        dialogRoots.add(matchedRoot);
      }
    }
  }

  return [...dialogRoots];
}

function syncRestrictedLayoutsDialogs(publicId: string | null) {
  const dialogRoots = document.querySelectorAll(layoutsDialogSelector);

  for (const dialogRoot of dialogRoots) {
    if (!(dialogRoot instanceof HTMLElement)) {
      continue;
    }

    syncRestrictedLayoutsDialog(dialogRoot, publicId);
  }
}

function syncRestrictedLayoutsDialog(dialogRoot: HTMLElement, publicId: string | null) {
  const requiredPublicId = publicId?.trim() ?? "";
  const searchInput = dialogRoot.querySelector(layoutsSearchInputSelector);

  if (searchInput instanceof HTMLInputElement) {
    syncRestrictedLayoutsSearchInput(searchInput, requiredPublicId);
  }

  hideRestrictedLayoutsClearButtons(dialogRoot);
}

function syncRestrictedLayoutsSearchInput(
  searchInput: HTMLInputElement,
  requiredPublicId: string,
) {
  if (searchInput.value !== requiredPublicId) {
    setInputValue(searchInput, requiredPublicId);
  }

  searchInput.readOnly = true;
  searchInput.setAttribute("aria-readonly", "true");
}

function hideRestrictedLayoutsClearButtons(dialogRoot: HTMLElement) {
  const clearButtons = dialogRoot.querySelectorAll(layoutsSearchClearButtonSelector);

  for (const clearButton of clearButtons) {
    if (!(clearButton instanceof HTMLElement)) {
      continue;
    }

    clearButton.hidden = true;
    clearButton.setAttribute("aria-hidden", "true");
    clearButton.style.display = "none";
    clearButton.style.pointerEvents = "none";
  }
}

function syncRestrictedDrawingTemplatesMenu(publicId: string | null) {
  const requiredPublicId = publicId?.trim() ?? "";
  const menuRoots = document.querySelectorAll(drawingTemplatesMenuSelector);

  for (const menuRoot of menuRoots) {
    if (!(menuRoot instanceof HTMLElement) || !isDrawingTemplatesMenuRoot(menuRoot)) {
      continue;
    }

    filterRestrictedDrawingTemplateRows(menuRoot, requiredPublicId);
  }
}

function isDrawingTemplatesMenuRoot(menuRoot: HTMLElement) {
  return (
    menuRoot.querySelector(drawingTemplateRemoveButtonSelector) instanceof HTMLElement &&
    findMenuItemByNormalizedText(menuRoot, "Save Drawing Template As…") instanceof
      HTMLTableRowElement &&
    findMenuItemByNormalizedText(menuRoot, "Apply Default Drawing Template") instanceof
      HTMLTableRowElement
  );
}

function findMenuItemByNormalizedText(menuRoot: HTMLElement, label: string) {
  return (
    [...menuRoot.querySelectorAll(drawingTemplateMenuItemSelector)].find((row) => {
      if (!(row instanceof HTMLTableRowElement)) {
        return false;
      }

      return normalizeText(row.textContent) === label;
    }) ?? null
  );
}

function filterRestrictedDrawingTemplateRows(menuRoot: HTMLElement, requiredPublicId: string) {
  const menuRows = menuRoot.querySelectorAll(drawingTemplatesMenuRowSelector);

  for (const menuRow of menuRows) {
    if (!(menuRow instanceof HTMLTableRowElement) || !isRestrictedDrawingTemplateRow(menuRow)) {
      continue;
    }

    const templateTitle = getRestrictedDrawingTemplateTitle(menuRow);

    if (requiredPublicId.length > 0 && templateTitle.includes(requiredPublicId)) {
      continue;
    }

    const spacerRow = menuRow.nextElementSibling;

    menuRow.remove();

    if (
      spacerRow instanceof HTMLTableRowElement &&
      spacerRow.matches(drawingTemplateSpacerRowSelector)
    ) {
      spacerRow.remove();
    }
  }
}

function isRestrictedDrawingTemplateRow(menuRow: HTMLTableRowElement) {
  return (
    menuRow.matches(drawingTemplateMenuItemSelector) &&
    menuRow.querySelector(drawingTemplateRemoveButtonSelector) instanceof HTMLElement
  );
}

function getRestrictedDrawingTemplateTitle(menuRow: HTMLTableRowElement) {
  const titleLabel = menuRow.querySelector(drawingTemplateLabelSelector);

  return normalizeText(titleLabel?.textContent);
}

function isDesktopIndicatorTemplatesDialogRoot(dialogRoot: HTMLElement) {
  return (
    dialogRoot.querySelector(indicatorTemplatesSearchInputSelector) instanceof
      HTMLInputElement &&
    dialogRoot.querySelector(indicatorTemplatesMyTemplatesTabSelector) instanceof
      HTMLButtonElement
  );
}

function syncRestrictedIndicatorTemplatesDialog(
  dialogRoot: HTMLElement,
  publicId: string | null,
) {
  const requiredPublicId = publicId?.trim() ?? "";
  const dialogName = dialogRoot.dataset.dialogName ?? "";

  if (isDesktopIndicatorTemplatesDialogRoot(dialogRoot)) {
    disableRestrictedNavigationButtons(
      getRestrictedDesktopIndicatorTemplatesButtons(dialogRoot),
    );
    syncRestrictedIndicatorTemplatesRows(dialogRoot, requiredPublicId);
    return;
  }

  if (dialogName === "Indicator templates") {
    disableRestrictedNavigationButtons(
      getRestrictedMobileIndicatorTemplatesButtons(dialogRoot),
    );
    return;
  }

  if (dialogName === "My templates") {
    syncRestrictedIndicatorTemplatesRows(dialogRoot, requiredPublicId);
  }
}

function getRestrictedDesktopIndicatorTemplatesButtons(dialogRoot: HTMLElement) {
  return [...dialogRoot.querySelectorAll(indicatorTemplatesRestrictedTabSelector)].filter(
    (button): button is HTMLButtonElement => button instanceof HTMLButtonElement,
  );
}

function getRestrictedMobileIndicatorTemplatesButtons(dialogRoot: HTMLElement) {
  const restrictedButtons: HTMLButtonElement[] = [];

  for (const label of ["Technicals", "Financials"]) {
    const restrictedButton = findButtonByNormalizedText(dialogRoot, label);

    if (restrictedButton) {
      restrictedButtons.push(restrictedButton);
    }
  }

  return restrictedButtons;
}

function findButtonByNormalizedText(dialogRoot: HTMLElement, label: string) {
  return (
    [...dialogRoot.querySelectorAll("button")].find((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return false;
      }

      return normalizeText(button.textContent) === label;
    }) ?? null
  );
}

function syncRestrictedIndicatorTemplatesRows(
  dialogRoot: HTMLElement,
  requiredPublicId: string,
) {
  const templateRows = dialogRoot.querySelectorAll(indicatorTemplatesRowSelector);

  for (const templateRow of templateRows) {
    if (!(templateRow instanceof HTMLElement)) {
      continue;
    }

    const templateTitle = templateRow.dataset.title?.trim() ?? "";
    const shouldShowRow =
      requiredPublicId.length > 0 && templateTitle.includes(requiredPublicId);

    syncRestrictedListRowVisibility(templateRow, shouldShowRow);
  }
}

function disableRestrictedNavigationButtons(restrictedButtons: HTMLButtonElement[]) {
  for (const restrictedButton of restrictedButtons) {
    restrictedButton.setAttribute("aria-disabled", "true");
    restrictedButton.style.opacity = "0.5";
    restrictedButton.style.cursor = "not-allowed";
    restrictedButton.tabIndex = -1;

    if (!restrictedButton.style.position) {
      restrictedButton.style.position = "relative";
    }

    ensureRestrictedNavigationButtonOverlay(restrictedButton);

    if (restrictedButton.dataset.assetManagerRestrictedBound === "true") {
      continue;
    }

    restrictedButton.dataset.assetManagerRestrictedBound = "true";
    restrictedButton.addEventListener(
      "keydown",
      handleRestrictedNavigationButtonKeyDown,
      true,
    );
    restrictedButton.addEventListener("focus", handleRestrictedNavigationButtonFocus, true);
  }
}

function ensureRestrictedNavigationButtonOverlay(restrictedButton: HTMLButtonElement) {
  let overlay = restrictedButton.querySelector(
    restrictedIndicatorTemplatesTabOverlaySelector,
  ) as HTMLSpanElement | null;

  if (!(overlay instanceof HTMLSpanElement)) {
    overlay = document.createElement("span");
    overlay.dataset.assetManagerRestrictedTabOverlay = "true";
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.zIndex = "1";
    overlay.style.cursor = "not-allowed";
    overlay.style.background = "transparent";
    restrictedButton.append(overlay);
  }

  if (overlay.dataset.assetManagerRestrictedBound === "true") {
    return;
  }

  overlay.dataset.assetManagerRestrictedBound = "true";

  for (const eventName of [
    "pointerdown",
    "mousedown",
    "pointerup",
    "mouseup",
    "touchstart",
    "touchend",
  ]) {
    overlay.addEventListener(eventName, handleRestrictedNavigationBlockedPointerEvent, true);
  }

  overlay.addEventListener("click", handleRestrictedNavigationBlockedClick, true);
}

function handleRestrictedNavigationBlockedPointerEvent(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function handleRestrictedNavigationBlockedClick(event: Event) {
  handleRestrictedNavigationBlockedPointerEvent(event);
  window.alert(restrictedIndicatorTemplatesAccessDeniedMessage);
}

function handleRestrictedNavigationButtonKeyDown(event: KeyboardEvent) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  window.alert(restrictedIndicatorTemplatesAccessDeniedMessage);
}

function handleRestrictedNavigationButtonFocus(event: FocusEvent) {
  const restrictedTab = event.currentTarget;

  if (!(restrictedTab instanceof HTMLButtonElement)) {
    return;
  }

  restrictedTab.blur();
}

function syncRestrictedListRowVisibility(templateRow: HTMLElement, shouldShowRow: boolean) {
  templateRow.hidden = !shouldShowRow;
  templateRow.setAttribute("aria-hidden", shouldShowRow ? "false" : "true");
  templateRow.style.display = shouldShowRow ? "" : "none";
}

function syncRestrictedWatchlistsDialogs(publicId: string | null) {
  const dialogRoots = findRestrictedWatchlistsDialogRoots();

  for (const dialogRoot of dialogRoots) {
    syncRestrictedWatchlistsDialog(dialogRoot, publicId);
  }
}

function findRestrictedWatchlistsDialogRoots() {
  const dialogRoots = new Set<HTMLElement>();

  for (const selector of [
    watchlistsDialogSelector,
    myWatchlistsDialogSelector,
    searchWatchlistsDialogSelector,
  ]) {
    const matchedRoots = document.querySelectorAll(selector);

    for (const matchedRoot of matchedRoots) {
      if (matchedRoot instanceof HTMLElement) {
        dialogRoots.add(matchedRoot);
      }
    }
  }

  return [...dialogRoots];
}

function isDesktopWatchlistsDialogRoot(dialogRoot: HTMLElement) {
  return (
    dialogRoot.querySelector(watchlistsSearchInputSelector) instanceof HTMLInputElement &&
    dialogRoot.querySelector(desktopMyWatchlistsTabSelector) instanceof HTMLButtonElement &&
    dialogRoot.querySelector(desktopHotlistsTabSelector) instanceof HTMLButtonElement
  );
}

function syncRestrictedWatchlistsDialog(dialogRoot: HTMLElement, publicId: string | null) {
  const dialogName = dialogRoot.dataset.dialogName ?? "";
  const requiredPublicId = publicId?.trim() ?? "";

  if (isDesktopWatchlistsDialogRoot(dialogRoot)) {
    disableRestrictedNavigationButtons(getRestrictedDesktopHotlistsButtons(dialogRoot));
    syncRestrictedWatchlistsRows(dialogRoot, requiredPublicId);
    return;
  }

  if (dialogName === "Watchlists") {
    disableRestrictedNavigationButtons(getRestrictedMobileHotlistsButtons(dialogRoot));
    return;
  }

  if (dialogName === "My watchlists") {
    syncRestrictedWatchlistsRows(dialogRoot, requiredPublicId);
    return;
  }

  if (dialogName === "Search") {
    syncRestrictedWatchlistsRows(dialogRoot, requiredPublicId);
  }
}

function getRestrictedDesktopHotlistsButtons(dialogRoot: HTMLElement) {
  return [...dialogRoot.querySelectorAll(desktopHotlistsTabSelector)].filter(
    (button): button is HTMLButtonElement => button instanceof HTMLButtonElement,
  );
}

function getRestrictedMobileHotlistsButtons(dialogRoot: HTMLElement) {
  const hotlistsButton = findButtonByNormalizedText(dialogRoot, "Hotlists");

  return hotlistsButton ? [hotlistsButton] : [];
}

function syncRestrictedWatchlistsRows(dialogRoot: HTMLElement, requiredPublicId: string) {
  const layoutItems = getOrderedWatchlistsLayoutItems(dialogRoot);
  let currentSectionTitle = "";

  for (const layoutItem of layoutItems) {
    if (layoutItem.matches(watchlistsSectionContainerSelector)) {
      currentSectionTitle = getWatchlistsSectionTitle(layoutItem);
      continue;
    }

    const watchlistTitle = layoutItem.dataset.title?.trim() ?? "";
    const shouldShowRow = shouldShowRestrictedWatchlistsRow({
      currentSectionTitle,
      dialogName: dialogRoot.dataset.dialogName ?? "",
      requiredPublicId,
      watchlistTitle,
    });

    syncRestrictedListRowVisibility(layoutItem, shouldShowRow);
  }

  syncRestrictedWatchlistsSectionVisibility(dialogRoot);
  syncRestrictedWatchlistsLayout(dialogRoot);
}

function syncRestrictedWatchlistsSectionVisibility(dialogRoot: HTMLElement) {
  const layoutItems = getOrderedWatchlistsLayoutItems(dialogRoot);
  let currentSectionContainer: HTMLElement | null = null;
  let hasVisibleRowsInSection = false;

  const flushCurrentSection = () => {
    if (!currentSectionContainer) {
      return;
    }

    syncRestrictedListRowVisibility(currentSectionContainer, hasVisibleRowsInSection);
  };

  for (const layoutItem of layoutItems) {
    if (layoutItem.matches(watchlistsSectionContainerSelector)) {
      flushCurrentSection();
      currentSectionContainer = layoutItem;
      hasVisibleRowsInSection = false;
      continue;
    }

    if (!layoutItem.matches(watchlistsRowSelector)) {
      continue;
    }

    if (!layoutItem.hidden && layoutItem.style.display !== "none") {
      hasVisibleRowsInSection = true;
    }
  }

  flushCurrentSection();
}

function shouldShowRestrictedWatchlistsRow(options: {
  currentSectionTitle: string;
  dialogName: string;
  requiredPublicId: string;
  watchlistTitle: string;
}) {
  if (options.dialogName === "Search" && options.currentSectionTitle === "Hotlists") {
    return true;
  }

  return (
    options.requiredPublicId.length > 0 &&
    options.watchlistTitle.includes(options.requiredPublicId)
  );
}

function getOrderedWatchlistsLayoutItems(dialogRoot: HTMLElement) {
  const layoutParent = getWatchlistsLayoutParent(dialogRoot);

  if (!layoutParent) {
    return [];
  }

  return [...layoutParent.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      (child.matches(watchlistsSectionContainerSelector) ||
        child.matches(watchlistsRowSelector)),
  );
}

function getWatchlistsLayoutParent(dialogRoot: HTMLElement) {
  const firstLayoutItem = dialogRoot.querySelector(
    `${watchlistsSectionContainerSelector}, ${watchlistsRowSelector}`,
  );

  return firstLayoutItem instanceof HTMLElement ? firstLayoutItem.parentElement : null;
}

function getWatchlistsSectionTitle(sectionContainer: HTMLElement) {
  const sectionTitle = sectionContainer.querySelector(watchlistsSectionTitleSelector);

  return normalizeText(sectionTitle?.textContent);
}

function syncRestrictedWatchlistsLayout(dialogRoot: HTMLElement) {
  const layoutItems = getOrderedWatchlistsLayoutItems(dialogRoot);

  if (
    layoutItems.length === 0 ||
    !layoutItems.some((item) => item.style.position === "absolute" || item.style.top)
  ) {
    return;
  }

  let nextTop = 0;

  for (const layoutItem of layoutItems) {
    preserveWatchlistsLayoutMetrics(layoutItem);

    if (layoutItem.hidden || layoutItem.style.display === "none") {
      continue;
    }

    layoutItem.style.top = `${nextTop}px`;
    nextTop += getWatchlistsLayoutHeight(layoutItem);
  }

  const layoutParent = getWatchlistsLayoutParent(dialogRoot);

  if (layoutParent instanceof HTMLElement) {
    layoutParent.style.height = `${nextTop}px`;
  }
}

function preserveWatchlistsLayoutMetrics(layoutItem: HTMLElement) {
  if (layoutItem.dataset.assetManagerOriginalTop === undefined) {
    layoutItem.dataset.assetManagerOriginalTop = layoutItem.style.top || "";
  }

  if (layoutItem.dataset.assetManagerOriginalHeight === undefined) {
    layoutItem.dataset.assetManagerOriginalHeight = layoutItem.style.height || "";
  }
}

function getWatchlistsLayoutHeight(layoutItem: HTMLElement) {
  const originalHeight =
    layoutItem.dataset.assetManagerOriginalHeight ?? layoutItem.style.height;
  const numericHeight = Number.parseFloat(originalHeight);

  if (Number.isFinite(numericHeight)) {
    return numericHeight;
  }

  return layoutItem.getBoundingClientRect().height;
}

function syncRestrictedTradingViewDialog(dialogRoot: HTMLElement, publicId: string | null) {
  const dialogInput = dialogRoot.querySelector(dialogInputSelector);

  if (dialogInput instanceof HTMLInputElement) {
    autofillRestrictedDialogInput(dialogInput, publicId);
    bindRestrictedDialogInput(dialogRoot, dialogInput, publicId);
  }

  disableRestrictedDialogSelectButton(dialogRoot);
  suppressRestrictedDialogSuggestions(dialogRoot);
  syncRestrictedDialogSaveButtons(dialogRoot, publicId);
}

function autofillRestrictedDialogInput(
  dialogInput: HTMLInputElement,
  publicId: string | null,
) {
  if (!publicId || dialogInput.dataset.assetManagerPublicIdAutofilled === "true") {
    return;
  }

  setInputValue(dialogInput, `${publicId} `);
  dialogInput.dataset.assetManagerPublicIdAutofilled = "true";
}

function bindRestrictedDialogInput(
  dialogRoot: HTMLElement,
  dialogInput: HTMLInputElement,
  publicId: string | null,
) {
  if (dialogInput.dataset.assetManagerPublicIdBound === "true") {
    return;
  }

  const syncDialogState = () => {
    suppressRestrictedDialogSuggestions(dialogRoot);
    syncRestrictedDialogSaveButtons(dialogRoot, publicId);
  };

  dialogInput.dataset.assetManagerPublicIdBound = "true";
  dialogInput.addEventListener("input", syncDialogState);
  dialogInput.addEventListener("change", syncDialogState);
}

function disableRestrictedDialogSelectButton(dialogRoot: HTMLElement) {
  const dialogSelectButton = dialogRoot.querySelector(dialogSelectButtonSelector);

  if (!(dialogSelectButton instanceof HTMLButtonElement)) {
    return;
  }

  disableButton(dialogSelectButton);
  dialogSelectButton.removeAttribute("title");
  dialogSelectButton.removeAttribute("data-tooltip");
  dialogSelectButton.classList.remove("apply-common-tooltip");
}

function suppressRestrictedDialogSuggestions(dialogRoot: HTMLElement) {
  const suggestions = dialogRoot.querySelectorAll(dialogSuggestionsSelector);

  for (const suggestion of suggestions) {
    if (suggestion instanceof HTMLElement) {
      suggestion.hidden = true;
      suggestion.setAttribute("aria-hidden", "true");
      suggestion.style.display = "none";
      suggestion.style.pointerEvents = "none";
    }
  }
}

function syncRestrictedDialogSaveButtons(dialogRoot: HTMLElement, publicId: string | null) {
  const dialogInput = dialogRoot.querySelector(dialogInputSelector);
  const saveButtons = dialogRoot.querySelectorAll(dialogSaveButtonSelector);
  const requiredPublicId = publicId?.trim() ?? "";
  const hasRequiredPublicId =
    dialogInput instanceof HTMLInputElement &&
    requiredPublicId.length > 0 &&
    dialogInput.value.includes(requiredPublicId);

  for (const saveButton of saveButtons) {
    if (!(saveButton instanceof HTMLButtonElement)) {
      continue;
    }

    saveButton.disabled = !hasRequiredPublicId;
    saveButton.setAttribute("aria-disabled", hasRequiredPublicId ? "false" : "true");
  }
}

function removeMainAvatarBadge() {
  const avatarBadge = document.querySelector(mainAvatarBadgeSelector);

  if (avatarBadge instanceof HTMLElement) {
    avatarBadge.remove();
  }
}

function findMobilePublishWrapper() {
  const mobilePublish = document.querySelector(mobilePublishSelector);

  if (mobilePublish instanceof HTMLElement) {
    return mobilePublish.closest(mobilePublishWrapperSelector) ?? mobilePublish;
  }

  const mobilePublishWrapper = document.querySelector(mobilePublishWrapperSelector);

  return mobilePublishWrapper instanceof HTMLElement ? mobilePublishWrapper : null;
}

function removeRecentRowgroupSections(recentItemSelector: string) {
  const rowgroups = document.querySelectorAll('[role="rowgroup"]');

  for (const rowgroup of rowgroups) {
    if (!(rowgroup instanceof HTMLElement)) {
      continue;
    }

    if (!rowgroup.querySelector(recentItemSelector)) {
      continue;
    }

    const titleContainer = rowgroup.previousElementSibling;

    if (
      !(titleContainer instanceof HTMLElement) ||
      !isRecentlyUsedTitleContainer(titleContainer)
    ) {
      continue;
    }

    const separator = titleContainer.previousElementSibling;

    if (separator instanceof HTMLElement && separator.matches(menuDividerSelector)) {
      separator.remove();
    }

    titleContainer.remove();
    rowgroup.remove();
  }
}

function isRecentlyUsedTitleContainer(titleContainer: HTMLElement) {
  const titleListItem = titleContainer.querySelector(recentTitleListItemSelector);

  if (!(titleListItem instanceof HTMLElement)) {
    return false;
  }

  return normalizeText(titleListItem.textContent) === "Recently used";
}

function syncOpenPopupMenu(options: {
  overrideState: TradingViewOverrideState | null;
  logoutStatus: TradingViewLogoutStatus;
  onLogoutClick: (event: Event) => void;
}) {
  const openMenu = findOpenTradingViewMenu();

  if (!openMenu) {
    return;
  }

  patchLogoutMenuItem(
    openMenu.root.querySelector(logoutMenuItemSelector) as HTMLElement | null,
    options.logoutStatus,
    options.onLogoutClick,
  );

  showReadyMenu(openMenu.root);

  if (options.overrideState?.menuMode !== "restricted") {
    return;
  }

  removeRestrictedPopupMenuItems(openMenu.root);
  patchRestrictedHomeMenuItem(
    openMenu.root.querySelector(homeMenuItemSelector) as HTMLAnchorElement | null,
  );
}

function removeRestrictedPopupMenuItems(popupMenu: HTMLElement) {
  removeMenuItem(findProfileMenuItem(popupMenu));

  for (const ariaLabel of restrictedMenuLabels) {
    removeMenuItem(findMenuItemByAriaLabel(popupMenu, ariaLabel));
  }

  for (const textPrefix of restrictedMenuPrefixes) {
    removeMenuItem(findMenuItemByTextPrefix(popupMenu, textPrefix));
  }
}

function patchRestrictedHomeMenuItem(homeMenuItem: HTMLAnchorElement | null) {
  if (!(homeMenuItem instanceof HTMLAnchorElement)) {
    return;
  }

  homeMenuItem.href = googleHomeUrl;
  homeMenuItem.target = "_blank";
  homeMenuItem.rel = "noopener noreferrer";
}

function patchLogoutMenuItem(
  logoutMenuItem: HTMLElement | null,
  logoutStatus: TradingViewLogoutStatus,
  onLogoutClick: (event: Event) => void,
) {
  if (!(logoutMenuItem instanceof HTMLElement)) {
    return;
  }

  const logoutLabel = getLogoutLabel(logoutStatus);

  logoutMenuItem.setAttribute("aria-disabled", logoutStatus === "loading" ? "true" : "false");
  logoutMenuItem.setAttribute("aria-label", logoutLabel);
  updateMenuItemText(logoutMenuItem, logoutLabel);

  if (logoutMenuItem.dataset.assetManagerLogoutPatched === "true") {
    return;
  }

  logoutMenuItem.dataset.assetManagerLogoutPatched = "true";
  logoutMenuItem.addEventListener("click", onLogoutClick);
}

function removeMenuItem(menuItem: HTMLElement | null) {
  if (!(menuItem instanceof HTMLElement)) {
    return;
  }

  const menuItemContainer = getMenuItemContainer(menuItem);

  if (menuItemContainer instanceof HTMLElement) {
    menuItemContainer.remove();
  }
}

function removeElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.remove();
}

function setInputValue(dialogInput: HTMLInputElement, nextValue: string) {
  const inputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  if (inputValueSetter) {
    inputValueSetter.call(dialogInput, nextValue);
  } else {
    dialogInput.value = nextValue;
  }

  dialogInput.dispatchEvent(new Event("input", { bubbles: true }));
  dialogInput.dispatchEvent(new Event("change", { bubbles: true }));
}

function disableButton(button: Element | null) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.disabled = true;
  button.setAttribute("aria-disabled", "true");
}

function disableFavoriteButton(button: Element | null) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  disableButton(button);
  button.removeAttribute("title");
  button.removeAttribute("data-tooltip");
  button.classList.remove("apply-common-tooltip");
}

function disableFavoriteIcon(icon: Element | null) {
  if (!(icon instanceof HTMLSpanElement)) {
    return;
  }

  icon.setAttribute("aria-disabled", "true");
  icon.removeAttribute("title");
  icon.removeAttribute("data-tooltip");
  icon.classList.remove("apply-common-tooltip");

  if (icon.dataset.assetManagerFavoriteDisabled === "true") {
    return;
  }

  icon.dataset.assetManagerFavoriteDisabled = "true";
  icon.addEventListener("click", preventFavoriteInteraction);
  icon.addEventListener("mousedown", preventFavoriteInteraction);
  icon.addEventListener("pointerdown", preventFavoriteInteraction);
}

function preventFavoriteInteraction(event: Event) {
  event.preventDefault();
  event.stopPropagation();
}

function findOpenTradingViewMenu(): {
  root: HTMLElement;
  variant: TradingViewMenuVariant;
} | null {
  const desktopMenu = document.querySelector(desktopPopupMenuSelector);

  if (desktopMenu instanceof HTMLElement) {
    return { root: desktopMenu, variant: "desktop" };
  }

  const mobileMenu = document.querySelector(mobilePopupMenuSelector);

  if (mobileMenu instanceof HTMLElement) {
    return { root: mobileMenu, variant: "mobile" };
  }

  return null;
}

function findProfileMenuItem(popupMenu: HTMLElement) {
  const desktopProfileMenuItem = popupMenu.querySelector(desktopProfileMenuItemSelector);

  if (desktopProfileMenuItem instanceof HTMLElement) {
    return desktopProfileMenuItem;
  }

  return (
    getPopupMenuItems(popupMenu).find((menuItem) =>
      Boolean(menuItem.querySelector(profileMenuImageSelector)),
    ) ?? null
  );
}

function findMenuItemByAriaLabel(popupMenu: HTMLElement, ariaLabel: string) {
  return (
    getPopupMenuItems(popupMenu).find(
      (menuItem) => menuItem.getAttribute("aria-label") === ariaLabel,
    ) ?? null
  );
}

function findMenuItemByTextPrefix(popupMenu: HTMLElement, textPrefix: string) {
  return (
    getPopupMenuItems(popupMenu).find((menuItem) =>
      normalizeText(menuItem.textContent).startsWith(textPrefix),
    ) ?? null
  );
}

function getPopupMenuItems(popupMenu: HTMLElement) {
  return [...popupMenu.querySelectorAll('[data-role="menuitem"]')].filter(
    (menuItem): menuItem is HTMLElement => menuItem instanceof HTMLElement,
  );
}

function hideMenuUntilStateIsReady(popupMenu: HTMLElement) {
  popupMenu.style.visibility = "hidden";
  popupMenu.style.pointerEvents = "none";
}

function showReadyMenu(popupMenu: HTMLElement) {
  popupMenu.style.visibility = "";
  popupMenu.style.pointerEvents = "";
}

function getMenuItemContainer(menuItem: HTMLElement) {
  const parentElement = menuItem.parentElement;

  if (parentElement && parentElement.childElementCount === 1) {
    return parentElement;
  }

  return menuItem;
}

function updateMenuItemText(menuItem: HTMLElement, label: string) {
  const gridCell = menuItem.querySelector('[role="gridcell"]');

  if (gridCell instanceof HTMLElement) {
    gridCell.textContent = label;
    return;
  }

  menuItem.textContent = label;
}

function getLogoutLabel(logoutStatus: TradingViewLogoutStatus) {
  if (logoutStatus === "loading") {
    return "Loading...";
  }

  if (logoutStatus === "success") {
    return "Success";
  }

  if (logoutStatus === "error") {
    return "Logout failed";
  }

  return "Logout";
}

function isRelevantTradingViewMutation(mutation: MutationRecord) {
  if (mutation.type === "attributes") {
    return (
      mutation.target instanceof Element && mutation.target.matches(mainAvatarImageSelector)
    );
  }

  return [...mutation.addedNodes, ...mutation.removedNodes].some(isRelevantTradingViewNode);
}

function isRelevantTradingViewNode(node: Node) {
  if (!(node instanceof Element)) {
    return false;
  }

  return (
    node.matches(relevantTradingViewSelectors) ||
    Boolean(node.querySelector(relevantTradingViewSelectors))
  );
}

async function requestTradingViewLogout(): Promise<string> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    throw new Error("Runtime extension tidak tersedia.");
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: runtimeMessageType.logoutRequested },
      (
        response:
          | { errorMessage?: string; ok?: boolean; value?: { redirectTo: string } }
          | undefined,
      ) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? "Logout gagal diproses."));
          return;
        }

        if (!response?.ok || !response.value?.redirectTo) {
          reject(new Error(response?.errorMessage ?? "Logout gagal diproses."));
          return;
        }

        resolve(response.value.redirectTo);
      },
    );
  });
}

function createTradingViewOverrideState(
  bootstrapCacheRecord: BootstrapCacheRecord | null,
): TradingViewOverrideState {
  const user = bootstrapCacheRecord?.snapshot.user;
  const tradingViewAsset = bootstrapCacheRecord?.snapshot.assets?.find(
    (assetSummary) => assetSummary.platform === "tradingview",
  );

  return {
    avatarAlt: user ? getAvatarLabel(user.username, user.email, user.publicId) : null,
    avatarSrc: user
      ? getAvatarSource(user.avatarUrl, user.publicId, user.username, user.email)
      : null,
    menuMode: tradingViewAsset?.hasPrivateAccess === true ? "default" : "restricted",
    publicId: user?.publicId?.trim() || null,
  };
}

function getAvatarSource(
  avatarUrl: string | null,
  publicId: string,
  username: string,
  email: string,
) {
  if (avatarUrl) {
    return avatarUrl;
  }

  const avatarLabel = getAvatarLabel(username, email, publicId);
  const avatarSeed = publicId || username || email;

  return createFallbackAvatarUrl(avatarSeed, avatarLabel);
}

function getAvatarLabel(...labelCandidates: Array<string | null | undefined>) {
  const labelSource =
    labelCandidates.find((candidate) => Boolean(candidate?.trim()))?.trim() ?? "A";

  return labelSource.charAt(0).toUpperCase();
}

function createFallbackAvatarUrl(seed: string, label: string) {
  const backgroundColor = getAvatarColor(seed);
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="${backgroundColor}"/><text x="24" y="24" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700">${escapeHtml(label)}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;
}

function getAvatarColor(seed: string) {
  const palette = [
    "#2563eb",
    "#7c3aed",
    "#db2777",
    "#ea580c",
    "#059669",
    "#0891b2",
    "#ca8a04",
    "#4f46e5",
  ];
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return palette[hash % palette.length];
}

function normalizeText(textContent: string | null | undefined) {
  return textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
