export const mainMenuButtonSelector = 'button[data-qa-id="main-menu-button"]';
export const mainAvatarImageSelector = `${mainMenuButtonSelector} img`;
export const mainAvatarBadgeSelector = `${mainMenuButtonSelector} + span`;
export const tvShellStateAttributeName = "data-asset-manager-tv-shell";
export const tvShellBootstrapStyleElementId = "asset-manager-tv-shell-style";
export const desktopPopupMenuSelector = '[data-qa-id="popup-menu-container"][role="treegrid"]';
export const mobilePopupMenuSelector = '[data-qa-id="overlap-manager-root"] .container-U2jIw4km';
export const desktopProfileMenuItemSelector = '[data-qa-id="main-menu-user-menu-item"][data-role="menuitem"]';
export const profileMenuImageSelector = "img.profileItem-U2jIw4km";
export const homeMenuItemSelector = 'a[aria-label="Home"][data-role="menuitem"]';
export const logoutMenuItemSelector = '[data-qa-id="main-menu-sign-out-item"][data-role="menuitem"]';

export const desktopPublishSelector = "#header-toolbar-publish-desktop";
export const mobilePublishSelector = "#header-toolbar-publish-mobile";
export const mobilePublishWrapperSelector = ".mobilePublish-OhqNVIYA";
export const desktopTradeSelector = "#header-toolbar-trade-desktop";
export const quickSearchSelector = "#header-toolbar-quick-search";
export const createAlertSelector = "#header-toolbar-alerts";
export const favoriteIndicatorsSelector =
  '#header-toolbar-indicators button[data-name="show-favorite-indicators"]';
export const sidebarAlertsSelector = 'button[data-name="alerts"]';
export const sidebarChatsSelector = 'button[data-name="union_chats"]';
export const sidebarProductsSelector = 'button[data-qa-id="products-button"]';
export const sidebarHelpSelector = 'button[data-name="help-button"]';
export const presetMenuFavoriteButtonSelector = 'button[data-qa-id="preset-menu-favorite-button"]';
export const presetMenuFavoriteIconSelector =
  'span.favorite-_FRQhM5Y[aria-label="Add to favorites"], span.favorite-_FRQhM5Y[aria-label="Remove from favorites"]';

export const createDialogSelector = '.wrap-B02UUUN3[data-name="create-dialog"]';
export const renameDialogSelector = '[data-name="rename-dialog"]';
export const saveIndicatorTemplateDialogSelector =
  '[data-dialog-name="Save indicator template"][data-name="save-rename-dialog"]';
export const dialogInputSelector = '[data-qa-id="ui-lib-Input-input"]';
export const dialogSelectButtonSelector = ".inner-slot-W53jtLjw.interactive-W53jtLjw button.button-PYEOTd6i";
export const dialogSuggestionsSelector = ".suggestions-uszkUMOz";
export const dialogSaveButtonSelector = 'button[data-qa-id="save-btn"], button[data-qa-id="submit-button"]';
export const alertsCreateEditDialogSelector = '[data-qa-id="alerts-create-edit-dialog"]';
export const alertPresetsButtonSelector = 'button[data-qa-id="header-alert-presets-menu-button"]';
export const alertNotificationsButtonSelector = 'button[data-qa-id="alert-notifications-button"]';
export const alertSubmitButtonSelector = 'button[data-qa-id="submit"]';

export const indicatorTemplatesDialogRootSelector = '[role="dialog"], .wrapper-b8SxMnzX, .dialog-b8SxMnzX';
export const indicatorTemplatesDialogSelector =
  '.wrapper-b8SxMnzX[data-name="indicator-templates-dialog"][data-dialog-name="Indicator templates"]';
export const indicatorTemplatesMyTemplatesDialogSelector =
  '.wrapper-b8SxMnzX[data-name="indicator-templates-dialog"][data-dialog-name="My templates"]';
export const indicatorTemplatesTabSelector =
  'button[role="tab"][id="my templates"], button[role="tab"][id="technicals"], button[role="tab"][id="financials"]';
export const indicatorTemplatesMyTemplatesTabSelector = 'button[role="tab"][id="my templates"]';
export const indicatorTemplatesRestrictedTabSelector =
  'button[role="tab"][id="technicals"], button[role="tab"][id="financials"]';
export const indicatorTemplatesSearchInputSelector = 'input[role="searchbox"]';
export const indicatorTemplatesRowSelector = 'div[data-role="list-item"][data-title]';
export const restrictedNavigationButtonOverlaySelector = '[data-asset-manager-restricted-tab-overlay="true"]';

