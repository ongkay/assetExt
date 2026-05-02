import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installTradingViewAvatarOverride } from "@/content/dom/installTradingViewAvatarOverride";
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
const indicatorTemplatesDialogSelector =
  '.wrapper-b8SxMnzX[data-dialog-name="Indicator templates"]';
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

const originalChrome = globalThis.chrome;
const originalDocumentClassName = document.documentElement.className;

type Deferred<TValue> = {
  promise: Promise<TValue>;
  reject: (reason: unknown) => void;
  resolve: (value: TValue) => void;
};

describe("TradingView avatar override", () => {
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getMainAvatarImage().src).toBe("https://cdn.example.com/avatar-a.png");
    expect(document.querySelector(".menuNotifications-U2jIw4km")).toBeNull();
    expect(getMenuItemBySelector(desktopPublishSelector)).toBeNull();
    expect(getMenuItemBySelector(mobilePublishWrapperSelector)).toBeNull();
    expect(getMenuItemBySelector(desktopTradeSelector)).toBeNull();
    expect(getMenuItemBySelector(quickSearchSelector)).toBeNull();
    expect(getMenuItemBySelector(createAlertSelector)).toBeNull();
    expect(getMenuItemBySelector(favoriteIndicatorsSelector)).toBeNull();
    expect(getMenuItemBySelector(sidebarWatchlistSelector)).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector(sidebarAlertsSelector)).toBeNull();
    expect(getMenuItemBySelector(sidebarChatsSelector)).toBeNull();
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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();
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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();
    const avatarClick = new MouseEvent("click", { bubbles: true, cancelable: true });

    expect(getMainMenuButton().dispatchEvent(avatarClick)).toBe(true);

    disposeTradingViewAvatarOverride();
  });

  it("keeps non-logout menu rows visible when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-private.png",
        hasPrivateAccess: true,
      }),
    );
    renderTradingViewPage();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getMenuItemBySelector(desktopPublishSelector)).toBeNull();
    expect(getMenuItemBySelector(mobilePublishWrapperSelector)).toBeNull();
    expect(getMenuItemBySelector(quickSearchSelector)).toBeNull();
    expect(getMenuItemBySelector(createAlertSelector)).toBeNull();
    expect(getMenuItemBySelector(favoriteIndicatorsSelector)).toBeNull();
    expect(getMenuItemBySelector(helpCenterMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(supportRequestsMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(whatsNewMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(keyboardShortcutsMenuItemSelector)).toBeNull();
    expect(getMenuItemBySelector(getDesktopAppMenuItemSelector)).toBeNull();
    expect(getMenuItemByTextPrefix("Language")).toBeNull();
    expect(getHomeMenuItem().href).toBe("https://google.com/");
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Logout");

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
  });

  it("removes only the restricted Recently used sections on desktop", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-recent-desktop.png",
        hasPrivateAccess: false,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createTradingViewRecentMenusMarkup()}`;

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
  });

  it("keeps the Recently used sections when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-recent-private.png",
        hasPrivateAccess: true,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createTradingViewRecentMenusMarkup()}`;

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
  });

  it("disables favorite buttons and removes their tooltip in restricted mode", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-favorite-restricted.png",
        hasPrivateAccess: false,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createFavoriteButtonsMarkup()}`;

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
  });

  it("keeps favorite buttons interactive when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-favorite-private.png",
        hasPrivateAccess: true,
      }),
    );
    document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createFavoriteButtonsMarkup()}`;

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getDialogInput(createDialogSelector).value).toBe("");
    expect(getDialogInput(renameDialogSelector).value).toBe("");
    expect(getDialogInput(saveIndicatorTemplateDialogSelector).value).toBe("");
    expect(getDialogSaveButton(createDialogSelector).disabled).toBe(true);
    expect(getDialogSaveButton(renameDialogSelector).disabled).toBe(true);
    expect(getDialogSaveButton(saveIndicatorTemplateDialogSelector).disabled).toBe(true);
    expect(getVisibleIndicatorTemplateTitles()).toEqual([]);

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(
      getVisibleIndicatorTemplateTitlesWithin(
        mobileIndicatorTemplatesMyTemplatesDialogSelector,
      ),
    ).toEqual(["50975 alpha", "50975 beta", "50975 gamma"]);

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getLayoutsSearchInput().value).toBe("50975");
    expect(getLayoutsSearchInput().readOnly).toBe(true);
    expect(getLayoutsSearchInput().getAttribute("aria-readonly")).toBe("true");
    expect(getLayoutsClearButton().hidden).toBe(true);
    expect(getLayoutsClearButton().getAttribute("aria-hidden")).toBe("true");
    expect(getLayoutsClearButton().style.display).toBe("none");

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getLayoutsSearchInput().value).toBe("50975");
    expect(getLayoutsSearchInput().readOnly).toBe(true);
    expect(getLayoutsSearchInput().getAttribute("aria-readonly")).toBe("true");
    expect(getLayoutsClearButton().hidden).toBe(true);
    expect(getLayoutsClearButton().style.pointerEvents).toBe("none");

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
  });

  it("uses a generated fallback avatar when the user has no avatar URL", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: null,
        username: "ongkaytrade",
      }),
    );
    document.body.innerHTML = createTradingViewHeaderMarkup();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getMainAvatarImage().src.startsWith("data:image/svg+xml;charset=UTF-8,")).toBe(
      true,
    );
    expect(getMainAvatarImage().alt).toBe("O");

    disposeTradingViewAvatarOverride();
  });

  it("keeps the initial restricted rules for the current page session", async () => {
    const { emitStorageChange } = installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-b.png",
        hasPrivateAccess: false,
      }),
    );
    renderTradingViewPage();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

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

    disposeTradingViewAvatarOverride();
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
