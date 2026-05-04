import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installTvDomPatches } from "@/content/dom/installTvDomPatches";
import * as assetPlatforms from "@/lib/asset-access/platforms";
import { runtimeMessageType } from "@/lib/runtime/messages";
import {
  bootstrapCacheStorageKey,
  createBootstrapCacheRecord,
  type BootstrapCacheRecord,
} from "@/lib/storage/bootstrapCache";

const mainMenuButtonSelector = 'button[data-qa-id="main-menu-button"]';
const mainAvatarImageSelector = `${mainMenuButtonSelector} img`;
const logoutMenuItemSelector = '[data-qa-id="main-menu-sign-out-item"][data-role="menuitem"]';
const desktopPublishSelector = "#header-toolbar-publish-desktop";
const mobilePublishWrapperSelector = ".mobilePublish-OhqNVIYA";
const desktopTradeSelector = "#header-toolbar-trade-desktop";
const quickSearchSelector = "#header-toolbar-quick-search";
const createAlertSelector = "#header-toolbar-alerts";
const favoriteIndicatorsSelector =
  '#header-toolbar-indicators button[data-name="show-favorite-indicators"]';
const presetMenuFavoriteButtonSelector = 'button[data-qa-id="preset-menu-favorite-button"]';
const presetMenuFavoriteIconSelector =
  'span.favorite-_FRQhM5Y[aria-label="Add to favorites"], span.favorite-_FRQhM5Y[aria-label="Remove from favorites"]';
const sidebarWatchlistSelector = 'button[aria-label="Watchlist, details, and news"]';
const sidebarAlertsSelector = 'button[data-name="alerts"]';
const sidebarChatsSelector = 'button[data-name="union_chats"]';
const sidebarProductsSelector = 'button[data-qa-id="products-button"]';
const sidebarHelpSelector = 'button[data-name="help-button"]';
const helpCenterMenuItemSelector = '[aria-label="Help Center"][data-role="menuitem"]';
const supportRequestsMenuItemSelector =
  '[aria-label="Support requests"][data-role="menuitem"]';
const whatsNewMenuItemSelector = '[aria-label="What\'s new"][data-role="menuitem"]';
const keyboardShortcutsMenuItemSelector =
  '[aria-label="Keyboard shortcuts"][data-role="menuitem"]';
const getDesktopAppMenuItemSelector = '[aria-label="Get desktop app"][data-role="menuitem"]';
const layoutRecentMenuRootSelector = "#layout-recent-root";
const indicatorRecentMenuRootSelector = "#indicator-recent-root";
const watchlistsRecentMenuRootSelector = "#watchlists-recent-root";
const recentLayoutMenuItemSelector = '[data-qa-id="save-load-menu-item-recent"]';
const recentIndicatorMenuItemSelector = '[data-group-name="recent"]';
const recentTitleListItemSelector = '[data-qa-id="ui-lib-title-list-item"]';
const watchlistsRecentTitleSelector = ".columnsTitle-mQBvegEO.title-GlrQ9d9L";
const menuDividerSelector = '.menu-divider-YZ5qU_gy[role="separator"]';
const watchlistsSeparatorSelector = '.separator-UZn6u4sU[role="separator"]';
const createDialogSelector = '.wrap-B02UUUN3[data-name="create-dialog"]';
const renameDialogSelector = '[data-name="rename-dialog"]';
const saveIndicatorTemplateDialogSelector =
  '[data-dialog-name="Save indicator template"][data-name="save-rename-dialog"]';
const alertsCreateEditDialogSelector = '[data-qa-id="alerts-create-edit-dialog"]';
const alertPresetsButtonSelector = 'button[data-qa-id="header-alert-presets-menu-button"]';
const alertNotificationsButtonSelector = 'button[data-qa-id="alert-notifications-button"]';
const alertSubmitButtonSelector = 'button[data-qa-id="submit"]';
const indicatorTemplatesDialogSelector =
  '.wrapper-b8SxMnzX[data-dialog-name="Indicator templates"]';
const drawingTemplatesMenuSelector = 'div[data-qa-id="menu-inner"].menuBox-XktvVkFF';
const popupTemplateMenuSelector = '#popup-template-menu';
const seriesThemePopupTemplateMenuSelector = '#series-theme-popup-template-menu';
const horizontalLineContextMenuRootSelector = "#horizontal-line-context-menu";
const chartRightClickContextMenuRootSelector = "#chart-right-click-context-menu";
const candleRightClickContextMenuRootSelector = "#candle-right-click-context-menu";
const indicatorRightClickContextMenuRootSelector = "#indicator-right-click-context-menu";
const drawingObjectContextMenuRootSelector = "#drawing-object-context-menu";
const genericTableMenuRootSelector = "#generic-table-menu";
const mobileHorizontalLineContextMenuRootSelector = "#mobile-horizontal-line-context-menu";
const genericMobileDrawerRootSelector = "#generic-mobile-drawer";
const layoutsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="load-layout-dialog"][data-dialog-name="Layouts"]';
const mobileIndicatorTemplatesCategoryDialogSelector =
  '.wrapper-b8SxMnzX[data-name="indicator-templates-dialog"][data-dialog-name="Indicator templates"]';
const mobileIndicatorTemplatesMyTemplatesDialogSelector =
  '.wrapper-b8SxMnzX[data-name="indicator-templates-dialog"][data-dialog-name="My templates"]';
const desktopWatchlistsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="Watchlists"]';
const mobileWatchlistsCategoryDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="Watchlists"]';
const mobileMyWatchlistsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="My watchlists"]';
const mobileSearchWatchlistsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="Search"]';
const desktopWatchlistActiveTitleSelector = '.headerMenuContent-mQBvegEO .titleRow-mQBvegEO';
const desktopWatchlistSymbolRowSelector = '.watchlist-__KRxuOy .tree-MgF6KBas .wrap-IEe5qpW4';
const desktopWatchlistRemoveButtonSelector = '.watchlist-__KRxuOy .removeButton-RsFlttSS';
const desktopActiveWatchlistMenuSelector = 'div.menuBox-XktvVkFF[data-qa-id="menu-inner"]';
const mobileActiveWatchlistMenuSelector = '[data-name="active-watchlist-menu"]';
const watchlistAddSymbolButtonSelector = 'button[data-name="add-symbol-button"]';
const watchlistAdvancedViewButtonSelector = 'button[data-name="advanced-view-button"]';
const createLimitOrderButtonSelector = '[data-name="createLimitOrder"][data-role="button"]';
const mobileWatchlistSymbolDrawerSelector = '.drawer-GQU5HVYO.positionBottom-GQU5HVYO';
const dialogInputSelector = '[data-qa-id="ui-lib-Input-input"]';
const dialogSelectButtonSelector =
  ".inner-slot-W53jtLjw.interactive-W53jtLjw button.button-PYEOTd6i";
const dialogSuggestionsSelector = ".suggestions-uszkUMOz";
const dialogSaveButtonSelector =
  'button[data-qa-id="save-btn"], button[data-qa-id="submit-button"]';
const indicatorTemplatesTabSelector = 'button[role="tab"]';
const indicatorTemplatesRowSelector = 'div[data-role="list-item"][data-title]';
const watchlistsRowSelector = 'div[data-role="list-item"][data-title]';
const watchlistsSectionTitleSelector = ".title-RvmSCAQq";
const restrictedIndicatorTemplatesTabOverlaySelector =
  '[data-asset-manager-restricted-tab-overlay="true"]';
const restrictedIndicatorTemplatesAccessDeniedMessage =
  "Access denied, silahkan beli akun full private untuk akses fitur ini!!";
const restrictedActiveWatchlistMenuMessage = "watchlist bukan milik anda";

const originalChrome = globalThis.chrome;
const originalDocumentClassName = document.documentElement.className;

type Deferred<TValue> = {
  promise: Promise<TValue>;
  reject: (reason: unknown) => void;
  resolve: (value: TValue) => void;
};