export const saveLoadMenuButtonSelector = 'button[data-name="save-load-menu"]';
export const indicatorTemplatesButtonSelector = 'button[aria-label="Indicator templates"]';
export const watchlistsButtonSelector = 'button[data-name="watchlists-button"]';
export const contextMenuRootSelector = ".context-menu.menuWrap-XktvVkFF";
export const templatesMenuRootSelector = '[data-qa-id="templates-menu"]';
export const popupTemplateMenuRootSelector = '.menuWrap-XktvVkFF[data-qa-id="popup-menu-container"]';
export const seriesThemeTemplateActionSelector =
  '[data-name="series-theme-manager-apply-defaults"], [data-name="series-theme-manager-save-as"]';
export const popupTemplateThemeItemSelector = "[data-series-theme-item-theme-name]";
export const drawingTemplatesMenuSelector = 'div[data-qa-id="menu-inner"].menuBox-XktvVkFF';
export const drawingTemplatesMenuRowSelector = "tbody > tr";
export const drawingTemplateMenuItemSelector = 'tr[data-role="menuitem"]';
export const drawingTemplateLabelSelector = 'span[data-label="true"]';
export const drawingTemplateRemoveButtonSelector = '[data-name="remove-button"], [aria-label="Remove"]';
export const drawingTemplateSpacerRowSelector = "tr.subMenu-GJX1EXhk";
export const popupTemplateMenuItemSelector = '.item-BOZdoKo9[class*="defaultsButtonItem-"]';
export const popupTemplateMenuLabelSelector = ".label-BOZdoKo9";

export const layoutsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="load-layout-dialog"][data-dialog-name="Layouts"]';
export const layoutsSearchInputSelector = 'input[role="searchbox"]';
export const layoutsSearchClearButtonSelector = 'button[aria-label="Clear"]';

export const watchlistsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="Watchlists"]';
export const myWatchlistsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="My watchlists"]';
export const searchWatchlistsDialogSelector =
  '.wrapper-b8SxMnzX[data-name="watchlists-dialog"][data-dialog-name="Search"]';
export const watchlistsSearchInputSelector = 'input[role="searchbox"][placeholder="Search lists"]';
export const desktopMyWatchlistsTabSelector = 'button[role="tab"]#my-watch-lists';
export const desktopHotlistsTabSelector = 'button[role="tab"]#hot-lists';
export const watchlistsRowSelector = 'div[data-role="list-item"][data-title]';
export const watchlistsSectionContainerSelector = ".container-UmsFKpIc";
export const watchlistsSectionTitleSelector = ".title-RvmSCAQq";
export const desktopWatchlistActiveTitleSelector = ".headerMenuContent-mQBvegEO .titleRow-mQBvegEO";
export const desktopWatchlistSymbolTreeSelector = ".watchlist-__KRxuOy .tree-MgF6KBas";
export const desktopWatchlistSymbolRowSelector = ".watchlist-__KRxuOy .tree-MgF6KBas .wrap-IEe5qpW4";
export const desktopWatchlistRemoveButtonSelector = ".removeButton-RsFlttSS";
export const desktopActiveWatchlistMenuSelector = 'div.menuBox-XktvVkFF[data-qa-id="menu-inner"]';
export const mobileActiveWatchlistMenuSelector = '[data-name="active-watchlist-menu"]';
export const activeWatchlistMenuItemSelector = '[data-role="menuitem"]';
export const watchlistAddSymbolButtonSelector = 'button[data-name="add-symbol-button"]';
export const watchlistAdvancedViewButtonSelector = 'button[data-name="advanced-view-button"]';
export const createLimitOrderButtonSelector = '[data-name="createLimitOrder"][data-role="button"]';
export const mobileWatchlistDialogSelector = '[data-name="watchlist-dialog"]';
export const mobileWatchlistSymbolDrawerSelector = ".drawer-GQU5HVYO.positionBottom-GQU5HVYO";
export const mobileWatchlistSymbolDrawerItemSelector = "li.item-WJDah4zD";
export const mobileWatchlistSymbolDrawerSeparatorSelector = "li.separator-Ymxd0dt_";
export const mobileWatchlistSymbolDrawerColorMenuItemSelector = 'label[role="menuitem"][aria-label^="Set "]';
export const headerToolbarLayoutsButtonSelector = "#header-toolbar-layouts";