describe("TV DOM patches", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockDetectedPlatform("tradingview");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.chrome = originalChrome;
    document.body.innerHTML = "";
    document.documentElement.className = originalDocumentClassName;
  });

  it("applies restricted menu rules when private access is unavailable", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-a.png",
        hasPrivateAccess: false,
      }),
    );
    renderTradingViewPage();

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getMainAvatarImage().src).toBe("https://cdn.example.com/avatar-a.png");
    expectSelectorToBeHidden(".menuNotifications-U2jIw4km");
    expectSelectorToBeHidden(desktopPublishSelector);
    expectSelectorToBeHidden(mobilePublishWrapperSelector);
    expectSelectorToBeHidden(desktopTradeSelector);
    expectSelectorToBeHidden(quickSearchSelector);
    expectSelectorToBeHidden(createAlertSelector);
    expectSelectorToBeHidden(favoriteIndicatorsSelector);
    expect(getMenuItemBySelector(sidebarWatchlistSelector)).toBeInstanceOf(HTMLElement);
    expectSelectorToBeHidden(sidebarAlertsSelector);
    expectSelectorToBeHidden(sidebarChatsSelector);
    expect(getButtonBySelector(sidebarProductsSelector).disabled).toBe(true);
    expect(getButtonBySelector(sidebarProductsSelector).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(getButtonBySelector(sidebarHelpSelector).disabled).toBe(true);
    expect(getButtonBySelector(sidebarHelpSelector).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(getMenuItemBySelector('[data-qa-id="main-menu-user-menu-item"]')).toBeNull();
    expect(getMenuItemBySelector(helpCenterMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(supportRequestsMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(whatsNewMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(keyboardShortcutsMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(getDesktopAppMenuItemSelector)).toBeNull();
    expect(getMenuItemByTextPrefix("Language")).toBeNull();
    expect(getHomeMenuItem().href).toBe("https://google.com/");
    expect(getHomeMenuItem().target).toBe("_blank");
    expect(getHomeMenuItem().rel).toBe("noopener noreferrer");
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Logout");
    expect(getLogoutMenuItem().textContent).toContain("Logout");

    disposeTvDomPatches();
  });

  it("does nothing outside TradingView", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-outside.png",
        hasPrivateAccess: false,
      }),
    );
    mockDetectedPlatform("fxreplay");
    renderTradingViewPage();

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getMainAvatarImage().src).toBe("https://old.example.com/avatar.png");
    expect(document.querySelector(".menuNotifications-U2jIw4km")).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(desktopPublishSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(mobilePublishWrapperSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(sidebarAlertsSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(desktopTradeSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(quickSearchSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(createAlertSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(favoriteIndicatorsSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(sidebarWatchlistSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(sidebarChatsSelector)).toBeInstanceOf(HTMLElement);
    expect(getButtonBySelector(sidebarProductsSelector).disabled).toBe(false);
    expect(getButtonBySelector(sidebarHelpSelector).disabled).toBe(false);
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Sign out");
    expect(getLogoutMenuItem().textContent).toContain("Sign out");

    disposeTvDomPatches();
  });

  it("delays the first desktop avatar click until TradingView state is ready", async () => {
    const pendingBootstrapCache = createDeferred<BootstrapCacheRecord | null>();

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-delayed.png",
        hasPrivateAccess: false,
      }),
      { pendingBootstrapCache },
    );
    document.body.innerHTML = createTradingViewHeaderMarkup();

    const disposeTvDomPatches = installTvDomPatches();
    const avatarClick = new MouseEvent("click", { bubbles: true, cancelable: true });

    expect(getMainMenuButton().dispatchEvent(avatarClick)).toBe(false);

    pendingBootstrapCache.resolve(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-delayed.png",
        hasPrivateAccess: false,
      }),
    );
    await flushAsyncWork();

    expect(getMainAvatarImage().src).toBe("https://cdn.example.com/avatar-delayed.png");

    disposeTvDomPatches();
  });

  it("does not block the first mobile avatar click while state is still loading", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile.png",
        hasPrivateAccess: false,
      }),
      {
        pendingBootstrapCache: createDeferred<BootstrapCacheRecord | null>(),
      },
    );
    document.body.innerHTML = createTradingViewHeaderMarkup();

    const disposeTvDomPatches = installTvDomPatches();
    const avatarClick = new MouseEvent("click", { bubbles: true, cancelable: true });

    expect(getMainMenuButton().dispatchEvent(avatarClick)).toBe(true);

    disposeTvDomPatches();
  });

  it("keeps non-logout menu rows visible when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-private.png",
        hasPrivateAccess: true,
      }),
    );
    renderTradingViewPage();

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getMenuItemBySelector(desktopPublishSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(mobilePublishWrapperSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(sidebarAlertsSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(desktopTradeSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(quickSearchSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(createAlertSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(favoriteIndicatorsSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(sidebarWatchlistSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(sidebarChatsSelector)).toBeInstanceOf(HTMLElement);
    expect(getButtonBySelector(sidebarProductsSelector).disabled).toBe(false);
    expect(getButtonBySelector(sidebarHelpSelector).disabled).toBe(false);
    expect(getMenuItemBySelector('[data-qa-id="main-menu-user-menu-item"]')).toBeInstanceOf(
      HTMLElement,
    );
    expect(getMenuItemBySelector(helpCenterMenuItemSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(supportRequestsMenuItemSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(whatsNewMenuItemSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(keyboardShortcutsMenuItemSelector)).toBeInstanceOf(
      HTMLElement,
    );
    expect(getMenuItemBySelector(getDesktopAppMenuItemSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemByTextPrefix("Language")).toBeInstanceOf(HTMLElement);
    expect(getHomeMenuItem().getAttribute("href")).toBe("/");
    expect(getHomeMenuItem().href).not.toBe("https://google.com/");
    expect(getHomeMenuItem().target).toBe("_blank");
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Logout");
    expect(getLogoutMenuItem().textContent).toContain("Logout");

    disposeTvDomPatches();
  });

  it("applies restricted menu rules to the mobile TradingView menu", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile-restricted.png",
        hasPrivateAccess: false,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createMobileTradingViewMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expectSelectorToBeHidden(desktopPublishSelector);
    expectSelectorToBeHidden(mobilePublishWrapperSelector);
    expectSelectorToBeHidden(quickSearchSelector);
    expectSelectorToBeHidden(createAlertSelector);
    expectSelectorToBeHidden(favoriteIndicatorsSelector);
    expect(getMenuItemBySelector(helpCenterMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(supportRequestsMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(whatsNewMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(keyboardShortcutsMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(getDesktopAppMenuItemSelector)).toBeNull();
    expect(getMenuItemByTextPrefix("Language")).toBeNull();
    expect(getHomeMenuItem().href).toBe("https://google.com/");
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Logout");

    disposeTvDomPatches();
  });

  it("keeps non-logout rows visible in the mobile TradingView menu when private access is available", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile-private.png",
        hasPrivateAccess: true,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createMobileTradingViewMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getMenuItemBySelector(desktopPublishSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(mobilePublishWrapperSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(quickSearchSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(createAlertSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(favoriteIndicatorsSelector)).toBeInstanceOf(HTMLElement);
    expect(getButtonBySelector(sidebarProductsSelector).disabled).toBe(false);
    expect(getButtonBySelector(sidebarHelpSelector).disabled).toBe(false);
    expect(getMenuItemBySelector(helpCenterMenuItemSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(supportRequestsMenuItemSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(whatsNewMenuItemSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(keyboardShortcutsMenuItemSelector)).toBeInstanceOf(
      HTMLElement,
    );
    expect(getMenuItemBySelector(getDesktopAppMenuItemSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemByTextPrefix("Language")).toBeInstanceOf(HTMLElement);
    expect(getHomeMenuItem().getAttribute("href")).toBe("/");
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Logout");

    disposeTvDomPatches();
  });

  it("removes only the restricted Recently used sections on desktop", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-recent-desktop.png",
        hasPrivateAccess: false,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createTradingViewRecentMenusMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(queryWithin(layoutRecentMenuRootSelector, recentLayoutMenuItemSelector)).toBeNull();
    expect(queryWithin(layoutRecentMenuRootSelector, recentTitleListItemSelector)).toBeNull();
    expect(countWithin(layoutRecentMenuRootSelector, menuDividerSelector)).toBe(1);
    expect(getRootText(layoutRecentMenuRootSelector)).toContain("Open layout");
    expect(getRootText(layoutRecentMenuRootSelector)).not.toContain("Recently used");

    expect(
      queryWithin(indicatorRecentMenuRootSelector, recentIndicatorMenuItemSelector),
    ).toBeNull();
    expect(
      queryWithin(indicatorRecentMenuRootSelector, recentTitleListItemSelector),
    ).toBeNull();
    expect(countWithin(indicatorRecentMenuRootSelector, menuDividerSelector)).toBe(1);
    expect(getRootText(indicatorRecentMenuRootSelector)).toContain("Open template");
    expect(getRootText(indicatorRecentMenuRootSelector)).not.toContain("Recently used");

    expect(
      queryWithin(watchlistsRecentMenuRootSelector, watchlistsRecentTitleSelector),
    ).toBeNull();
    expect(countWithin(watchlistsRecentMenuRootSelector, watchlistsSeparatorSelector)).toBe(2);
    expect(getRootText(watchlistsRecentMenuRootSelector)).toContain("Create new list");
    expect(getRootText(watchlistsRecentMenuRootSelector)).toContain("Open list");
    expect(getRootText(watchlistsRecentMenuRootSelector)).not.toContain("Recently used");

    disposeTvDomPatches();
  });

  it("keeps the Recently used sections when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-recent-private.png",
        hasPrivateAccess: true,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createTradingViewRecentMenusMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(
      queryWithin(layoutRecentMenuRootSelector, recentLayoutMenuItemSelector),
    ).toBeInstanceOf(HTMLElement);
    expect(
      queryWithin(layoutRecentMenuRootSelector, recentTitleListItemSelector),
    ).toBeInstanceOf(HTMLElement);
    expect(countWithin(layoutRecentMenuRootSelector, menuDividerSelector)).toBe(2);

    expect(
      queryWithin(indicatorRecentMenuRootSelector, recentIndicatorMenuItemSelector),
    ).toBeInstanceOf(HTMLElement);
    expect(
      queryWithin(indicatorRecentMenuRootSelector, recentTitleListItemSelector),
    ).toBeInstanceOf(HTMLElement);
    expect(countWithin(indicatorRecentMenuRootSelector, menuDividerSelector)).toBe(2);

    expect(
      queryWithin(watchlistsRecentMenuRootSelector, watchlistsRecentTitleSelector),
    ).toBeInstanceOf(HTMLElement);
    expect(countWithin(watchlistsRecentMenuRootSelector, watchlistsSeparatorSelector)).toBe(3);
    expect(getRootText(watchlistsRecentMenuRootSelector)).toContain("Recently used");

    disposeTvDomPatches();
  });

  it("removes the restricted Recently used sections on mobile", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-recent-mobile.png",
        hasPrivateAccess: false,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createTradingViewRecentMenusMarkup({ useMobileWatchlistsTitle: true })}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(queryWithin(layoutRecentMenuRootSelector, recentLayoutMenuItemSelector)).toBeNull();
    expect(
      queryWithin(indicatorRecentMenuRootSelector, recentIndicatorMenuItemSelector),
    ).toBeNull();
    expect(
      queryWithin(watchlistsRecentMenuRootSelector, watchlistsRecentTitleSelector),
    ).toBeNull();
    expect(countWithin(watchlistsRecentMenuRootSelector, watchlistsSeparatorSelector)).toBe(2);
    expect(getRootText(watchlistsRecentMenuRootSelector)).toContain("Open list");

    disposeTvDomPatches();
  });

  it("disables favorite buttons and removes their tooltip in restricted mode", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-favorite-restricted.png",
        hasPrivateAccess: false,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createFavoriteButtonsMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getFavoriteButtons()).toHaveLength(2);
    expect(getFavoriteIcons()).toHaveLength(2);

    for (const favoriteButton of getFavoriteButtons()) {
      expect(favoriteButton.disabled).toBe(true);
      expect(favoriteButton.getAttribute("aria-disabled")).toBe("true");
      expect(favoriteButton.getAttribute("title")).toBeNull();
      expect(favoriteButton.getAttribute("data-tooltip")).toBeNull();
      expect(favoriteButton.classList.contains("apply-common-tooltip")).toBe(false);
    }

    for (const favoriteIcon of getFavoriteIcons()) {
      expect(favoriteIcon.getAttribute("aria-disabled")).toBe("true");
      expect(favoriteIcon.getAttribute("title")).toBeNull();
      expect(favoriteIcon.getAttribute("data-tooltip")).toBeNull();
      expect(favoriteIcon.classList.contains("apply-common-tooltip")).toBe(false);
      expect(
        favoriteIcon.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        ),
      ).toBe(false);
    }

    disposeTvDomPatches();
  });

  it("keeps favorite buttons interactive when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-favorite-private.png",
        hasPrivateAccess: true,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createFavoriteButtonsMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getFavoriteButtons()).toHaveLength(2);
    expect(getFavoriteIcons()).toHaveLength(2);

    for (const favoriteButton of getFavoriteButtons()) {
      expect(favoriteButton.disabled).toBe(false);
      expect(favoriteButton.getAttribute("aria-disabled")).toBeNull();
      expect(favoriteButton.getAttribute("title")).toMatch(/favorites/i);
      expect(favoriteButton.getAttribute("data-tooltip")).toMatch(/favorites/i);
      expect(favoriteButton.classList.contains("apply-common-tooltip")).toBe(true);
    }

    for (const favoriteIcon of getFavoriteIcons()) {
      expect(favoriteIcon.getAttribute("aria-disabled")).toBeNull();
      expect(favoriteIcon.getAttribute("data-tooltip")).toMatch(/favorites/i);
      expect(favoriteIcon.classList.contains("apply-common-tooltip")).toBe(true);
      expect(
        favoriteIcon.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        ),
      ).toBe(true);
    }

    disposeTvDomPatches();
  });

  it("autofills restricted dialog inputs with publicId and enables save only when value contains it", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-dialog-restricted.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createRestrictedDialogsMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getDialogInput(createDialogSelector).value).toBe("50975 ");
    expect(getDialogInput(renameDialogSelector).value).toBe("50975 ");
    expect(getDialogInput(saveIndicatorTemplateDialogSelector).value).toBe("50975 ");
    expect(getDialogSaveButton(createDialogSelector).disabled).toBe(false);
    expect(getDialogSaveButton(renameDialogSelector).disabled).toBe(false);
    expect(getDialogSaveButton(saveIndicatorTemplateDialogSelector).disabled).toBe(false);
    expect(
      getDialogSaveButton(saveIndicatorTemplateDialogSelector).getAttribute("aria-disabled"),
    ).toBe("false");
    expect(getDialogSelectButton(saveIndicatorTemplateDialogSelector).disabled).toBe(true);
    expect(getDialogSelectButton(renameDialogSelector).disabled).toBe(true);
    expect(getDialogSuggestions(saveIndicatorTemplateDialogSelector).hidden).toBe(true);
    expect(
      getDialogSuggestions(saveIndicatorTemplateDialogSelector).getAttribute("aria-hidden"),
    ).toBe("true");

    updateDialogInputValue(createDialogSelector, "50975 custom text");
    expect(getDialogSaveButton(createDialogSelector).disabled).toBe(false);

    updateDialogInputValue(renameDialogSelector, "custom text save 50975");
    expect(getDialogSaveButton(renameDialogSelector).disabled).toBe(false);

    updateDialogInputValue(saveIndicatorTemplateDialogSelector, "custom text aja");
    expect(getDialogSaveButton(saveIndicatorTemplateDialogSelector).disabled).toBe(true);
    expect(
      getDialogSaveButton(saveIndicatorTemplateDialogSelector).getAttribute("aria-disabled"),
    ).toBe("true");

    disposeTvDomPatches();
  });

  it("keeps restricted dialog save buttons disabled when publicId is unavailable", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-dialog-no-public-id.png",
        hasPrivateAccess: false,
        publicId: "",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createRestrictedDialogsMarkup()}${createIndicatorTemplatesDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getDialogInput(createDialogSelector).value).toBe("");
    expect(getDialogInput(renameDialogSelector).value).toBe("");
    expect(getDialogInput(saveIndicatorTemplateDialogSelector).value).toBe("");
    expect(getDialogSaveButton(createDialogSelector).disabled).toBe(true);
    expect(getDialogSaveButton(renameDialogSelector).disabled).toBe(true);
    expect(getDialogSaveButton(saveIndicatorTemplateDialogSelector).disabled).toBe(true);
    expect(getVisibleIndicatorTemplateTitles()).toEqual([]);

    disposeTvDomPatches();
  });

  it("disables alert action buttons for non-private users", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-alert-dialog-restricted.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createAlertDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    for (const button of [
      getButtonBySelector(`${alertsCreateEditDialogSelector} ${alertPresetsButtonSelector}`),
      getButtonBySelector(`${alertsCreateEditDialogSelector} ${alertNotificationsButtonSelector}`),
      getButtonBySelector(`${alertsCreateEditDialogSelector} ${alertSubmitButtonSelector}`),
    ]) {
      expect(button.disabled).toBe(true);
      expect(button.getAttribute("aria-disabled")).toBe("true");
      expect(button.style.opacity).toBe("0.5");
      expect(button.style.cursor).toBe("not-allowed");
    }

    disposeTvDomPatches();
  });

  it("keeps alert action buttons enabled when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-alert-dialog-private.png",
        hasPrivateAccess: true,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createAlertDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    for (const button of [
      getButtonBySelector(`${alertsCreateEditDialogSelector} ${alertPresetsButtonSelector}`),
      getButtonBySelector(`${alertsCreateEditDialogSelector} ${alertNotificationsButtonSelector}`),
      getButtonBySelector(`${alertsCreateEditDialogSelector} ${alertSubmitButtonSelector}`),
    ]) {
      expect(button.disabled).toBe(false);
      expect(button.getAttribute("aria-disabled")).toBeNull();
      expect(button.style.opacity).toBe("");
      expect(button.style.cursor).toBe("");
    }

    disposeTvDomPatches();
  });

  it("disables create limit order floating toolbar action for non-private users", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-create-limit-order-restricted.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createDrawingToolbarMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    const createLimitOrderButton = getCreateLimitOrderButton();
    let bubbledClickHandled = false;

    createLimitOrderButton.addEventListener("click", () => {
      bubbledClickHandled = true;
    });

    expect(createLimitOrderButton.getAttribute("aria-disabled")).toBe("true");
    expect(createLimitOrderButton.style.opacity).toBe("0.5");
    expect(createLimitOrderButton.style.cursor).toBe("not-allowed");
    expect(createLimitOrderButton.tabIndex).toBe(-1);
    expect(
      createLimitOrderButton.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    ).toBe(false);
    expect(bubbledClickHandled).toBe(false);

    disposeTvDomPatches();
  });

  it("keeps create limit order floating toolbar action enabled when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-create-limit-order-private.png",
        hasPrivateAccess: true,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createDrawingToolbarMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    const createLimitOrderButton = getCreateLimitOrderButton();

    expect(createLimitOrderButton.getAttribute("aria-disabled")).toBeNull();
    expect(createLimitOrderButton.style.opacity).toBe("");
    expect(createLimitOrderButton.style.cursor).toBe("");

    disposeTvDomPatches();
  });

  it("filters indicator template rows by publicId and disables non-My templates tabs", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-template-filter.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createIndicatorTemplatesDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleIndicatorTemplateTitles()).toEqual([
      "50975 alpha",
      "50975 beta",
      "50975 gamma",
    ]);

    const technicalsTab = getIndicatorTemplatesTab("technicals");
    const financialsTab = getIndicatorTemplatesTab("financials");

    expect(technicalsTab.getAttribute("aria-disabled")).toBe("true");
    expect(financialsTab.getAttribute("aria-disabled")).toBe("true");
    expect(technicalsTab.style.opacity).toBe("0.5");
    expect(financialsTab.style.opacity).toBe("0.5");
    expect(technicalsTab.tabIndex).toBe(-1);
    expect(getRestrictedIndicatorTemplatesTabOverlay("technicals")).toBeInstanceOf(
      HTMLSpanElement,
    );

    let bubbledClickHandled = false;
    technicalsTab.addEventListener("click", () => {
      bubbledClickHandled = true;
      technicalsTab.setAttribute("aria-selected", "true");
    });

    getRestrictedIndicatorTemplatesTabOverlay("technicals").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(alertSpy).toHaveBeenCalledWith(restrictedIndicatorTemplatesAccessDeniedMessage);
    expect(bubbledClickHandled).toBe(false);
    expect(technicalsTab.getAttribute("aria-selected")).toBe("false");
    expect(getVisibleIndicatorTemplateTitles()).toEqual([
      "50975 alpha",
      "50975 beta",
      "50975 gamma",
    ]);

    renderIndicatorTemplatesTab("my templates", [
      { title: "template orang lain", description: "EMA 20/50" },
      { title: "50975 delta", description: "Vol · Ticks" },
      { title: "random template", description: "RSI" },
      { title: "50975 epsilon", description: "MA, RSI" },
    ]);
    await flushAsyncWork();

    expect(getVisibleIndicatorTemplateTitles()).toEqual(["50975 delta", "50975 epsilon"]);
    expect(getIndicatorTemplatesTab("technicals").style.opacity).toBe("0.5");

    disposeTvDomPatches();
  });

  it("disables Technicals and Financials on the mobile Indicator templates screen", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile-indicator-templates.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createMobileIndicatorTemplatesCategoryDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    const technicalsButton = getIndicatorTemplatesButtonByText(
      mobileIndicatorTemplatesCategoryDialogSelector,
      "Technicals",
    );
    const financialsButton = getIndicatorTemplatesButtonByText(
      mobileIndicatorTemplatesCategoryDialogSelector,
      "Financials",
    );

    expect(technicalsButton.getAttribute("aria-disabled")).toBe("true");
    expect(financialsButton.getAttribute("aria-disabled")).toBe("true");
    expect(technicalsButton.style.opacity).toBe("0.5");
    expect(financialsButton.style.opacity).toBe("0.5");
    expect(technicalsButton.tabIndex).toBe(-1);
    expect(financialsButton.tabIndex).toBe(-1);

    let bubbledClickHandled = false;
    technicalsButton.addEventListener("click", () => {
      bubbledClickHandled = true;
    });

    getRestrictedIndicatorTemplatesButtonOverlay(technicalsButton).dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(alertSpy).toHaveBeenCalledWith(restrictedIndicatorTemplatesAccessDeniedMessage);
    expect(bubbledClickHandled).toBe(false);

    disposeTvDomPatches();
  });

  it("filters rows on the mobile My templates screen by publicId", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile-my-templates.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createMobileIndicatorTemplatesMyTemplatesDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(
      getVisibleIndicatorTemplateTitlesWithin(
        mobileIndicatorTemplatesMyTemplatesDialogSelector,
      ),
    ).toEqual(["50975 alpha", "50975 beta", "50975 gamma"]);

    disposeTvDomPatches();
  });

  it("keeps the mobile Indicator templates flow unchanged when private access is available", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile-my-templates-private.png",
        hasPrivateAccess: true,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createMobileIndicatorTemplatesCategoryDialogMarkup()}${createMobileIndicatorTemplatesMyTemplatesDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(
      getIndicatorTemplatesButtonByText(
        mobileIndicatorTemplatesCategoryDialogSelector,
        "Technicals",
      ).getAttribute("aria-disabled"),
    ).toBeNull();
    expect(
      getIndicatorTemplatesButtonByText(
        mobileIndicatorTemplatesCategoryDialogSelector,
        "Technicals",
      ).style.opacity,
    ).toBe("");
    expect(
      getVisibleIndicatorTemplateTitlesWithin(
        mobileIndicatorTemplatesMyTemplatesDialogSelector,
      ),
    ).toEqual([
      "50975 alpha",
      "template orang lain",
      "50975 beta",
      "template publik",
      "50975 gamma",
    ]);

    disposeTvDomPatches();
  });

  it("filters desktop My watchlists rows, hides empty sections, and disables Hotlists", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlists-desktop.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createDesktopWatchlistsDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleWatchlistTitlesWithin(desktopWatchlistsDialogSelector)).toEqual([
      "50975 cccd",
      "50975 fgfg",
      "50975 siap",
    ]);
    expect(getVisibleWatchlistSectionTitlesWithin(desktopWatchlistsDialogSelector)).toEqual([
      "Created lists",
    ]);

    const hotlistsTab = getWatchlistsTab("hot-lists");

    expect(hotlistsTab.getAttribute("aria-disabled")).toBe("true");
    expect(hotlistsTab.style.opacity).toBe("0.5");
    expect(hotlistsTab.style.cursor).toBe("not-allowed");
    expect(hotlistsTab.tabIndex).toBe(-1);

    let bubbledClickHandled = false;
    hotlistsTab.addEventListener("click", () => {
      bubbledClickHandled = true;
      hotlistsTab.setAttribute("aria-selected", "true");
    });

    getRestrictedIndicatorTemplatesButtonOverlay(hotlistsTab).dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(alertSpy).toHaveBeenCalledWith(restrictedIndicatorTemplatesAccessDeniedMessage);
    expect(bubbledClickHandled).toBe(false);
    expect(hotlistsTab.getAttribute("aria-selected")).toBe("false");

    disposeTvDomPatches();
  });

  it("autofills and locks the desktop Layouts searchbox to publicId in restricted mode", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-layouts-desktop.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createLayoutsDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getLayoutsSearchInput().value).toBe("50975");
    expect(getLayoutsSearchInput().readOnly).toBe(true);
    expect(getLayoutsSearchInput().getAttribute("aria-readonly")).toBe("true");
    expect(getLayoutsClearButton().hidden).toBe(true);
    expect(getLayoutsClearButton().getAttribute("aria-hidden")).toBe("true");
    expect(getLayoutsClearButton().style.display).toBe("none");

    disposeTvDomPatches();
  });

  it("autofills and locks the mobile Layouts searchbox to publicId in restricted mode", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-layouts-mobile.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createLayoutsDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getLayoutsSearchInput().value).toBe("50975");
    expect(getLayoutsSearchInput().readOnly).toBe(true);
    expect(getLayoutsSearchInput().getAttribute("aria-readonly")).toBe("true");
    expect(getLayoutsClearButton().hidden).toBe(true);
    expect(getLayoutsClearButton().style.pointerEvents).toBe("none");

    disposeTvDomPatches();
  });

  it("filters drawing template rows by publicId and keeps action rows intact", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-drawing-templates.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createDrawingTemplatesMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleDrawingTemplateTitles()).toEqual([
      "50975 bbbbb",
      "50975 biro",
      "panjangggggggggggggggggggg sekaliiiiiiiiiiiiiiiiiiiiiiii 50975",
    ]);
    expect(getVisibleDrawingTemplateActionLabels()).toEqual([
      "Save Drawing Template As…",
      "Apply Default Drawing Template",
    ]);
    expect(getDrawingTemplateTitle("Abu")).toBeNull();
    expect(getDrawingTemplateTitle("Biru")).toBeNull();
    expect(countDrawingTemplateSpacerRows()).toBe(5);

    disposeTvDomPatches();
  });

  it("filters compact drawing template menus by publicId when save-as row is absent", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-drawing-templates-compact.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createCompactDrawingTemplatesMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleDrawingTemplateTitles()).toEqual(["50975 jjg"]);
    expect(getVisibleDrawingTemplateActionLabels()).toEqual(["Apply Default Drawing Template"]);
    expect(getDrawingTemplateTitle("PDA")).toBeNull();
    expect(countDrawingTemplateSpacerRows()).toBe(2);

    disposeTvDomPatches();
  });

  it("hides all compact drawing template rows when no template contains publicId", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-drawing-templates-compact-no-match.png",
        hasPrivateAccess: false,
        publicId: "88888",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createCompactDrawingTemplatesMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleDrawingTemplateTitles()).toEqual([]);
    expect(getVisibleDrawingTemplateActionLabels()).toEqual(["Apply Default Drawing Template"]);
    expect(getDrawingTemplateTitle("50975 jjg")).toBeNull();
    expect(getDrawingTemplateTitle("PDA")).toBeNull();
    expect(countDrawingTemplateSpacerRows()).toBe(1);

    disposeTvDomPatches();
  });

  it("filters popup template menu rows by publicId without touching action rows", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-popup-template-menu.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createPopupTemplateMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisiblePopupTemplateTitles()).toEqual(["50975 c", "50975 dddd"]);
    expect(getVisiblePopupTemplateActionLabels()).toEqual(["Save as…", "Apply defaults"]);
    expect(getPopupTemplateTitle("A")).toBeNull();
    expect(getPopupTemplateTitle("d")).toBeNull();

    disposeTvDomPatches();
  });

  it("filters series theme popup template rows by publicId without touching action rows", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-series-theme-popup-template-menu.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createSeriesThemePopupTemplateMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisiblePopupTemplateTitlesWithin(seriesThemePopupTemplateMenuSelector)).toEqual([
      "50975",
    ]);
    expect(getVisiblePopupTemplateActionLabelsWithin(seriesThemePopupTemplateMenuSelector)).toEqual([
      "Apply defaults",
      "Save as…",
    ]);
    expect(getPopupTemplateTitleWithin(seriesThemePopupTemplateMenuSelector, "fs")).toBeNull();
    expect(getPopupTemplateTitleWithin(seriesThemePopupTemplateMenuSelector, "gg")).toBeNull();
    expect(getPopupTemplateTitleWithin(seriesThemePopupTemplateMenuSelector, "old1")).toBeNull();

    disposeTvDomPatches();
  });

  it("hides all series theme popup template rows when no template contains publicId", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-series-theme-popup-template-menu-no-match.png",
        hasPrivateAccess: false,
        publicId: "88888",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createSeriesThemePopupTemplateMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisiblePopupTemplateTitlesWithin(seriesThemePopupTemplateMenuSelector)).toEqual([]);
    expect(getVisiblePopupTemplateActionLabelsWithin(seriesThemePopupTemplateMenuSelector)).toEqual([
      "Apply defaults",
      "Save as…",
    ]);
    expect(getPopupTemplateTitleWithin(seriesThemePopupTemplateMenuSelector, "50975")).toBeNull();
    expect(getPopupTemplateTitleWithin(seriesThemePopupTemplateMenuSelector, "fs")).toBeNull();
    expect(getPopupTemplateTitleWithin(seriesThemePopupTemplateMenuSelector, "gg")).toBeNull();
    expect(getPopupTemplateTitleWithin(seriesThemePopupTemplateMenuSelector, "old1")).toBeNull();

    disposeTvDomPatches();
  });

  it("keeps only the horizontal line row in the restricted chart context menu", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-horizontal-line-context-menu.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createHorizontalLineContextMenuMarkup()}${createGenericTableMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleTableMenuLabelsWithin(horizontalLineContextMenuRootSelector)).toEqual([
      "Draw horizontal line at 4,767.41",
    ]);
    expect(countTableMenuRowsWithin(horizontalLineContextMenuRootSelector)).toBe(1);
    expect(getVisibleTableMenuLabelsWithin(genericTableMenuRootSelector)).toEqual([
      "Keep this menu intact",
      "Another generic action",
    ]);
    expect(countTableMenuRowsWithin(genericTableMenuRootSelector)).toBe(3);

    disposeTvDomPatches();
  });

  it("keeps the horizontal line chart context menu unchanged for private access", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-horizontal-line-context-menu-private.png",
        hasPrivateAccess: true,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createHorizontalLineContextMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleTableMenuLabelsWithin(horizontalLineContextMenuRootSelector)).toEqual([
      "Add alert on XAUUSD at 4,767.41",
      "Add alert on 10 in 1 MAs at 4,767.41",
      "Sell 1 XAUUSD @ 4,767.41 limit",
      "Buy 1 XAUUSD @ 4,767.41 stop",
      "Add order on XAUUSD at 4,767.41…",
      "Draw horizontal line at 4,767.41",
    ]);
    expect(countTableMenuRowsWithin(horizontalLineContextMenuRootSelector)).toBe(14);

    disposeTvDomPatches();
  });

  it("removes restricted rows from the general desktop chart context menu", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-chart-context-menu.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createChartRightClickContextMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleTableMenuLabelsWithin(chartRightClickContextMenuRootSelector)).toEqual([
      "Reset chart view",
      "Copy price 6,899.08",
      "Paste",
      "Table view",
      "Settings…",
    ]);

    disposeTvDomPatches();
  });

  it("removes restricted rows from the candle desktop context menu", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-candle-context-menu.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createCandleRightClickContextMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleTableMenuLabelsWithin(candleRightClickContextMenuRootSelector)).toEqual([
      "Symbol info…",
      "Table view",
      "Settings…",
    ]);

    disposeTvDomPatches();
  });

  it("removes restricted rows from the indicator desktop context menu", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-indicator-context-menu.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createIndicatorRightClickContextMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleTableMenuLabelsWithin(indicatorRightClickContextMenuRootSelector)).toEqual([
      "About this script…",
      "Copy",
      "Hide",
      "Settings…",
    ]);

    disposeTvDomPatches();
  });

  it("hides the Template row in the drawing object desktop context menu", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-drawing-object-context-menu.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createDrawingObjectContextMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleTableMenuLabelsWithin(drawingObjectContextMenuRootSelector)).toEqual([
      "Visual order",
      "Visibility on intervals",
      "Object tree",
      "Clone",
      "Copy",
      "No sync",
      "Sync in layout",
      "Sync globally",
      "Lock",
      "Hide",
      "Remove",
      "Settings…",
    ]);

    disposeTvDomPatches();
  });

  it("restricts desktop watchlist symbol drag, remove, and context menu for foreign watchlists only", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlist-symbols.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createDesktopWatchlistActiveTitleMarkup("dua")}${createDesktopWatchlistSymbolsMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    const firstSymbolRow = getDesktopWatchlistSymbolRow(0);
    const firstRemoveButton = getDesktopWatchlistRemoveButton(0);
    const addSymbolButton = getWatchlistAddSymbolButton();
    const advancedViewButton = getWatchlistAdvancedViewButton();
    let clickHandled = false;
    let contextMenuHandled = false;
    let removeClickHandled = false;

    firstSymbolRow.addEventListener("click", () => {
      clickHandled = true;
    });
    firstSymbolRow.addEventListener("contextmenu", () => {
      contextMenuHandled = true;
    });
    firstRemoveButton.addEventListener("click", () => {
      removeClickHandled = true;
    });

    expect(firstSymbolRow.getAttribute("draggable")).toBe("false");
    expect(firstRemoveButton.style.opacity).toBe("0.5");
    expect(firstRemoveButton.style.cursor).toBe("not-allowed");
    expect(firstRemoveButton.getAttribute("aria-disabled")).toBe("true");
    expect(addSymbolButton.disabled).toBe(true);
    expect(addSymbolButton.style.opacity).toBe("0.5");
    expect(addSymbolButton.style.cursor).toBe("not-allowed");
    expect(advancedViewButton.disabled).toBe(true);
    expect(advancedViewButton.style.opacity).toBe("0.5");
    expect(advancedViewButton.style.cursor).toBe("not-allowed");
    expect(firstSymbolRow.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).toBe(
      true,
    );
    expect(clickHandled).toBe(true);
    expect(
      firstSymbolRow.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })),
    ).toBe(false);
    expect(contextMenuHandled).toBe(false);
    expect(firstSymbolRow.dispatchEvent(new Event("dragstart", { bubbles: true, cancelable: true }))).toBe(
      false,
    );
    expect(firstRemoveButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).toBe(
      false,
    );
    expect(removeClickHandled).toBe(false);

    setDesktopWatchlistActiveTitle("50975 dua");
    await flushAsyncWork();

    expect(firstSymbolRow.getAttribute("draggable")).toBe("true");
    expect(firstRemoveButton.style.opacity).toBe("");
    expect(firstRemoveButton.style.cursor).toBe("");
    expect(firstRemoveButton.getAttribute("aria-disabled")).toBe("false");
    expect(addSymbolButton.disabled).toBe(false);
    expect(addSymbolButton.style.opacity).toBe("");
    expect(addSymbolButton.style.cursor).toBe("");
    expect(advancedViewButton.disabled).toBe(true);
    expect(advancedViewButton.style.opacity).toBe("0.5");
    expect(advancedViewButton.style.cursor).toBe("not-allowed");
    expect(
      firstSymbolRow.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })),
    ).toBe(false);
    expect(firstSymbolRow.dispatchEvent(new Event("dragstart", { bubbles: true, cancelable: true }))).toBe(
      true,
    );
    expect(firstRemoveButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).toBe(
      true,
    );

    disposeTvDomPatches();
  });

  it("keeps desktop watchlist symbol actions unchanged when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlist-symbols-private.png",
        hasPrivateAccess: true,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createDesktopWatchlistActiveTitleMarkup("dua")}${createDesktopWatchlistSymbolsMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    let contextMenuHandled = false;

    getDesktopWatchlistSymbolRow(0).addEventListener("contextmenu", () => {
      contextMenuHandled = true;
    });

    expect(getDesktopWatchlistSymbolRow(0).getAttribute("draggable")).toBe("true");
    expect(getDesktopWatchlistRemoveButton(0).style.opacity).toBe("");
    expect(getDesktopWatchlistRemoveButton(0).style.cursor).toBe("");
    expect(getDesktopWatchlistRemoveButton(0).getAttribute("aria-disabled")).toBeNull();
    expect(getWatchlistAddSymbolButton().disabled).toBe(false);
    expect(getWatchlistAdvancedViewButton().disabled).toBe(false);
    expect(
      getDesktopWatchlistSymbolRow(0).dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      ),
    ).toBe(true);
    expect(contextMenuHandled).toBe(true);

    disposeTvDomPatches();
  });

  it("disables foreign desktop active watchlist menu items and always removes add-alert/share-list", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlist-menu-desktop.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createDesktopWatchlistActiveTitleMarkup("dua")}${createDesktopActiveWatchlistMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getActiveWatchlistMenuItem(desktopActiveWatchlistMenuSelector, "Add alert on the list…")).toBeNull();
    expect(getActiveWatchlistMenuItem(desktopActiveWatchlistMenuSelector, "Share list")).toBeNull();
    expect(getActiveWatchlistMenuItem(desktopActiveWatchlistMenuSelector, "Rename")).toBeInstanceOf(HTMLElement);
    expect(getActiveWatchlistMenuItem(desktopActiveWatchlistMenuSelector, "Add section")).toBeInstanceOf(HTMLElement);
    expect(getActiveWatchlistMenuItem(desktopActiveWatchlistMenuSelector, "Clear list")).toBeInstanceOf(HTMLElement);

    const renameItem = getRequiredActiveWatchlistMenuItem(
      desktopActiveWatchlistMenuSelector,
      "Rename",
    );

    expect(renameItem.style.opacity).toBe("0.5");
    expect(renameItem.style.cursor).toBe("not-allowed");
    expect(renameItem.getAttribute("aria-disabled")).toBe("true");

    expect(
      renameItem.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
    ).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(restrictedActiveWatchlistMenuMessage);

    disposeTvDomPatches();
  });

  it("keeps owned desktop active watchlist menu items enabled but still removes add-alert/share-list", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlist-menu-desktop-owned.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createDesktopWatchlistActiveTitleMarkup("50975 dua")}${createDesktopActiveWatchlistMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getActiveWatchlistMenuItem(desktopActiveWatchlistMenuSelector, "Add alert on the list…")).toBeNull();
    expect(getActiveWatchlistMenuItem(desktopActiveWatchlistMenuSelector, "Share list")).toBeNull();

    const renameItem = getRequiredActiveWatchlistMenuItem(
      desktopActiveWatchlistMenuSelector,
      "Rename",
    );

    expect(renameItem.style.opacity).toBe("");
    expect(renameItem.style.cursor).toBe("");
    expect(renameItem.getAttribute("aria-disabled")).toBeNull();

    disposeTvDomPatches();
  });

  it("disables foreign mobile active watchlist menu items and always removes add-alert/share-list", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlist-menu-mobile.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createMobileWatchlistActiveTitleMarkup("dua")}${createMobileActiveWatchlistMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getActiveWatchlistMenuItem(mobileActiveWatchlistMenuSelector, "Add alert on the list…")).toBeNull();
    expect(getActiveWatchlistMenuItem(mobileActiveWatchlistMenuSelector, "Share list")).toBeNull();

    const clearListItem = getRequiredActiveWatchlistMenuItem(
      mobileActiveWatchlistMenuSelector,
      "Clear list",
    );

    expect(clearListItem.style.opacity).toBe("0.5");
    expect(clearListItem.style.cursor).toBe("not-allowed");
    expect(
      clearListItem.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
    ).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(restrictedActiveWatchlistMenuMessage);

    disposeTvDomPatches();
  });

  it("keeps owned mobile active watchlist menu items enabled but still removes add-alert/share-list", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlist-menu-mobile-owned.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createMobileWatchlistActiveTitleMarkup("50975 dua")}${createMobileActiveWatchlistMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getActiveWatchlistMenuItem(mobileActiveWatchlistMenuSelector, "Add alert on the list…")).toBeNull();
    expect(getActiveWatchlistMenuItem(mobileActiveWatchlistMenuSelector, "Share list")).toBeNull();

    const clearListItem = getRequiredActiveWatchlistMenuItem(
      mobileActiveWatchlistMenuSelector,
      "Clear list",
    );

    expect(clearListItem.style.opacity).toBe("");
    expect(clearListItem.style.cursor).toBe("");
    expect(clearListItem.getAttribute("aria-disabled")).toBeNull();

    disposeTvDomPatches();
  });

  it("removes restricted rows from the mobile symbol drawer and disables foreign watchlist actions", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile-watchlist-drawer.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createMobileWatchlistDialogMarkup("dua")}${createMobileWatchlistSymbolDrawerMarkup("SPY")}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getWatchlistAddSymbolButton().disabled).toBe(true);
    expect(getWatchlistAddSymbolButton().style.opacity).toBe("0.5");
    expect(getWatchlistAdvancedViewButton().disabled).toBe(true);
    expect(getWatchlistAdvancedViewButton().style.opacity).toBe("0.5");
    expect(getWatchlistAdvancedViewButton().style.cursor).toBe("not-allowed");
    expect(getMobileWatchlistSymbolDrawerItem((text) => text.startsWith("Flag/Unflag "))).toBeNull();
    expect(getMobileWatchlistSymbolDrawerItem((text) => text === "Unflag all symbols")).toBeNull();
    expect(getMobileWatchlistSymbolDrawerItem((text) => /to watchlist$/.test(text))).toBeNull();
    expect(getMobileWatchlistSymbolDrawerItem((text) => /to compare$/.test(text))).toBeNull();
    expect(getMobileWatchlistSymbolDrawerItem((text) => / Supercharts$/.test(text))).toBeNull();
    expect(getMobileWatchlistSymbolDrawerItem((text) => text.startsWith("Add note for "))).toBeNull();

    const removeItem = getRequiredMobileWatchlistSymbolDrawerItem((text) =>
      text.startsWith("Remove "),
    );
    const addSectionItem = getRequiredMobileWatchlistSymbolDrawerItem(
      (text) => text === "Add section",
    );

    expect(removeItem.style.opacity).toBe("0.5");
    expect(removeItem.style.cursor).toBe("not-allowed");
    expect(removeItem.getAttribute("aria-disabled")).toBe("true");
    expect(addSectionItem.style.opacity).toBe("0.5");
    expect(addSectionItem.style.cursor).toBe("not-allowed");
    expect(addSectionItem.getAttribute("aria-disabled")).toBe("true");
    expect(
      removeItem.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
    ).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(restrictedActiveWatchlistMenuMessage);

    disposeTvDomPatches();
  });

  it("keeps remaining mobile symbol drawer actions enabled for owned watchlists", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile-watchlist-drawer-owned.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createMobileWatchlistDialogMarkup("50975 data")}${createMobileWatchlistSymbolDrawerMarkup("SPY")}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getWatchlistAddSymbolButton().disabled).toBe(false);
    expect(getWatchlistAdvancedViewButton().disabled).toBe(true);
    expect(getWatchlistAdvancedViewButton().style.opacity).toBe("0.5");
    expect(getWatchlistAdvancedViewButton().style.cursor).toBe("not-allowed");
    expect(getMobileWatchlistSymbolDrawerItem((text) => text.startsWith("Flag/Unflag "))).toBeNull();
    expect(getMobileWatchlistSymbolDrawerItem((text) => text === "Unflag all symbols")).toBeNull();

    const removeItem = getRequiredMobileWatchlistSymbolDrawerItem((text) =>
      text.startsWith("Remove "),
    );
    const addSectionItem = getRequiredMobileWatchlistSymbolDrawerItem(
      (text) => text === "Add section",
    );

    expect(removeItem.style.opacity).toBe("");
    expect(removeItem.style.cursor).toBe("");
    expect(removeItem.getAttribute("aria-disabled")).toBeNull();
    expect(addSectionItem.style.opacity).toBe("");
    expect(addSectionItem.style.cursor).toBe("");
    expect(addSectionItem.getAttribute("aria-disabled")).toBeNull();

    disposeTvDomPatches();
  });

  it("keeps only the horizontal line row in the restricted mobile chart context drawer", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile-horizontal-line-context-menu.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML =
      `${createTradingViewHeaderMarkup()}${createMobileHorizontalLineContextMenuMarkup()}${createGenericMobileDrawerMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleMobileDrawerLabelsWithin(mobileHorizontalLineContextMenuRootSelector)).toEqual([
      "Draw horizontal line at 4,969.35",
    ]);
    expect(countMobileDrawerChildrenWithin(mobileHorizontalLineContextMenuRootSelector)).toBe(1);
    expect(getVisibleMobileDrawerLabelsWithin(genericMobileDrawerRootSelector)).toEqual([
      "Keep this mobile drawer intact",
      "Another generic mobile action",
    ]);
    expect(countMobileDrawerChildrenWithin(genericMobileDrawerRootSelector)).toBe(3);

    disposeTvDomPatches();
  });

  it("keeps the mobile horizontal line context drawer unchanged for private access", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-mobile-horizontal-line-context-menu-private.png",
        hasPrivateAccess: true,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createMobileHorizontalLineContextMenuMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleMobileDrawerLabelsWithin(mobileHorizontalLineContextMenuRootSelector)).toEqual([
      "Add alert on XAUUSD at 4,969.35",
      "Add alert on 10 in 1 MAs at 4,969.35",
      "Sell 1 XAUUSD @ 4,969.35 limit",
      "Buy 1 XAUUSD @ 4,969.35 stop",
      "Add order on XAUUSD at 4,969.35…",
      "Draw horizontal line at 4,969.35",
    ]);
    expect(countMobileDrawerChildrenWithin(mobileHorizontalLineContextMenuRootSelector)).toBe(8);

    disposeTvDomPatches();
  });

  it("disables Hotlists on the mobile Watchlists category screen", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlists-mobile-category.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createMobileWatchlistsCategoryDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    const hotlistsButton = getButtonByTextWithin(
      mobileWatchlistsCategoryDialogSelector,
      "Hotlists",
    );

    expect(hotlistsButton.getAttribute("aria-disabled")).toBe("true");
    expect(hotlistsButton.style.opacity).toBe("0.5");
    expect(hotlistsButton.style.cursor).toBe("not-allowed");
    expect(hotlistsButton.tabIndex).toBe(-1);

    let bubbledClickHandled = false;
    hotlistsButton.addEventListener("click", () => {
      bubbledClickHandled = true;
    });

    getRestrictedIndicatorTemplatesButtonOverlay(hotlistsButton).dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(alertSpy).toHaveBeenCalledWith(restrictedIndicatorTemplatesAccessDeniedMessage);
    expect(bubbledClickHandled).toBe(false);

    disposeTvDomPatches();
  });

  it("filters mobile My watchlists rows and hides empty sections", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlists-mobile-list.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createMobileMyWatchlistsDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleWatchlistTitlesWithin(mobileMyWatchlistsDialogSelector)).toEqual([
      "50975 cccd",
      "50975 fgfg",
      "50975 siap",
    ]);
    expect(getVisibleWatchlistSectionTitlesWithin(mobileMyWatchlistsDialogSelector)).toEqual([
      "Created lists",
    ]);
    expect(
      getWatchlistsLayoutItemTopWithin(mobileMyWatchlistsDialogSelector, "Created lists"),
    ).toBe("0px");
    expect(
      getWatchlistsLayoutItemTopWithin(mobileMyWatchlistsDialogSelector, "50975 cccd"),
    ).toBe("41px");
    expect(
      getWatchlistsLayoutItemTopWithin(mobileMyWatchlistsDialogSelector, "50975 fgfg"),
    ).toBe("73px");
    expect(
      getWatchlistsLayoutItemTopWithin(mobileMyWatchlistsDialogSelector, "50975 siap"),
    ).toBe("105px");

    disposeTvDomPatches();
  });

  it("filters only My watchlists rows on the mobile Watchlists Search screen and keeps Hotlists visible", async () => {
    document.documentElement.classList.add("feature-mobiletouch");

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-watchlists-mobile-search.png",
        hasPrivateAccess: false,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createMobileSearchWatchlistsDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getVisibleWatchlistTitlesWithin(mobileSearchWatchlistsDialogSelector)).toEqual([
      "50975 siap",
      "50975 cccd",
      "Volume Gainers",
      "Gap Gainers",
    ]);
    expect(
      getVisibleWatchlistSectionTitlesWithin(mobileSearchWatchlistsDialogSelector),
    ).toEqual(["My watchlists", "Hotlists"]);

    disposeTvDomPatches();
  });

  it("does not modify dialog inputs when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-dialog-private.png",
        hasPrivateAccess: true,
        publicId: "50975",
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createRestrictedDialogsMarkup()}${createIndicatorTemplatesDialogMarkup()}`;

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getDialogInput(createDialogSelector).value).toBe("");
    expect(getDialogInput(renameDialogSelector).value).toBe("");
    expect(getDialogInput(saveIndicatorTemplateDialogSelector).value).toBe("");
    expect(getDialogSaveButton(createDialogSelector).disabled).toBe(false);
    expect(getDialogSaveButton(renameDialogSelector).disabled).toBe(false);
    expect(getDialogSaveButton(saveIndicatorTemplateDialogSelector).disabled).toBe(false);
    expect(getDialogSelectButton(saveIndicatorTemplateDialogSelector).disabled).toBe(false);
    expect(getDialogSelectButton(renameDialogSelector).disabled).toBe(false);
    expect(getDialogSuggestions(saveIndicatorTemplateDialogSelector).hidden).toBe(false);
    expect(getVisibleIndicatorTemplateTitles()).toEqual([
      "50975 alpha",
      "template orang lain",
      "50975 beta",
      "template publik",
      "50975 gamma",
    ]);
    expect(getIndicatorTemplatesTab("technicals").getAttribute("aria-disabled")).toBeNull();
    expect(getIndicatorTemplatesTab("technicals").style.opacity).toBe("");

    disposeTvDomPatches();
  });

  it("uses a generated fallback avatar when the user has no avatar URL", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: null,
        username: "ongkaytrade",
      }),
    );
    document.body.innerHTML = createTradingViewHeaderMarkup();

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    expect(getMainAvatarImage().src.startsWith("data:image/svg+xml;charset=UTF-8,")).toBe(
      true,
    );
    expect(getMainAvatarImage().alt).toBe("O");

    disposeTvDomPatches();
  });

  it("keeps the initial restricted rules for the current page session", async () => {
    const { emitStorageChange } = installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-b.png",
        hasPrivateAccess: false,
      }),
    );
    renderTradingViewPage();

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    emitStorageChange(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-next.png",
        hasPrivateAccess: true,
      }),
    );
    await flushAsyncWork();

    expect(getMainAvatarImage().src).toBe("https://cdn.example.com/avatar-b.png");
    expect(getMenuItemBySelector('[data-qa-id="main-menu-user-menu-item"]')).toBeNull();
    expect(getMenuItemBySelector(helpCenterMenuItemSelector)).toBeNull();
    expect(getMenuItemByTextPrefix("Language")).toBeNull();
    expect(getHomeMenuItem().href).toBe("https://google.com/");

    disposeTvDomPatches();
  });

  it("sends logout through the extension runtime and updates the menu label", async () => {
    vi.useFakeTimers();

    const { runtimeSendMessage } = installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-c.png",
        hasPrivateAccess: false,
      }),
      {
        logoutResponse: { redirectTo: "http://localhost:3000/login" },
      },
    );
    renderTradingViewPage();

    const disposeTvDomPatches = installTvDomPatches();

    await flushAsyncWork();

    getLogoutMenuItem().dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    await flushAsyncWork();

    expect(runtimeSendMessage).toHaveBeenCalledWith(
      { type: runtimeMessageType.logoutRequested },
      expect.any(Function),
    );
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Success");
    expect(getLogoutMenuItem().textContent).toContain("Success");

    disposeTvDomPatches();
  });
});

function renderTradingViewPage() {
  document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createTradingViewMenuMarkup()}`;
}

function getMainMenuButton() {
  const mainMenuButton = document.querySelector(mainMenuButtonSelector);

  expect(mainMenuButton).toBeInstanceOf(HTMLButtonElement);

  return mainMenuButton as HTMLButtonElement;
}

function getMainAvatarImage() {
  const avatarImage = document.querySelector(mainAvatarImageSelector);

  expect(avatarImage).toBeInstanceOf(HTMLImageElement);

  return avatarImage as HTMLImageElement;
}

function getHomeMenuItem() {
  const homeMenuItem = document.querySelector('a[aria-label="Home"][data-role="menuitem"]');

  expect(homeMenuItem).toBeInstanceOf(HTMLAnchorElement);

  return homeMenuItem as HTMLAnchorElement;
}

function getLogoutMenuItem() {
  const logoutMenuItem = document.querySelector(logoutMenuItemSelector);

  expect(logoutMenuItem).toBeInstanceOf(HTMLElement);

  return logoutMenuItem as HTMLElement;
}

function getButtonBySelector(selector: string) {
  const button = document.querySelector(selector);

  expect(button).toBeInstanceOf(HTMLButtonElement);

  return button as HTMLButtonElement;
}

function getFavoriteButtons() {
  return [...document.querySelectorAll(presetMenuFavoriteButtonSelector)].filter(
    (button): button is HTMLButtonElement => button instanceof HTMLButtonElement,
  );
}

function getFavoriteIcons() {
  return [...document.querySelectorAll(presetMenuFavoriteIconSelector)].filter(
    (icon): icon is HTMLSpanElement => icon instanceof HTMLSpanElement,
  );
}

function getDialogInput(rootSelector: string) {
  const dialogInput = document.querySelector(`${rootSelector} ${dialogInputSelector}`);

  expect(dialogInput).toBeInstanceOf(HTMLInputElement);

  return dialogInput as HTMLInputElement;
}

function getDialogSaveButton(rootSelector: string) {
  const dialogSaveButton = document.querySelector(
    `${rootSelector} ${dialogSaveButtonSelector}`,
  );

  expect(dialogSaveButton).toBeInstanceOf(HTMLButtonElement);

  return dialogSaveButton as HTMLButtonElement;
}

function getDialogSelectButton(rootSelector: string) {
  const dialogSelectButton = document.querySelector(
    `${rootSelector} ${dialogSelectButtonSelector}`,
  );

  expect(dialogSelectButton).toBeInstanceOf(HTMLButtonElement);

  return dialogSelectButton as HTMLButtonElement;
}

function getDialogSuggestions(rootSelector: string) {
  const dialogSuggestions = document.querySelector(
    `${rootSelector} ${dialogSuggestionsSelector}`,
  );

  expect(dialogSuggestions).toBeInstanceOf(HTMLElement);

  return dialogSuggestions as HTMLElement;
}

function getIndicatorTemplatesDialogRoot() {
  const dialogRoot = document.querySelector(indicatorTemplatesDialogSelector);

  expect(dialogRoot).toBeInstanceOf(HTMLElement);

  return dialogRoot as HTMLElement;
}

function getLayoutsDialogRoot() {
  const dialogRoot = document.querySelector(layoutsDialogSelector);

  expect(dialogRoot).toBeInstanceOf(HTMLElement);

  return dialogRoot as HTMLElement;
}

function getLayoutsSearchInput() {
  const searchInput = getLayoutsDialogRoot().querySelector('input[role="searchbox"]');

  expect(searchInput).toBeInstanceOf(HTMLInputElement);

  return searchInput as HTMLInputElement;
}

function getLayoutsClearButton() {
  const clearButton = getLayoutsDialogRoot().querySelector('button[aria-label="Clear"]');

  expect(clearButton).toBeInstanceOf(HTMLButtonElement);

  return clearButton as HTMLButtonElement;
}

function getDesktopWatchlistSymbolRow(index: number) {
  const symbolRow = document.querySelectorAll(desktopWatchlistSymbolRowSelector)[index];

  expect(symbolRow).toBeInstanceOf(HTMLDivElement);

  return symbolRow as HTMLDivElement;
}

function getDesktopWatchlistRemoveButton(index: number) {
  const removeButton = document.querySelectorAll(desktopWatchlistRemoveButtonSelector)[index];

  expect(removeButton).toBeInstanceOf(HTMLSpanElement);

  return removeButton as HTMLSpanElement;
}

function setDesktopWatchlistActiveTitle(title: string) {
  const activeTitle = document.querySelector(desktopWatchlistActiveTitleSelector);

  expect(activeTitle).toBeInstanceOf(HTMLElement);

  (activeTitle as HTMLElement).outerHTML = `<span class="titleRow-mQBvegEO">${title}</span>`;
}

function getActiveWatchlistMenuItem(rootSelector: string, label: string) {
  return (
    [...document.querySelectorAll(`${rootSelector} [data-role="menuitem"]`)].find((menuItem) => {
      if (!(menuItem instanceof HTMLElement)) {
        return false;
      }

      return normalizeText(menuItem.textContent) === label;
    }) ?? null
  );
}

function getRequiredActiveWatchlistMenuItem(rootSelector: string, label: string) {
  const menuItem = getActiveWatchlistMenuItem(rootSelector, label);

  expect(menuItem).toBeInstanceOf(HTMLElement);

  return menuItem as HTMLElement;
}

function getWatchlistAddSymbolButton() {
  const addSymbolButton = document.querySelector(watchlistAddSymbolButtonSelector);

  expect(addSymbolButton).toBeInstanceOf(HTMLButtonElement);

  return addSymbolButton as HTMLButtonElement;
}

function getWatchlistAdvancedViewButton() {
  const advancedViewButton = document.querySelector(watchlistAdvancedViewButtonSelector);

  expect(advancedViewButton).toBeInstanceOf(HTMLButtonElement);

  return advancedViewButton as HTMLButtonElement;
}

function getCreateLimitOrderButton() {
  const createLimitOrderButton = document.querySelector(createLimitOrderButtonSelector);

  expect(createLimitOrderButton).toBeInstanceOf(HTMLElement);

  return createLimitOrderButton as HTMLElement;
}

function getMobileWatchlistSymbolDrawerItem(predicate: (text: string) => boolean) {
  return (
    [...document.querySelectorAll(`${mobileWatchlistSymbolDrawerSelector} li.item-WJDah4zD`)].find(
      (item) => item instanceof HTMLLIElement && predicate(normalizeText(item.textContent)),
    ) ?? null
  );
}

function getRequiredMobileWatchlistSymbolDrawerItem(predicate: (text: string) => boolean) {
  const menuItem = getMobileWatchlistSymbolDrawerItem(predicate);

  expect(menuItem).toBeInstanceOf(HTMLLIElement);

  return menuItem as HTMLLIElement;
}

function getVisibleDrawingTemplateTitles() {
  const menuRoot = document.querySelector(drawingTemplatesMenuSelector);

  expect(menuRoot).toBeInstanceOf(HTMLElement);

  return [...(menuRoot as HTMLElement).querySelectorAll('tr[data-role="menuitem"]')]
    .filter(
      (row): row is HTMLTableRowElement =>
        row instanceof HTMLTableRowElement &&
        !row.hidden &&
        row.style.display !== "none" &&
        row.querySelector('span[aria-label="Remove"]') instanceof HTMLElement,
    )
    .map((row) => normalizeText(row.querySelector('span[data-label="true"]')?.textContent));
}

function getVisibleDrawingTemplateActionLabels() {
  const menuRoot = document.querySelector(drawingTemplatesMenuSelector);

  expect(menuRoot).toBeInstanceOf(HTMLElement);

  return [...(menuRoot as HTMLElement).querySelectorAll('tr[data-role="menuitem"]')]
    .filter(
      (row): row is HTMLTableRowElement =>
        row instanceof HTMLTableRowElement &&
        !row.hidden &&
        row.style.display !== "none" &&
        !(row.querySelector('span[aria-label="Remove"]') instanceof HTMLElement),
    )
    .map((row) => normalizeText(row.querySelector('span[data-label="true"]')?.textContent));
}

function getDrawingTemplateTitle(templateTitle: string) {
  return (
    [...document.querySelectorAll(`${drawingTemplatesMenuSelector} tr[data-role="menuitem"]`)].find(
      (row) =>
        row instanceof HTMLTableRowElement &&
        !row.hidden &&
        row.style.display !== "none" &&
        normalizeText(row.querySelector('span[data-label="true"]')?.textContent) === templateTitle,
    ) ?? null
  );
}

function countDrawingTemplateSpacerRows() {
  return [...document.querySelectorAll(`${drawingTemplatesMenuSelector} tr.subMenu-GJX1EXhk`)].filter(
    (row) => row instanceof HTMLTableRowElement && !row.hidden && row.style.display !== "none",
  ).length;
}

function getVisiblePopupTemplateTitles() {
  return getVisiblePopupTemplateTitlesWithin(popupTemplateMenuSelector);
}

function getVisiblePopupTemplateTitlesWithin(rootSelector: string) {
  const menuRoot = document.querySelector(rootSelector);

  expect(menuRoot).toBeInstanceOf(HTMLElement);

  return [...(menuRoot as HTMLElement).querySelectorAll('.item-BOZdoKo9[class*="defaultsButtonItem-"]')]
    .filter(
      (menuItem): menuItem is HTMLDivElement =>
        menuItem instanceof HTMLDivElement &&
        !menuItem.hidden &&
        menuItem.style.display !== "none" &&
        !(menuItem.parentElement instanceof HTMLElement && menuItem.parentElement.hidden) &&
        !(menuItem.parentElement instanceof HTMLElement && menuItem.parentElement.style.display === "none") &&
        menuItem.querySelector('[data-name="remove-button"]') instanceof HTMLElement,
    )
    .map((menuItem) => normalizeText(menuItem.querySelector('.label-BOZdoKo9')?.textContent));
}

function getVisiblePopupTemplateActionLabels() {
  return getVisiblePopupTemplateActionLabelsWithin(popupTemplateMenuSelector);
}

function getVisiblePopupTemplateActionLabelsWithin(rootSelector: string) {
  const menuRoot = document.querySelector(rootSelector);

  expect(menuRoot).toBeInstanceOf(HTMLElement);

  return [...(menuRoot as HTMLElement).querySelectorAll('.item-BOZdoKo9[class*="defaultsButtonItem-"]')]
    .filter(
      (menuItem): menuItem is HTMLDivElement =>
        menuItem instanceof HTMLDivElement &&
        !menuItem.hidden &&
        menuItem.style.display !== "none" &&
        !(menuItem.parentElement instanceof HTMLElement && menuItem.parentElement.hidden) &&
        !(menuItem.parentElement instanceof HTMLElement && menuItem.parentElement.style.display === "none") &&
        !(menuItem.querySelector('[data-name="remove-button"]') instanceof HTMLElement),
    )
    .map((menuItem) => normalizeText(menuItem.querySelector('.label-BOZdoKo9')?.textContent));
}

function getPopupTemplateTitle(templateTitle: string) {
  return getPopupTemplateTitleWithin(popupTemplateMenuSelector, templateTitle);
}

function getPopupTemplateTitleWithin(rootSelector: string, templateTitle: string) {
  return (
    [...document.querySelectorAll(`${rootSelector} .item-BOZdoKo9[class*="defaultsButtonItem-"]`)].find(
      (menuItem) =>
        menuItem instanceof HTMLDivElement &&
        !menuItem.hidden &&
        menuItem.style.display !== "none" &&
        !(menuItem.parentElement instanceof HTMLElement && menuItem.parentElement.hidden) &&
        !(menuItem.parentElement instanceof HTMLElement && menuItem.parentElement.style.display === "none") &&
        normalizeText(menuItem.querySelector('.label-BOZdoKo9')?.textContent) === templateTitle,
    ) ?? null
  );
}

function getVisibleTableMenuLabelsWithin(rootSelector: string) {
  const menuRoot = document.querySelector(rootSelector);

  expect(menuRoot).toBeInstanceOf(HTMLElement);

  return [...(menuRoot as HTMLElement).querySelectorAll('tr[data-role="menuitem"]')]
    .filter(
      (menuRow): menuRow is HTMLTableRowElement =>
        menuRow instanceof HTMLTableRowElement &&
        !menuRow.hidden &&
        menuRow.style.display !== "none",
    )
    .map((menuRow) => menuRow.querySelector('span[data-label="true"]'))
    .filter((label): label is HTMLSpanElement => label instanceof HTMLSpanElement)
    .map((label) => normalizeText(label.textContent));
}

function countTableMenuRowsWithin(rootSelector: string) {
  const menuRoot = document.querySelector(rootSelector);

  expect(menuRoot).toBeInstanceOf(HTMLElement);

  return [...(menuRoot as HTMLElement).querySelectorAll("tbody > tr")].filter(
    (row) => row instanceof HTMLTableRowElement && !row.hidden && row.style.display !== "none",
  ).length;
}

function getVisibleMobileDrawerLabelsWithin(rootSelector: string) {
  const drawerRoot = document.querySelector(rootSelector);

  expect(drawerRoot).toBeInstanceOf(HTMLElement);

  return [...(drawerRoot as HTMLElement).querySelectorAll("li.item-WJDah4zD .label-WJDah4zD")]
    .filter((label): label is HTMLSpanElement => label instanceof HTMLSpanElement)
    .map((label) => normalizeText(label.textContent));
}

function countMobileDrawerChildrenWithin(rootSelector: string) {
  const drawerRoot = document.querySelector(rootSelector);

  expect(drawerRoot).toBeInstanceOf(HTMLElement);

  return (drawerRoot as HTMLElement).querySelectorAll(":scope > ul > li").length;
}

function getVisibleIndicatorTemplateTitles() {
  return getVisibleIndicatorTemplateTitlesWithin(indicatorTemplatesDialogSelector);
}

function getVisibleIndicatorTemplateTitlesWithin(rootSelector: string) {
  const dialogRoot = document.querySelector(rootSelector);

  expect(dialogRoot).toBeInstanceOf(HTMLElement);

  return [...(dialogRoot as HTMLElement).querySelectorAll(indicatorTemplatesRowSelector)]
    .filter(
      (row): row is HTMLDivElement =>
        row instanceof HTMLDivElement && !row.hidden && row.style.display !== "none",
    )
    .map((row) => row.dataset.title ?? "");
}

function getVisibleWatchlistTitlesWithin(rootSelector: string) {
  const dialogRoot = document.querySelector(rootSelector);

  expect(dialogRoot).toBeInstanceOf(HTMLElement);

  return [...(dialogRoot as HTMLElement).querySelectorAll(watchlistsRowSelector)]
    .filter(
      (row): row is HTMLDivElement =>
        row instanceof HTMLDivElement && !row.hidden && row.style.display !== "none",
    )
    .map((row) => row.dataset.title ?? "");
}

function getVisibleWatchlistSectionTitlesWithin(rootSelector: string) {
  const dialogRoot = document.querySelector(rootSelector);

  expect(dialogRoot).toBeInstanceOf(HTMLElement);

  return [...(dialogRoot as HTMLElement).querySelectorAll(watchlistsSectionTitleSelector)]
    .filter(
      (title): title is HTMLDivElement =>
        title instanceof HTMLDivElement &&
        !title.hidden &&
        title.style.display !== "none" &&
        title.parentElement instanceof HTMLElement &&
        !title.parentElement.hidden &&
        title.parentElement.style.display !== "none",
    )
    .map((title) => normalizeText(title.textContent));
}

function getWatchlistsLayoutItemTopWithin(rootSelector: string, itemText: string) {
  const dialogRoot = document.querySelector(rootSelector);

  expect(dialogRoot).toBeInstanceOf(HTMLElement);

  const layoutItem = [
    ...(dialogRoot as HTMLElement).querySelectorAll(
      `${watchlistsSectionTitleSelector}, ${watchlistsRowSelector}`,
    ),
  ].find((item) => {
    if (!(item instanceof HTMLElement)) {
      return false;
    }

    return item.matches(watchlistsRowSelector)
      ? item.dataset.title === itemText
      : normalizeText(item.textContent) === itemText;
  });

  expect(layoutItem).toBeInstanceOf(HTMLElement);

  const element = layoutItem as HTMLElement;

  if (element.matches(watchlistsRowSelector)) {
    return element.style.top;
  }

  return element.parentElement?.style.top ?? element.style.top;
}

function getIndicatorTemplatesTab(tabId: "my templates" | "technicals" | "financials") {
  const tabButton = getIndicatorTemplatesDialogRoot().querySelector(
    `button[role="tab"][id="${tabId}"]`,
  );

  expect(tabButton).toBeInstanceOf(HTMLButtonElement);

  return tabButton as HTMLButtonElement;
}

function getWatchlistsTab(tabId: "my-watch-lists" | "hot-lists") {
  const tabButton = document.querySelector(
    `${desktopWatchlistsDialogSelector} button[role="tab"]#${tabId}`,
  );

  expect(tabButton).toBeInstanceOf(HTMLButtonElement);

  return tabButton as HTMLButtonElement;
}