export const recentTitleListItemSelector = '[data-qa-id="ui-lib-title-list-item"]';
export const recentLayoutMenuItemSelector = '[data-qa-id="save-load-menu-item-recent"]';
export const recentIndicatorMenuItemSelector = '[data-group-name="recent"]';
export const menuDividerSelector = '.menu-divider-YZ5qU_gy[role="separator"]';
export const watchlistsRecentTitleSelector =
  '.columnsTitle-mQBvegEO.title-GlrQ9d9L, [data-qa-id="ui-lib-title-list-item"]';
export const watchlistsSeparatorSelector = '.separator-UZn6u4sU[role="separator"]';
export const restrictedTvChartPathPrefix = "/chart/";
export const restrictedTvDefaultChartPath = "/chart/ceqTNBkY/";
export const restrictedTvDefaultChartUrl = `https://www.tradingview.com${restrictedTvDefaultChartPath}`;
export const restrictedTvLayoutOwnerContainerSelector = `${headerToolbarLayoutsButtonSelector} + .wrap-n5bmFxyX`;
export const restrictedTvLayoutOwnerTextSelector = `${restrictedTvLayoutOwnerContainerSelector} span.text-Uy_he976`;
export const restrictedTvRouteGuardRetryDelayMs = 150;
export const restrictedTvRouteGuardPendingTimeoutMs = 1500;
export const tvShellHiddenOnPendingAndRestrictedSelectors = [
  desktopPublishSelector,
  mobilePublishWrapperSelector,
  desktopTradeSelector,
  quickSearchSelector,
  createAlertSelector,
  favoriteIndicatorsSelector,
  sidebarAlertsSelector,
  sidebarChatsSelector,
].join(", ");

export const restrictedMenuLabels = [
  "Help Center",
  "What's new",
  "Keyboard shortcuts",
  "Get desktop app",
] as const;

export const restrictedMenuPrefixes = ["Support request", "Language"] as const;

export const restrictedNavigationAccessDeniedMessage =
  "Access denied, silahkan beli akun full private untuk akses fitur ini!!";
export const restrictedActiveWatchlistMenuMessage = "watchlist bukan milik anda";
export const restrictedHorizontalLineContextMenuLabelPrefix = "Draw horizontal line at ";
export const restrictedHorizontalLineContextMenuAlertLabelPrefix = "Add alert on ";
export const restrictedHorizontalLineContextMenuTradeActionPrefix = "trade-";
export const googleHomeUrl = "https://google.com";
export const logoutRedirectDelayMs = 250;

export const tvRelevantMutationSelectors = [
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
  alertsCreateEditDialogSelector,
  alertPresetsButtonSelector,
  alertNotificationsButtonSelector,
  alertSubmitButtonSelector,
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
  popupTemplateMenuRootSelector,
  seriesThemeTemplateActionSelector,
  popupTemplateThemeItemSelector,
  drawingTemplatesMenuSelector,
  drawingTemplatesMenuRowSelector,
  drawingTemplateMenuItemSelector,
  drawingTemplateLabelSelector,
  drawingTemplateRemoveButtonSelector,
  drawingTemplateSpacerRowSelector,
  popupTemplateMenuItemSelector,
  popupTemplateMenuLabelSelector,
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
  desktopWatchlistActiveTitleSelector,
  desktopWatchlistSymbolTreeSelector,
  desktopWatchlistSymbolRowSelector,
  desktopWatchlistRemoveButtonSelector,
  desktopActiveWatchlistMenuSelector,
  mobileActiveWatchlistMenuSelector,
  activeWatchlistMenuItemSelector,
  watchlistAddSymbolButtonSelector,
  watchlistAdvancedViewButtonSelector,
  createLimitOrderButtonSelector,
  mobileWatchlistDialogSelector,
  mobileWatchlistSymbolDrawerSelector,
  mobileWatchlistSymbolDrawerItemSelector,
  mobileWatchlistSymbolDrawerSeparatorSelector,
  mobileWatchlistSymbolDrawerColorMenuItemSelector,
  recentTitleListItemSelector,
  recentLayoutMenuItemSelector,
  recentIndicatorMenuItemSelector,
  menuDividerSelector,
  watchlistsRecentTitleSelector,
  watchlistsSeparatorSelector,
  headerToolbarLayoutsButtonSelector,
  restrictedTvLayoutOwnerTextSelector,
].join(", ");