function getButtonByTextWithin(rootSelector: string, buttonText: string) {
  const dialogRoot = document.querySelector(rootSelector);

  expect(dialogRoot).toBeInstanceOf(HTMLElement);

  const button = [...(dialogRoot as HTMLElement).querySelectorAll("button")].find(
    (candidate) => {
      if (!(candidate instanceof HTMLButtonElement)) {
        return false;
      }

      return normalizeText(candidate.textContent) === buttonText;
    },
  );

  expect(button).toBeInstanceOf(HTMLButtonElement);

  return button as HTMLButtonElement;
}

function getIndicatorTemplatesButtonByText(rootSelector: string, buttonText: string) {
  return getButtonByTextWithin(rootSelector, buttonText);
}

function getRestrictedIndicatorTemplatesTabOverlay(
  tabId: "my templates" | "technicals" | "financials",
) {
  return getRestrictedIndicatorTemplatesButtonOverlay(getIndicatorTemplatesTab(tabId));
}

function getRestrictedIndicatorTemplatesButtonOverlay(button: HTMLButtonElement) {
  const overlay = button.querySelector(restrictedIndicatorTemplatesTabOverlaySelector);

  expect(overlay).toBeInstanceOf(HTMLSpanElement);

  return overlay as HTMLSpanElement;
}

function renderIndicatorTemplatesTab(
  selectedTabId: "my templates" | "technicals" | "financials",
  rows: Array<{ description: string; title: string }>,
) {
  const dialogRoot = getIndicatorTemplatesDialogRoot();
  const tabButtons = dialogRoot.querySelectorAll(indicatorTemplatesTabSelector);
  const itemsRoot = dialogRoot.querySelector(".items-L80m51KC");

  expect(itemsRoot).toBeInstanceOf(HTMLElement);

  for (const tabButton of tabButtons) {
    if (!(tabButton instanceof HTMLButtonElement)) {
      continue;
    }

    tabButton.setAttribute("aria-selected", tabButton.id === selectedTabId ? "true" : "false");
  }

  (itemsRoot as HTMLElement).innerHTML = rows
    .map((row, index) =>
      createIndicatorTemplatesRowMarkup(index + 1, row.title, row.description),
    )
    .join("");
}

function getMenuItemBySelector(selector: string) {
  return document.querySelector(selector);
}

function expectSelectorToBeHidden(selector: string) {
  const element = document.querySelector(selector);

  expect(element).toBeInstanceOf(HTMLElement);
  expect((element as HTMLElement).style.display).toBe("none");
  expect((element as HTMLElement).style.pointerEvents).toBe("none");
  expect((element as HTMLElement).getAttribute("aria-hidden")).toBe("true");
}

function getMenuItemByTextPrefix(textPrefix: string) {
  return (
    [...document.querySelectorAll('[data-role="menuitem"]')].find((candidate) => {
      if (!(candidate instanceof HTMLElement)) {
        return false;
      }

      return normalizeText(candidate.textContent).startsWith(textPrefix);
    }) ?? null
  );
}

function queryWithin(rootSelector: string, selector: string) {
  return document.querySelector(`${rootSelector} ${selector}`);
}

function countWithin(rootSelector: string, selector: string) {
  return document.querySelectorAll(`${rootSelector} ${selector}`).length;
}

function getRootText(rootSelector: string) {
  const root = document.querySelector(rootSelector);

  expect(root).toBeInstanceOf(HTMLElement);

  return normalizeText(root?.textContent);
}

function updateDialogInputValue(rootSelector: string, value: string) {
  const dialogInput = getDialogInput(rootSelector);

  dialogInput.value = value;
  dialogInput.dispatchEvent(new Event("input", { bubbles: true }));
  dialogInput.dispatchEvent(new Event("change", { bubbles: true }));
}

function createBootstrapCacheRecordWithUser(
  userOverrides: Partial<NonNullable<BootstrapCacheRecord["snapshot"]["user"]>> & {
    avatarUrl: string | null;
    hasPrivateAccess?: boolean;
  },
): BootstrapCacheRecord {
  return createBootstrapCacheRecord({
    assets: [
      {
        hasPrivateAccess: userOverrides.hasPrivateAccess ?? false,
        hasShareAccess: true,
        platform: "tradingview",
      },
    ],
    auth: { status: "authenticated" },
    user: {
      avatarUrl: userOverrides.avatarUrl,
      email: userOverrides.email ?? "ongkay@example.com",
      id: userOverrides.id ?? "user-1",
      publicId: userOverrides.publicId ?? "public-user-1",
      username: userOverrides.username ?? "ongkaytrade",
    },
    version: { status: "supported" },
  });
}

function createTradingViewHeaderMarkup(avatarUrl = "https://old.example.com/avatar.png") {
  return `
    <div class="layout__area--topleft">
      <div class="topLeftButton-hCWTCWBf">
        <div class="wrap-n5bmFxyX">
          <button type="button" data-qa-id="main-menu-button">
            <img alt="" class="userPic-U2jIw4km" src="${avatarUrl}" />
          </button>
          <span class="menuNotifications-U2jIw4km notifications-U2jIw4km">11</span>
        </div>
      </div>
    </div>
    <div class="group-MBOVGQRI">
      <button
        id="header-toolbar-quick-search"
        aria-label="Quick search"
        data-name="header-toolbar-quick-search"
        type="button"
      ></button>
      <button id="header-toolbar-alerts" aria-label="Create alert" type="button">Alert</button>
    </div>
    <div id="header-toolbar-indicators" class="wrap-n5bmFxyX">
      <button type="button" aria-label="Indicators, metrics, and strategies">Indicators</button>
      <button type="button" data-name="show-favorite-indicators" aria-label="Favorite indicators"></button>
    </div>
    <div class="inner-OhqNVIYA">
      <div id="header-toolbar-trade-desktop" class="desktopTrade-OhqNVIYA container-AoI2iZaK">
        <button type="button" title="Trade with your broker">Trade</button>
      </div>
      <div id="header-toolbar-publish-desktop" class="desktopPublish-OhqNVIYA container-yRWAMXSg">
        <button type="button" aria-label="Share your idea with the trade community">Publish</button>
      </div>
    </div>
    <div class="mobilePublish-OhqNVIYA group-MBOVGQRI noRightDecoration-MBOVGQRI">
      <div id="header-toolbar-publish-mobile" class="container-yRWAMXSg">
      <button type="button" aria-label="Alerts" data-name="alerts"></button>
        <button type="button" aria-label="Share your idea with the trade community">Publish</button>
      </div>
    </div>
    <div class="toolbar-S4V6IoxY" data-name="right-toolbar">
      <button type="button" aria-label="Watchlist, details, and news" data-name="base"></button>
      <button type="button" aria-label="Chats" data-name="union_chats"></button>
      <button type="button" aria-label="Products" data-qa-id="products-button"></button>
      <button type="button" aria-label="Help Center" data-name="help-button"></button>
    </div>
  `;
}

function createTradingViewMenuMarkup() {
  return `
    <div role="treegrid" data-qa-id="popup-menu-container">
      <div class="background-row"><div role="row" aria-label="Watchlist" data-role="menuitem"><span role="gridcell">Watchlist</span></div></div>
      <div class="background-row"><div role="row" aria-label="Alerts" data-role="menuitem"><span role="gridcell">Alerts</span></div></div>
      <div role="separator"></div>
      <div class="background-row"><div role="row" data-qa-id="main-menu-user-menu-item" data-role="menuitem"><span role="gridcell">ongkaytrade</span></div></div>
      <div class="background-row"><a role="row" aria-label="Home" data-role="menuitem" href="/" target="_blank"><span role="gridcell">Home</span></a></div>
      <div class="background-row"><div role="row" aria-label="Help Center" data-role="menuitem"><span role="gridcell">Help Center</span></div></div>
      <div class="background-row"><div role="row" aria-label="Support requests" data-role="menuitem"><span role="gridcell">Support requests</span></div></div>
      <div class="background-row"><div role="row" aria-label="What's new" data-role="menuitem"><span role="gridcell">What's new</span></div></div>
      <div role="separator"></div>
      <div class="background-row"><div role="row" aria-label="Dark theme" data-role="menuitem"><span role="gridcell">Dark theme</span></div></div>
      <div class="background-row"><div role="row" aria-label="Drawings panel" data-role="menuitem"><span role="gridcell">Drawings panel</span></div></div>
      <div class="background-row"><div role="row" data-role="menuitem"><span role="gridcell">Language English</span></div></div>
      <div class="background-row"><div role="row" aria-label="Keyboard shortcuts" data-role="menuitem"><span role="gridcell">Keyboard shortcuts</span></div></div>
      <div class="background-row"><a role="row" aria-label="Get desktop app" data-role="menuitem" href="/desktop/" target="_blank"><span role="gridcell">Get desktop app</span></a></div>
      <div role="separator"></div>
      <div class="background-row"><div role="row" aria-label="Sign out" data-qa-id="main-menu-sign-out-item" data-role="menuitem"><span role="gridcell">Sign out</span></div></div>
    </div>
  `;
}

function createMobileTradingViewMenuMarkup() {
  return `
    <div data-qa-id="overlap-manager-root">
      <div class="container-U2jIw4km">
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="Watchlist" data-role="menuitem" class="button-HZXWyU6m"><span role="gridcell">Watchlist</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="Alerts" data-role="menuitem" class="button-HZXWyU6m"><span role="gridcell">Alerts</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" data-role="menuitem" class="button-HZXWyU6m"><img class="userPic-U2jIw4km profileItem-U2jIw4km" src="https://s3.tradingview.com/userpics/67477063-Wsks_mid.png" /><span class="userName-U2jIw4km userNameMobile-U2jIw4km">ongkaytrade</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><a role="row" aria-label="Home" data-role="menuitem" href="/" target="_blank" class="button-HZXWyU6m"><span role="gridcell">Home</span></a></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="Help Center" data-role="menuitem" class="button-HZXWyU6m"><span role="gridcell">Help Center</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="Support requests" data-role="menuitem" class="button-HZXWyU6m"><span role="gridcell">Support requests</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="What's new" data-role="menuitem" class="button-HZXWyU6m"><span role="gridcell">What's new</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="Dark theme" data-role="menuitem" class="button-HZXWyU6m"><span role="gridcell">Dark theme</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="Drawings panel" data-role="menuitem" class="button-HZXWyU6m"><span role="gridcell">Drawings panel</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" data-role="menuitem" class="button-HZXWyU6m">Language<span>English</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="Keyboard shortcuts" data-role="menuitem" class="button-HZXWyU6m"><span role="gridcell">Keyboard shortcuts</span></div></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><a role="row" aria-label="Get desktop app" data-role="menuitem" href="/desktop/" target="_blank" class="button-HZXWyU6m"><span role="gridcell">Get desktop app</span></a></div>
        <div class="background-wJ4EfuBP large-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="Sign out" data-qa-id="main-menu-sign-out-item" data-role="menuitem" class="button-HZXWyU6m"><span role="gridcell">Sign out</span></div></div>
      </div>
    </div>
  `;
}

function createTradingViewRecentMenusMarkup(options?: { useMobileWatchlistsTitle?: boolean }) {
  return `
    <div id="layout-recent-root" data-qa-id="menu-inner" class="menuBox-XktvVkFF">
      <div class="desktop-Uy_he976 newMenuWrapper-Uy_he976">
        <div data-role="menuitem">Create new layout...</div>
        <div class="menu-divider-YZ5qU_gy" role="separator"><div class="menu-divider-line-YZ5qU_gy"></div></div>
        <div>
          <div class="customListItem-KOmCbcJ6" aria-label="Recently used" role="row" data-qa-id="ui-lib-title-list-item">
            <div><div class="wrapper-AO80rc_p secondaryTitleWrapper-AO80rc_p"><div class="content-AO80rc_p"><div class="title-AO80rc_p" id=":layout-title:"><span role="gridcell">Recently used</span></div></div></div></div>
          </div>
          <div id=":layout-menu:" role="menu" aria-orientation="horizontal"></div>
        </div>
        <div aria-labelledby=":layout-title:" id=":layout-group:" role="rowgroup">
          <div class="background-wJ4EfuBP medium-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" class="button-HZXWyU6m" tabindex="-1" data-qa-id="save-load-menu-item-recent" data-role="menuitem"><span role="gridcell">bma</span></div></div>
        </div>
        <div class="menu-divider-YZ5qU_gy" role="separator"><div class="menu-divider-line-YZ5qU_gy"></div></div>
        <div data-role="menuitem">Open layout...</div>
      </div>
    </div>
    <div id="indicator-recent-root" data-qa-id="menu-inner" class="menuBox-XktvVkFF">
      <div class="desktop-Uy_he976 newMenuWrapper-Uy_he976">
        <div data-role="menuitem">Save indicator template...</div>
        <div class="menu-divider-YZ5qU_gy" role="separator"><div class="menu-divider-line-YZ5qU_gy"></div></div>
        <div>
          <div class="customListItem-KOmCbcJ6" aria-label="Recently used" data-qa-id="ui-lib-title-list-item">
            <div><div class="wrapper-AO80rc_p secondaryTitleWrapper-AO80rc_p"><div class="content-AO80rc_p"><div class="title-AO80rc_p" id=":indicator-title:"><span role="gridcell">Recently used</span></div></div></div></div>
          </div>
          <div id=":indicator-menu:" role="menu" aria-orientation="horizontal"></div>
        </div>
        <div aria-labelledby=":indicator-title:" id=":indicator-group:" role="rowgroup">
          <div class="background-wJ4EfuBP medium-wJ4EfuBP neutral-wJ4EfuBP"><div role="row" aria-label="template lima" class="button-HZXWyU6m" tabindex="-1" data-group-name="recent" data-role="menuitem"><span role="gridcell">template lima</span></div></div>
        </div>
        <div class="menu-divider-YZ5qU_gy" role="separator"><div class="menu-divider-line-YZ5qU_gy"></div></div>
        <div data-role="menuitem">Open template...</div>
      </div>
    </div>
    <div id="watchlists-recent-root" data-qa-id="menu-inner" class="menuBox-XktvVkFF">
      <div data-role="menuitem">Create new list...</div>
      <div class="separator-UZn6u4sU normal-UZn6u4sU" role="separator" aria-hidden="false"></div>
      <div data-role="menuitem">Upload list...</div>
      <div class="separator-UZn6u4sU normal-UZn6u4sU" role="separator" aria-hidden="false"></div>
      <div>
        <div class="columnsTitle-mQBvegEO ${options?.useMobileWatchlistsTitle ? "small-mQBvegEO " : ""}title-GlrQ9d9L">Recently used</div>
        <div data-role="menuitem">dua</div>
        <div data-role="menuitem">empat</div>
      </div>
      <div class="separator-UZn6u4sU normal-UZn6u4sU" role="separator" aria-hidden="false"></div>
      <div data-role="menuitem">Open list...</div>
    </div>
  `;
}

function createFavoriteButtonsMarkup() {
  return `
    <div>
      <button
        title="Remove from favorites"
        data-tooltip="Remove from favorites"
        type="button"
        role="button"
        aria-label="Remove from favorites"
        tabindex="-1"
        class="iconButton-RAiBjVep primary-RAiBjVep square-RAiBjVep favoritesIconButtonToggled-vqp9wWRj primary-vqp9wWRj apply-common-tooltip"
        data-qa-id="preset-menu-favorite-button"
      ></button>
      <button
        title="Add to favorites"
        data-tooltip="Add to favorites"
        type="button"
        role="button"
        aria-label="Add to favorites"
        tabindex="-1"
        class="iconButton-RAiBjVep primary-RAiBjVep square-RAiBjVep apply-common-tooltip"
        data-qa-id="preset-menu-favorite-button"
      ></button>
      <span
        role="img"
        class="favorite-_FRQhM5Y apply-common-tooltip checked-_FRQhM5Y favorite-WeNdU0sq isActive-WeNdU0sq"
        aria-label="Remove from favorites"
        aria-hidden="false"
        data-tooltip="Remove from favorites"
      ></span>
      <span
        role="img"
        class="favorite-_FRQhM5Y apply-common-tooltip favorite-WeNdU0sq"
        aria-label="Add to favorites"
        aria-hidden="false"
        data-tooltip="Add to favorites"
      ></span>
    </div>
  `;
}

function createRestrictedDialogsMarkup() {
  return `
    <div class="wrap-B02UUUN3" data-name="create-dialog">
      <div class="main-B02UUUN3">
        <div class="content-B02UUUN3">
          <div class="autocomplete-uszkUMOz js-dialog-skip-escape">
            <span class="container-WDZ0PRNh" data-qa-id="ui-lib-Input">
              <span class="inner-slot-W53jtLjw inner-middle-slot-W53jtLjw">
                <input data-qa-id="ui-lib-Input-input" value="" />
              </span>
            </span>
          </div>
        </div>
        <div class="footer-B02UUUN3">
          <button name="save" data-qa-id="save-btn">Create</button>
        </div>
      </div>
    </div>
    <div class="wrap-B02UUUN3" data-name="rename-dialog">
      <div class="main-B02UUUN3">
        <div class="content-B02UUUN3">
          <div class="autocomplete-uszkUMOz js-dialog-skip-escape">
            <span class="container-WDZ0PRNh" data-qa-id="ui-lib-Input">
              <span class="inner-slot-W53jtLjw inner-middle-slot-W53jtLjw">
                <input data-qa-id="ui-lib-Input-input" value="" />
              </span>
              <span class="inner-slot-W53jtLjw interactive-W53jtLjw">
                <button type="button" tabindex="-1" class="button-PYEOTd6i"></button>
              </span>
              <span class="highlight-WDZ0PRNh"></span>
            </span>
          </div>
        </div>
        <div class="footer-B02UUUN3">
          <button name="save" data-qa-id="save-btn">Save</button>
        </div>
      </div>
    </div>
    <div role="dialog" class="wrapper-b8SxMnzX" data-name="save-rename-dialog" data-dialog-name="Save indicator template">
      <div class="container-CD9TBN7D">
        <div class="autocomplete-CD9TBN7D">
          <div class="autocomplete-uszkUMOz js-dialog-skip-escape">
            <span class="container-WDZ0PRNh" data-qa-id="ui-lib-Input">
              <span class="inner-slot-W53jtLjw inner-middle-slot-W53jtLjw">
                <input data-qa-id="ui-lib-Input-input" value="" />
              </span>
              <span class="inner-slot-W53jtLjw interactive-W53jtLjw">
                <button type="button" tabindex="-1" class="button-PYEOTd6i"></button>
              </span>
              <span class="highlight-WDZ0PRNh"></span>
            </span>
            <ul class="suggestions-uszkUMOz"><li>template lama</li></ul>
          </div>
        </div>
        <button name="submit" data-name="submit-button" data-qa-id="submit-button">Save</button>
      </div>
    </div>
  `;
}

function createAlertDialogMarkup() {
  return `
    <div data-qa-id="alerts-create-edit-dialog" class="dialog-qyCw0PaN dialog-YKU5b5xj popup-LEkd5gPO dialog-aRAWUDhF" tabindex="-1">
      <div class="headerWrapper-L1hbvk7h withDivider-L1hbvk7h">
        <div data-qa-id="dialog-header" class="container-BZKENkhT header-AxRz6hfm">
          <div class="title-BZKENkhT" data-dragg-area="true">
            <div class="ellipsis-BZKENkhT title-AxRz6hfm">
              <div class="titleText-AxRz6hfm screenTitleText-AxRz6hfm" data-qa-id="alerts-editor-header-title">
                <span class="textPrefix-AxRz6hfm">Create alert on</span>
              </div>
              <div class="headerActions-AxRz6hfm" data-disable-drag="true">
                <div class="headerActionItem-AxRz6hfm">
                  <button type="button" data-qa-id="header-alert-presets-menu-button">Alert presets</button>
                </div>
                <button data-qa-id="close" type="button">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <form class="form-h6NNXQD2" novalidate="">
        <div class="contentWrapper-HQliu1dK permanentScroll-HQliu1dK" tabindex="-1">
          <div class="content-HQliu1dK">
            <fieldset class="container-sFcMHof4 textButtonSection-Q92ASNAn placementSide-sFcMHof4">
              <div class="legendWrapper-sFcMHof4"><legend class="legend-sFcMHof4 typographyRegular-sFcMHof4">Notifications</legend></div>
              <div class="fieldsWrapper-sFcMHof4">
                <button data-qa-id="alert-notifications-button" type="button">Email</button>
              </div>
            </fieldset>
          </div>
        </div>
        <div class="footerWrapper-Rytf0znw">
          <div class="buttons-m9pp3wEB">
            <div class="endSlot-m9pp3wEB">
              <button type="button" data-qa-id="cancel">Cancel</button>
              <button type="submit" data-qa-id="submit"><span class="content-D4RPB3ZC">Create</span></button>
            </div>
          </div>
        </div>
      </form>
    </div>
  `;
}

function createIndicatorTemplatesDialogMarkup() {
  return `
    <div role="dialog" class="wrapper-b8SxMnzX dialog-b8SxMnzX" data-name="indicator-templates-dialog" data-dialog-name="Indicator templates">
      <div class="bodyWrapper-B3wirqjZ">
        <div class="search-lANubSc2-wrapper">
          <input role="searchbox" type="text" placeholder="Search" value="" />
        </div>
        <div class="tabs-nqU_VJml">
          <button role="tab" id="my templates" aria-selected="true">My templates</button>
          <button role="tab" id="technicals" aria-selected="false">Technicals</button>
          <button role="tab" id="financials" aria-selected="false">Financials</button>
        </div>
        <div class="contentArea-B3wirqjZ">
          <div class="items-L80m51KC">
            ${createIndicatorTemplatesRowMarkup(1, "50975 alpha", "Vol · Ticks")}
            ${createIndicatorTemplatesRowMarkup(2, "template orang lain", "EMA 20/50")}
            ${createIndicatorTemplatesRowMarkup(3, "50975 beta", "10 in 1 MAs, RSI")}
            ${createIndicatorTemplatesRowMarkup(4, "template publik", "Order Block")}
            ${createIndicatorTemplatesRowMarkup(5, "50975 gamma", "WAE [SHK]")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function createLayoutsDialogMarkup() {
  return `
    <div role="dialog" class="wrapper-b8SxMnzX" data-name="load-layout-dialog" data-dialog-name="Layouts">
      <div class="searchContainer-B3wirqjZ">
        <div class="inputContainer-lANubSc2">
          <input
            placeholder="Search"
            aria-controls=":layouts:"
            aria-owns=":layouts:"
            aria-haspopup="listbox"
            class="search-lANubSc2"
            role="searchbox"
            type="text"
            autocomplete="off"
            value=""
          />
          <div class="actions-lANubSc2">
            <button title="Clear" type="button" aria-label="Clear" class="iconButton-RAiBjVep primary-RAiBjVep square-RAiBjVep apply-common-tooltip"></button>
          </div>
        </div>
      </div>
      <div style="height: 192px; width: 100%; position: relative;">
        <a role="row" id="list-item-0" selected="true" style="position: absolute; left: 0px; top: 0px; height: 48px; width: 100%;">50975 ddXAUUSD, 1D</a>
        <a role="row" id="list-item-1" selected="false" style="position: absolute; left: 0px; top: 48px; height: 48px; width: 100%;">50975 lamaXAUUSD, 1D</a>
        <a role="row" id="list-item-2" selected="false" style="position: absolute; left: 0px; top: 96px; height: 48px; width: 100%;">layout orang lainXAUUSD, 1D</a>
        <a role="row" id="list-item-3" selected="false" style="position: absolute; left: 0px; top: 144px; height: 48px; width: 100%;">layout publikXAUUSD, 4H</a>
      </div>
    </div>
  `;
}

function createDrawingTemplatesMenuMarkup() {
  return `
    <div class="menuWrap-XktvVkFF" data-qa-id="templates-menu" data-tooltip-show-on-focus="true" tabindex="-1">
      <div class="scrollWrap-XktvVkFF momentumBased-XktvVkFF" style="overflow-y: auto">
        <div data-qa-id="menu-inner" class="menuBox-XktvVkFF">
          <table>
            <tbody>
              <tr data-role="menuitem" class="accessible-rm8yeqY4 item-GJX1EXhk interactive-GJX1EXhk normal-GJX1EXhk" tabindex="-1">
                <td class="iconCell-GJX1EXhk" data-icon-cell="true"></td>
                <td><div class="content-GJX1EXhk"><span class="label-GJX1EXhk" data-label="true">Save Drawing Template As…</span></div></td>
              </tr>
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr data-role="menuitem" class="accessible-rm8yeqY4 item-GJX1EXhk interactive-GJX1EXhk normal-GJX1EXhk" tabindex="-1">
                <td class="iconCell-GJX1EXhk" data-icon-cell="true"></td>
                <td><div class="content-GJX1EXhk"><span class="label-GJX1EXhk" data-label="true">Apply Default Drawing Template</span></div></td>
              </tr>
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createDrawingTemplateMenuRowMarkup("50975 bbbbb")}
              ${createDrawingTemplateMenuRowMarkup("Abu")}
              ${createDrawingTemplateMenuRowMarkup("50975 biro")}
              ${createDrawingTemplateMenuRowMarkup("Biru")}
              ${createDrawingTemplateMenuRowMarkup("panjangggggggggggggggggggg sekaliiiiiiiiiiiiiiiiiiiiiiii 50975")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createCompactDrawingTemplatesMenuMarkup() {
  return `
    <div class="menuWrap-XktvVkFF" data-qa-id="templates-menu" data-tooltip-show-on-focus="true" tabindex="-1">
      <div class="scrollWrap-XktvVkFF momentumBased-XktvVkFF" style="overflow-y: auto">
        <div data-qa-id="menu-inner" class="menuBox-XktvVkFF">
          <table>
            <tbody>
              <tr data-role="menuitem" class="accessible-rm8yeqY4 item-GJX1EXhk interactive-GJX1EXhk normal-GJX1EXhk" tabindex="-1">
                <td class="iconCell-GJX1EXhk" data-icon-cell="true"></td>
                <td><div class="content-GJX1EXhk"><span class="label-GJX1EXhk" data-label="true">Apply Default Drawing Template</span></div></td>
              </tr>
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createDrawingTemplateMenuRowMarkup("50975 jjg")}
              ${createDrawingTemplateMenuRowMarkup("PDA")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createPopupTemplateMenuMarkup() {
  return `
    <div class="menuWrap-XktvVkFF" data-qa-id="popup-menu-container" data-tooltip-show-on-focus="true" tabindex="-1">
      <div class="scrollWrap-XktvVkFF momentumBased-XktvVkFF" style="overflow-y: auto">
        <div id="popup-template-menu" class="menuBox-XktvVkFF" data-qa-id="menu-inner">
          <div><div class="defaultsButtonItem-AeBgp7zz item-BOZdoKo9"><span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">Save as…</span></span></div></div>
          <div><div class="defaultsButtonItem-AeBgp7zz item-BOZdoKo9"><span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">Apply defaults</span></span></div></div>
          <div class="separator-UZn6u4sU normal-UZn6u4sU" role="separator" aria-hidden="false"></div>
          ${createPopupTemplateMenuItemMarkup("50975 c")}
          ${createPopupTemplateMenuItemMarkup("50975 dddd")}
          ${createPopupTemplateMenuItemMarkup("A")}
          ${createPopupTemplateMenuItemMarkup("d")}
          <span class="invisibleFocusHandler-tFul0OhX" tabindex="0" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  `;
}

function createSeriesThemePopupTemplateMenuMarkup() {
  return `
    <div class="scrollWrap-XktvVkFF momentumBased-XktvVkFF" style="overflow-y: auto;">
      <div id="series-theme-popup-template-menu" class="menuBox-XktvVkFF" data-qa-id="menu-inner">
        <div data-name="series-theme-manager-apply-defaults" data-role="menuitem" class="accessible-NQERJsv9 defaultsButtonItem-w7kgghoW item-BOZdoKo9" tabindex="0"><span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">Apply defaults</span></span></div>
        <div data-name="series-theme-manager-save-as" data-role="menuitem" class="accessible-NQERJsv9 defaultsButtonItem-w7kgghoW item-BOZdoKo9" tabindex="-1"><span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">Save as…</span></span></div>
        <div class="separator-UZn6u4sU normal-UZn6u4sU" role="separator" aria-hidden="false"></div>
        ${createSeriesThemePopupTemplateMenuItemMarkup("50975 ")}
        ${createSeriesThemePopupTemplateMenuItemMarkup("fs")}
        ${createSeriesThemePopupTemplateMenuItemMarkup("gg")}
        ${createSeriesThemePopupTemplateMenuItemMarkup("old1")}
        <span class="invisibleFocusHandler-tFul0OhX" tabindex="0" aria-hidden="true"></span>
      </div>
    </div>
  `;
}

function createDrawingToolbarMarkup() {
  return `
    <div class="tv-floating-toolbar ui-draggable" data-name="drawing-toolbar" style="z-index: 21; left: 252.571px; top: 127.528px;">
      <div class="tv-floating-toolbar__widget-wrapper">
        <div class="tv-floating-toolbar__drag js-drag ui-draggable-handle"></div>
        <div class="tv-floating-toolbar__content js-content"></div>
        <div class="floating-toolbar-react-widgets">
          <div class="floating-toolbar-react-widgets__button button-merBkM5y apply-common-tooltip" data-role="button" data-name="templates"></div>
          <div
            data-role="button"
            class="floating-toolbar-react-widgets__button button-xNqEcuN2 button-GwQQdU8S apply-common-tooltip isInteractive-GwQQdU8S"
            data-name="createLimitOrder"
          >
            <span role="img" class="icon-GwQQdU8S" aria-hidden="true"></span>
          </div>
          <div
            data-role="button"
            class="floating-toolbar-react-widgets__button button-xNqEcuN2 button-GwQQdU8S apply-common-tooltip isInteractive-GwQQdU8S"
            data-name="settings"
          >
            <span role="img" class="icon-GwQQdU8S" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createHorizontalLineContextMenuMarkup() {
  return `
    <div class="menu-Tx5xMZww context-menu menuWrap-XktvVkFF" style="position: fixed; left: 619.173px; top: 304.25px">
      <div class="scrollWrap-XktvVkFF" style="overflow-y: auto">
        <div id="horizontal-line-context-menu" class="menuBox-XktvVkFF" data-qa-id="menu-inner">
          <table>
            <tbody>
              ${createContextTableMenuItemMarkup("Add alert on XAUUSD at 4,767.41", "Alt + A")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add alert on 10 in 1 MAs at 4,767.41", "Alt + A")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Sell 1 XAUUSD @ 4,767.41 limit", "Alt + Shift + S", "trade-sell-limit")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Buy 1 XAUUSD @ 4,767.41 stop", undefined, "trade-buy-stop")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add order on XAUUSD at 4,767.41…", "Shift + T", "trade-new-order")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Draw horizontal line at 4,767.41", "Alt + H")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createChartRightClickContextMenuMarkup() {
  return `
    <div class="menu-Tx5xMZww context-menu menuWrap-XktvVkFF">
      <div class="scrollWrap-XktvVkFF">
        <div id="chart-right-click-context-menu" class="menuBox-XktvVkFF" data-qa-id="menu-inner">
          <table>
            <tbody>
              ${createContextTableMenuItemMarkup("Reset chart view", "Alt + R")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Copy price 6,899.08")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Paste", "Ctrl + V")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Add alert on SPX at 6,899.08…", "Alt + A")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Buy 1 SPX @ 6,899.08 limit", undefined, "trade-buy-limit")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Sell 1 SPX @ 6,899.08 stop", undefined, "trade-sell-stop")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add order on SPX at 6,899.08…", "Shift + T", "trade-new-order")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Chart template", undefined, "apply-color-theme")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Table view")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Settings…")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createCandleRightClickContextMenuMarkup() {
  return `
    <div class="menu-Tx5xMZww context-menu menuWrap-XktvVkFF">
      <div class="scrollWrap-XktvVkFF">
        <div id="candle-right-click-context-menu" class="menuBox-XktvVkFF" data-qa-id="menu-inner">
          <table>
            <tbody>
              ${createContextTableMenuItemMarkup("Add alert on SPX at 6,969.58…", "Alt + A")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add order on SPX at 6,969.58…", "Shift + T", "trade-new-order")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add indicator/strategy on SPX…")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add financial metric for SPX…")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Symbol info…")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add SPX to watchlist")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add text note for SPX", "Alt + N")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Table view")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Settings…")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createIndicatorRightClickContextMenuMarkup() {
  return `
    <div class="menu-Tx5xMZww context-menu menuWrap-XktvVkFF">
      <div class="scrollWrap-XktvVkFF">
        <div id="indicator-right-click-context-menu" class="menuBox-XktvVkFF" data-qa-id="menu-inner">
          <table>
            <tbody>
              ${createContextTableMenuItemMarkup("Add alert on 10 in 1 MAs at 6,575.10…", "Alt + A")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add indicator/strategy on 10 in 1 MAs…")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Add this indicator to favorites")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Remove this indicator from favorites")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("About this script…")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Copy", "Ctrl + C")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Hide")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Settings…")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createDrawingObjectContextMenuMarkup() {
  return `
    <div class="menu-Tx5xMZww context-menu menuWrap-XktvVkFF">
      <div class="scrollWrap-XktvVkFF">
        <div id="drawing-object-context-menu" class="menuBox-XktvVkFF" data-qa-id="menu-inner">
          <table>
            <tbody>
              ${createContextTableMenuItemMarkup("Add alert on rectangle…", "Alt + A")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Template")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Visual order")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Visibility on intervals")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Object tree")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Clone", "Ctrl + Drag")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Copy", "Ctrl + C")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("No sync")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Sync in layout")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Sync globally")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Lock")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Hide")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Remove", "Del")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              <tr class="row-DFIg7eOh"><td><div class="line-DFIg7eOh"></div></td><td><div class="line-DFIg7eOh"></div></td></tr>
              ${createContextTableMenuItemMarkup("Settings…")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createGenericTableMenuMarkup() {
  return `
    <div class="menu-Tx5xMZww context-menu menuWrap-XktvVkFF">
      <div class="scrollWrap-XktvVkFF">
        <div id="generic-table-menu" class="menuBox-XktvVkFF" data-qa-id="menu-inner">
          <table>
            <tbody>
              ${createContextTableMenuItemMarkup("Keep this menu intact")}
              <tr class="subMenu-GJX1EXhk"><td></td></tr>
              ${createContextTableMenuItemMarkup("Another generic action")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createDesktopWatchlistActiveTitleMarkup(title: string) {
  return `
    <div class="container-u7Ufi_N7">
      <div class="leftSlot-u7Ufi_N7 widgetbarWidgetHeaderLeftSlot-mQBvegEO">
        <button class="button-merBkM5y button-g115eYH4 apply-common-tooltip accessible-merBkM5y" type="button">
          <span class="inner-g115eYH4">
            <div class="headerMenuContent-mQBvegEO">
              <span class="titleRow-mQBvegEO">${title}</span>
            </div>
          </span>
        </button>
        <button type="button" aria-label="Add symbol" data-name="add-symbol-button" class="headerButton-mQBvegEO"></button>
        <button type="button" aria-label="Advanced view" data-name="advanced-view-button" class="headerButton-mQBvegEO"></button>
      </div>
    </div>
  `;
}

function createMobileWatchlistActiveTitleMarkup(title: string) {
  return `
    <button type="button" class="mobileBtn-mQBvegEO button-merBkM5y button-g115eYH4 apply-common-tooltip accessible-merBkM5y" data-name="watchlists-button">
      <span class="inner-g115eYH4">
        <div class="headerMenuContent-mQBvegEO">
          <span></span>
          <span class="titleRow-mQBvegEO">${title}</span>
        </div>
      </span>
    </button>
    <button type="button" aria-label="Add symbol" data-name="add-symbol-button" class="headerButton-mQBvegEO"></button>
    <button type="button" aria-label="Advanced view" data-name="advanced-view-button" class="headerButton-mQBvegEO"></button>
  `;
}

function createDesktopWatchlistSymbolsMarkup() {
  return `
    <div class="watchlist-__KRxuOy">
      <div class="content-g71rrBCn">
        <div class="scrollable-g71rrBCn" data-name="symbol-list-wrap">
          <div class="tree-MgF6KBas" data-name="tree" tabindex="0">
            <div class="listContainer-MgF6KBas">
              <div>
                ${createDesktopWatchlistSymbolRowMarkup(0, "CME_MINI:ES1!", "ES1!")}
                ${createDesktopWatchlistSymbolRowMarkup(1, "CME_MINI:NQ1!", "NQ1!")}
                ${createDesktopWatchlistSymbolRowMarkup(2, "AMEX:SPY", "SPY")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createDesktopActiveWatchlistMenuMarkup() {
  return `
    <div class="menuBox-XktvVkFF" data-qa-id="menu-inner">
      ${createActiveWatchlistShareListMarkup()}
      ${createActiveWatchlistMenuRowMarkup("Add alert on the list…")}
      ${createActiveWatchlistMenuRowMarkup("Make a copy…")}
      ${createActiveWatchlistMenuRowMarkup("Rename")}
      ${createActiveWatchlistMenuRowMarkup("Add section")}
      ${createActiveWatchlistMenuRowMarkup("Clear list")}
      <div class="separator-UZn6u4sU normal-UZn6u4sU" role="separator" aria-hidden="false"></div>
      ${createActiveWatchlistMenuRowMarkup("Create new list…")}
      ${createActiveWatchlistMenuRowMarkup("Upload list…")}
      <div class="separator-UZn6u4sU normal-UZn6u4sU" role="separator" aria-hidden="false"></div>
      <div data-role="menuitem" class="accessible-NQERJsv9 item-BOZdoKo9 item-E2qCgOMz withIcon-BOZdoKo9 withIcon-E2qCgOMz" tabindex="-1">
        <span class="icon-BOZdoKo9"></span>
        <span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">Open list…</span><span class="shortcut-BOZdoKo9">Shift + W</span></span>
      </div>
    </div>
  `;
}

function createMobileActiveWatchlistMenuMarkup() {
  return `
    <div class="drawer-GQU5HVYO drawer-GQU5HVYO positionBottom-GQU5HVYO" tabindex="-1" data-name="active-watchlist-menu">
      ${createActiveWatchlistShareListMarkup()}
      ${createMobileActiveWatchlistMenuRowMarkup("Add alert on the list…")}
      ${createMobileActiveWatchlistMenuRowMarkup("Make a copy…")}
      ${createMobileActiveWatchlistMenuRowMarkup("Rename")}
      ${createMobileActiveWatchlistMenuRowMarkup("Add section")}
      ${createMobileActiveWatchlistMenuRowMarkup("Clear list")}
      <div class="separator-UZn6u4sU normal-UZn6u4sU" role="separator" aria-hidden="false"></div>
      ${createMobileActiveWatchlistMenuRowMarkup("Create new list…")}
      ${createMobileActiveWatchlistMenuRowMarkup("Upload list…")}
      <div class="separator-UZn6u4sU normal-UZn6u4sU" role="separator" aria-hidden="false"></div>
      <div data-role="menuitem" class="accessible-NQERJsv9 item-BOZdoKo9 item-mcATxxXd withIcon-BOZdoKo9" tabindex="-1">
        <span class="icon-BOZdoKo9"></span>
        <span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">Open list…</span><span class="shortcut-BOZdoKo9">Shift + W</span></span>
      </div>
    </div>
  `;
}

function createActiveWatchlistShareListMarkup() {
  return `
    <label class="wrapper-bl9AR3Gv accessible-bl9AR3Gv" tabindex="-1" data-role="menuitem" aria-selected="false">
      <div class="labelRow-bl9AR3Gv">
        <div class="label-bl9AR3Gv switcherMobileLabel-mQBvegEO">Share list</div>
      </div>
      <div class="switchWrap-bl9AR3Gv">
        <span class="switcher-fwE97QDf">
          <input type="checkbox" class="input-fwE97QDf" role="switch" aria-checked="false" tabindex="-1" value="share-switcher" />
          <span class="thumbWrapper-fwE97QDf"></span>
        </span>
      </div>
    </label>
  `;
}

function createActiveWatchlistMenuRowMarkup(label: string) {
  return `
    <div data-role="menuitem" class="accessible-NQERJsv9 item-BOZdoKo9 item-E2qCgOMz withIcon-BOZdoKo9 withIcon-E2qCgOMz" tabindex="-1">
      <span class="icon-BOZdoKo9"></span>
      <span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">${label}</span></span>
    </div>
  `;
}

function createMobileActiveWatchlistMenuRowMarkup(label: string) {
  return `
    <div data-role="menuitem" class="accessible-NQERJsv9 item-BOZdoKo9 item-mcATxxXd withIcon-BOZdoKo9" tabindex="-1">
      <span class="icon-BOZdoKo9"></span>
      <span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">${label}</span></span>
    </div>
  `;
}

function createMobileWatchlistDialogMarkup(title: string) {
  return `
    <div role="dialog" class="wrapper-b8SxMnzX" data-name="watchlist-dialog">
      <div class="container-u7Ufi_N7">
        ${createMobileWatchlistActiveTitleMarkup(title)}
      </div>
    </div>
  `;
}

function createMobileWatchlistSymbolDrawerMarkup(symbolShort: string) {
  return `
    <div class="drawer-GQU5HVYO drawer-GQU5HVYO positionBottom-GQU5HVYO" tabindex="-1">
      <ul>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD">Flag/Unflag ${symbolShort}</span></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD"><span class="wrapper-BZLCGWlx"><span class="buttons-BZLCGWlx"><menu><label tabindex="-1" class="colorSelectButton-BZLCGWlx" role="menuitem" aria-label="Set red flag"></label></menu></span></span></span></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD">Unflag all symbols</span></li>
        <li class="separator-Ymxd0dt_"></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD">Add ${symbolShort} to watchlist</span><span role="img" class="nested-WJDah4zD" aria-hidden="true"></span></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD">Add ${symbolShort} to compare</span></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD">Open ${symbolShort} Supercharts</span></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD">Add note for ${symbolShort}</span></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD">Remove ${symbolShort} from watchlist</span></li>
        <li class="separator-Ymxd0dt_"></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD">Symbol details…</span></li>
        <li class="separator-Ymxd0dt_"></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD"><div class="wrapper-loaskYzU"><span>Add section</span></div></span></li>
        <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD"><span role="img" class="icon-WJDah4zD" aria-hidden="true"></span><span class="label-WJDah4zD">Add symbol</span></li>
      </ul>
    </div>
  `;
}

function createMobileHorizontalLineContextMenuMarkup() {
  return `
    <div id="mobile-horizontal-line-context-menu" class="drawer-GQU5HVYO drawer-GQU5HVYO positionBottom-GQU5HVYO" tabindex="-1">
      <ul>
        ${createMobileDrawerItemMarkup("Add alert on XAUUSD at 4,969.35")}
        ${createMobileDrawerItemMarkup("Add alert on  10 in 1 MAs at 4,969.35")}
        <li class="separator-Ymxd0dt_"></li>
        ${createMobileDrawerItemMarkup("Sell 1 XAUUSD @ 4,969.35 limit")}
        ${createMobileDrawerItemMarkup("Buy 1 XAUUSD @ 4,969.35 stop")}
        ${createMobileDrawerItemMarkup("Add order on XAUUSD at 4,969.35…")}
        <li class="separator-Ymxd0dt_"></li>
        ${createMobileDrawerItemMarkup("Draw horizontal line at 4,969.35")}
      </ul>
    </div>
  `;
}

function createGenericMobileDrawerMarkup() {
  return `
    <div id="generic-mobile-drawer" class="drawer-GQU5HVYO drawer-GQU5HVYO positionBottom-GQU5HVYO" tabindex="-1">
      <ul>
        ${createMobileDrawerItemMarkup("Keep this mobile drawer intact")}
        <li class="separator-Ymxd0dt_"></li>
        ${createMobileDrawerItemMarkup("Another generic mobile action")}
      </ul>
    </div>
  `;
}

function createDesktopWatchlistSymbolRowMarkup(index: number, symbolFull: string, symbolShort: string) {
  return `
    <div style="position: absolute; left: 0px; top: ${index * 30}px; height: 30px; width: 100%;">
      <div class="wrap-IEe5qpW4" draggable="true">
        <div class="symbol-RsFlttSS" data-symbol-full="${symbolFull}" data-symbol-short="${symbolShort}" data-active="false" data-selected="false" data-status="resolved">
          <div class="firstItem-RsFlttSS symbolName-RsFlttSS">
            <span class="cell-RsFlttSS flexCell-RsFlttSS">
              <div class="displayContents-RsFlttSS">
                <div class="flexCell-RsFlttSS">
                  <span class="inner-RsFlttSS symbolNameText-RsFlttSS">${symbolShort}</span>
                </div>
              </div>
            </span>
          </div>
          <div class="overlayEnd-RsFlttSS">
            <span role="img" class="button-w6lVe_oI removeButton-RsFlttSS removeButton-Tf8QRdrk" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createDrawingTemplateMenuRowMarkup(title: string) {
  return `
    <tr data-role="menuitem" class="accessible-rm8yeqY4 item-GJX1EXhk interactive-GJX1EXhk normal-GJX1EXhk" tabindex="-1">
      <td class="iconCell-GJX1EXhk" data-icon-cell="true"></td>
      <td>
        <div class="content-GJX1EXhk">
          <span class="label-GJX1EXhk" data-label="true">${title}</span>
          <span class="toolbox-GJX1EXhk showToolboxOnHover-GJX1EXhk" data-toolbox="true">
            <span role="img" data-name="remove-button" class="button-iLKiGOdQ apply-common-tooltip" aria-label="Remove" aria-hidden="false" title="Remove"></span>
          </span>
        </div>
      </td>
    </tr>
    <tr class="subMenu-GJX1EXhk"><td></td></tr>
  `;
}

function createContextTableMenuItemMarkup(
  label: string,
  shortcut?: string,
  actionName?: string,
) {
  const actionAttribute = actionName ? ` data-action-name="${actionName}"` : "";
  const shortcutMarkup = shortcut
    ? `<span class="shortcut-GJX1EXhk">${shortcut}</span>`
    : "";

  return `
    <tr data-role="menuitem" class="accessible-rm8yeqY4 item-GJX1EXhk interactive-GJX1EXhk normal-GJX1EXhk" tabindex="-1"${actionAttribute}>
      <td class="iconCell-GJX1EXhk" data-icon-cell="true"></td>
      <td>
        <div class="content-GJX1EXhk">
          <span class="label-GJX1EXhk" data-label="true">${label}</span>${shortcutMarkup}
        </div>
      </td>
    </tr>
  `;
}

function createPopupTemplateMenuItemMarkup(label: string) {
  return `
    <div>
      <div class="defaultsButtonItem-AeBgp7zz item-BOZdoKo9">
        <span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">${label}</span></span>
        <span class="toolbox-BOZdoKo9">
          <span
            role="img"
            data-name="remove-button"
            class="button-iLKiGOdQ apply-common-tooltip hidden-iLKiGOdQ"
            aria-label="Remove"
            aria-hidden="false"
            title="Remove"
          ></span>
        </span>
      </div>
    </div>
  `;
}

function createSeriesThemePopupTemplateMenuItemMarkup(label: string) {
  return `
    <div>
      <div data-series-theme-item-theme-name="${label}" data-role="menuitem" class="accessible-NQERJsv9 defaultsButtonItem-w7kgghoW item-BOZdoKo9" tabindex="-1">
        <span class="labelRow-BOZdoKo9"><span class="label-BOZdoKo9">${label}</span></span>
        <span role="toolbar" class="toolbox-BOZdoKo9">
          <button tabindex="-1" class="button-Y1TCZogJ apply-common-tooltip" aria-label="Remove" data-tooltip="Remove" type="button">
            <span role="img" data-name="remove-button" class="button-iLKiGOdQ apply-common-tooltip hidden-iLKiGOdQ remove-w7kgghoW" aria-hidden="true"></span>
          </button>
        </span>
      </div>
    </div>
  `;
}

function createMobileDrawerItemMarkup(label: string) {
  return `
    <li class="item-WJDah4zD interactive-WJDah4zD normal-WJDah4zD">
      <span role="img" class="icon-WJDah4zD" aria-hidden="true"></span>
      <span class="label-WJDah4zD">${label}</span>
    </li>
  `;
}

function createMobileIndicatorTemplatesCategoryDialogMarkup() {
  return `
    <div role="dialog" class="wrapper-b8SxMnzX" data-name="indicator-templates-dialog" data-dialog-name="Indicator templates">
      <div class="container-BZKENkhT">
        <div class="title-BZKENkhT">Indicator templates</div>
        <button data-qa-id="close" type="button">Close menu</button>
      </div>
      <div class="searchContainer-B3wirqjZ">
        <input placeholder="Search" class="search-lANubSc2" role="searchbox" type="text" autocomplete="off" value="" />
      </div>
      <div class="bodyWrapper-B3wirqjZ">
        <div class="sidebarArea-B3wirqjZ">
          <div class="container-nGEmjtaX isMobile-nGEmjtaX mobileTabs-qbOBDZgr" data-role="dialog-sidebar" role="toolbar" aria-orientation="vertical">
            <button tabindex="-1" class="tab-nGEmjtaX isMobile-nGEmjtaX accessible-nGEmjtaX mobileTabItem-qbOBDZgr please-qbOBDZgr">My templates</button>
            <button tabindex="-1" class="tab-nGEmjtaX isMobile-nGEmjtaX accessible-nGEmjtaX mobileTabItem-qbOBDZgr please-qbOBDZgr">Technicals</button>
            <button tabindex="-1" class="tab-nGEmjtaX isMobile-nGEmjtaX accessible-nGEmjtaX mobileTabItem-qbOBDZgr please-qbOBDZgr">Financials</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createMobileIndicatorTemplatesMyTemplatesDialogMarkup() {
  return `
    <div role="dialog" class="wrapper-b8SxMnzX" data-name="indicator-templates-dialog" data-dialog-name="My templates">
      <div class="container-BZKENkhT">
        <button type="button">Back</button>
        <div class="title-BZKENkhT">My templates</div>
        <button data-qa-id="close" type="button">Close menu</button>
      </div>
      <div class="searchContainer-B3wirqjZ">
        <input placeholder="Search" class="search-lANubSc2" role="searchbox" type="text" autocomplete="off" value="" />
      </div>
      <div class="contentArea-B3wirqjZ">
        <div class="items-L80m51KC">
          ${createIndicatorTemplatesRowMarkup(1, "50975 alpha", "Vol · Ticks")}
          ${createIndicatorTemplatesRowMarkup(2, "template orang lain", "EMA 20/50")}
          ${createIndicatorTemplatesRowMarkup(3, "50975 beta", "10 in 1 MAs, RSI")}
          ${createIndicatorTemplatesRowMarkup(4, "template publik", "Order Block")}
          ${createIndicatorTemplatesRowMarkup(5, "50975 gamma", "WAE [SHK]")}
        </div>
      </div>
    </div>
  `;
}

function createDesktopWatchlistsDialogMarkup() {
  return `
    <div role="dialog" class="wrapper-b8SxMnzX" data-name="watchlists-dialog" data-dialog-name="Watchlists">
      <div class="container-BZKENkhT">
        <div class="title-BZKENkhT">Watchlists</div>
        <button data-qa-id="close" type="button">Close menu</button>
      </div>
      <div class="searchContainer-B3wirqjZ">
        <input placeholder="Search lists" class="search-lANubSc2" role="searchbox" type="text" autocomplete="off" value="" />
      </div>
      <div class="bodyWrapper-B3wirqjZ">
        <div class="sidebarArea-B3wirqjZ">
          <div id="watchlists-tabs" role="tablist" aria-orientation="vertical">
            <button role="tab" id="my-watch-lists" aria-selected="true">My watchlists</button>
            <button role="tab" id="hot-lists" aria-selected="false">Hotlists</button>
          </div>
        </div>
        <div class="contentArea-B3wirqjZ">
          <div class="listContainer-XuENC387">
            <div style="height: 251px; width: 100%; position: relative;">
              ${createWatchlistsSectionMarkup("Flagged lists", 0)}
              ${createWatchlistsRowMarkup(1, "Red listfff", 41)}
              ${createWatchlistsSectionMarkup("Created lists", 73)}
              ${createWatchlistsRowMarkup(2, "50975 cccd", 114)}
              ${createWatchlistsRowMarkup(3, "template orang lain", 146)}
              ${createWatchlistsRowMarkup(4, "50975 fgfg", 178)}
              ${createWatchlistsRowMarkup(5, "50975 siap", 210)}
              ${createWatchlistsSectionMarkup("Other", 242)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createMobileWatchlistsCategoryDialogMarkup() {
  return `
    <div role="dialog" class="wrapper-b8SxMnzX" data-name="watchlists-dialog" data-dialog-name="Watchlists">
      <div class="container-BZKENkhT">
        <div class="title-BZKENkhT">Watchlists</div>
        <button data-qa-id="close" type="button">Close menu</button>
      </div>
      <div class="searchContainer-B3wirqjZ">
        <input placeholder="Search lists" class="search-lANubSc2" role="searchbox" type="text" autocomplete="off" value="" />
      </div>
      <div class="bodyWrapper-B3wirqjZ">
        <div class="sidebarArea-B3wirqjZ">
          <div class="container-nGEmjtaX isMobile-nGEmjtaX mobileTabs-qbOBDZgr" data-role="dialog-sidebar" role="toolbar" aria-orientation="vertical">
            <button tabindex="-1" class="tab-nGEmjtaX isMobile-nGEmjtaX accessible-nGEmjtaX mobileTabItem-qbOBDZgr please-qbOBDZgr">My watchlists</button>
            <button tabindex="-1" class="tab-nGEmjtaX isMobile-nGEmjtaX accessible-nGEmjtaX mobileTabItem-qbOBDZgr please-qbOBDZgr">Hotlists</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createMobileMyWatchlistsDialogMarkup() {
  return `
    <div role="dialog" class="wrapper-b8SxMnzX" data-name="watchlists-dialog" data-dialog-name="My watchlists">
      <div class="container-BZKENkhT">
        <button type="button">Back</button>
        <div class="title-BZKENkhT">My watchlists</div>
        <button data-qa-id="close" type="button">Close menu</button>
      </div>
      <div class="searchContainer-B3wirqjZ">
        <input placeholder="Search lists" class="search-lANubSc2" role="searchbox" type="text" autocomplete="off" value="" />
      </div>
      <div class="contentArea-B3wirqjZ">
        <div class="listContainer-XuENC387">
          <div style="height: 251px; width: 100%; position: relative;">
            ${createWatchlistsSectionMarkup("Flagged lists", 0)}
            ${createWatchlistsRowMarkup(1, "Red listfff", 41)}
            ${createWatchlistsSectionMarkup("Created lists", 73)}
            ${createWatchlistsRowMarkup(2, "50975 cccd", 114)}
            ${createWatchlistsRowMarkup(3, "template orang lain", 146)}
            ${createWatchlistsRowMarkup(4, "50975 fgfg", 178)}
            ${createWatchlistsRowMarkup(5, "50975 siap", 210)}
            ${createWatchlistsSectionMarkup("Other", 242)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function createMobileSearchWatchlistsDialogMarkup() {
  return `
    <div role="dialog" class="wrapper-b8SxMnzX" data-name="watchlists-dialog" data-dialog-name="Search">
      <div class="container-BZKENkhT">
        <button type="button">Back</button>
        <div class="title-BZKENkhT">Search</div>
        <button data-qa-id="close" type="button">Close menu</button>
      </div>
      <div class="searchContainer-B3wirqjZ">
        <input placeholder="Search lists" class="search-lANubSc2" role="searchbox" type="text" autocomplete="off" value="a" />
      </div>
      <div class="contentArea-B3wirqjZ">
        <div class="listContainer-XuENC387">
          <div style="height: 251px; width: 100%; position: relative;">
            ${createWatchlistsSectionMarkup("My watchlists", 0)}
            ${createWatchlistsRowMarkup(1, "50975 siap", 41)}
            ${createWatchlistsRowMarkup(2, "apa iya siapa saya saja oke", 73)}
            ${createWatchlistsRowMarkup(3, "Daftar Pantau", 105)}
            ${createWatchlistsRowMarkup(4, "50975 cccd", 137)}
            ${createWatchlistsSectionMarkup("Hotlists", 169)}
            ${createWatchlistsRowMarkup(5, "Volume Gainers", 210)}
            ${createWatchlistsRowMarkup(6, "Gap Gainers", 242)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function createWatchlistsSectionMarkup(title: string, top: number) {
  return `
    <div class="container-UmsFKpIc" style="position: absolute; left: 0px; top: ${top}px; height: 41px; width: 100%;">
      <div class="title-RvmSCAQq">${title}</div>
    </div>
  `;
}

function createWatchlistsRowMarkup(index: number, title: string, top: number) {
  return `
    <div id="list-item-${index}" class="container-ODL8WA9K" data-role="list-item" data-title="${title}" data-id="watchlist-${index}" style="position: absolute; left: 0px; top: ${top}px; height: 32px; width: 100%;">
      <span role="img" id="list-item-${index}-action-0" data-role="list-item-action" class="favorite-_FRQhM5Y favoriteButton-ODL8WA9K" aria-label="Add to favorites"></span>
      <div class="title-ODL8WA9K">${title}</div>
      <div class="controls-ODL8WA9K">
        <button type="button" id="list-item-${index}-action-2" data-role="list-item-action" aria-label="Share"></button>
        <span role="img" id="list-item-${index}-action-3" data-role="list-item-action" title="Make a copy"></span>
        <span role="img" id="list-item-${index}-action-4" data-role="list-item-action" data-name="remove-button" aria-label="Remove" title="Remove"></span>
      </div>
    </div>
  `;
}

function createIndicatorTemplatesRowMarkup(index: number, title: string, description: string) {
  return `
    <div id="list-item-${index}" data-id="template-${index}" data-role="list-item" data-title="${title}" class="item-J4S_Zh_W">
      <div class="body-J4S_Zh_W">
        <div class="name-J4S_Zh_W">${title}</div>
        <div class="description-J4S_Zh_W">${description}</div>
      </div>
      <div class="actions-J4S_Zh_W">
        <span role="img" id="list-item-${index}-action-1" data-role="list-item-action" data-name="remove-button" class="button-iLKiGOdQ" aria-label="Remove"></span>
      </div>
    </div>
  `;
}

function installChromeExtensionMocks(
  initialBootstrapCache: BootstrapCacheRecord,
  options?: {
    pendingBootstrapCache?: Deferred<BootstrapCacheRecord | null>;
    logoutResponse?: { redirectTo: string };
  },
) {
  const storageValues: Record<string, unknown> = {
    [bootstrapCacheStorageKey]: initialBootstrapCache,
  };
  let storageChangeListener:
    | ((changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void)
    | undefined;
  const runtimeSendMessage = vi.fn(
    (
      message: { type: string },
      callback: (response: {
        ok: boolean;
        value?: { redirectTo: string };
        errorMessage?: string;
      }) => void,
    ) => {
      if (message.type !== runtimeMessageType.logoutRequested) {
        callback({ ok: false, errorMessage: "Unsupported runtime message." });
        return;
      }

      callback({ ok: true, value: options?.logoutResponse ?? { redirectTo: "/login" } });
    },
  );

  globalThis.chrome = {
    runtime: {
      sendMessage: runtimeSendMessage,
    },
    storage: {
      local: {
        get: vi.fn((key: string) => {
          if (options?.pendingBootstrapCache) {
            return options.pendingBootstrapCache.promise.then((value) => ({ [key]: value }));
          }

          return Promise.resolve({ [key]: storageValues[key] });
        }),
        remove: vi.fn((key: string) => {
          delete storageValues[key];

          return Promise.resolve();
        }),
        set: vi.fn((values: Record<string, unknown>) => {
          Object.assign(storageValues, values);

          return Promise.resolve();
        }),
      },
      onChanged: {
        addListener: vi.fn(
          (
            listener: (
              changes: Record<string, chrome.storage.StorageChange>,
              areaName: string,
            ) => void,
          ) => {
            storageChangeListener = listener;
          },
        ),
        removeListener: vi.fn(() => {
          storageChangeListener = undefined;
        }),
      },
    },
  } as unknown as typeof chrome;

  return {
    emitStorageChange(nextBootstrapCache: BootstrapCacheRecord) {
      storageValues[bootstrapCacheStorageKey] = nextBootstrapCache;
      storageChangeListener?.(
        {
          [bootstrapCacheStorageKey]: {
            newValue: nextBootstrapCache,
            oldValue: initialBootstrapCache,
          },
        },
        "local",
      );
    },
    runtimeSendMessage,
  };
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
}

function createDeferred<TValue>(): Deferred<TValue> {
  let rejectDeferred: (reason: unknown) => void = () => undefined;
  let resolveDeferred: (value: TValue) => void = () => undefined;
  const promise = new Promise<TValue>((resolve, reject) => {
    rejectDeferred = reject;
    resolveDeferred = resolve;
  });

  return {
    promise,
    reject: rejectDeferred,
    resolve: resolveDeferred,
  };
}

function normalizeText(textContent: string | null | undefined) {
  return textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function mockDetectedPlatform(
  platform: ReturnType<typeof assetPlatforms.detectAssetPlatformFromHostname>,
) {
  if (vi.isMockFunction(assetPlatforms.detectAssetPlatformFromHostname)) {
    vi.mocked(assetPlatforms.detectAssetPlatformFromHostname).mockReturnValue(platform);
    return;
  }

  vi.spyOn(assetPlatforms, "detectAssetPlatformFromHostname").mockReturnValue(platform);
}
