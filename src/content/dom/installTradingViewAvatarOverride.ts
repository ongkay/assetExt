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

const restrictedMenuLabels = [
  "Help Center",
  "What's new",
  "Keyboard shortcuts",
  "Get desktop app",
] as const;
const restrictedMenuPrefixes = ["Support request", "Language"] as const;

const googleHomeUrl = "https://google.com";
const logoutRedirectDelayMs = 250;
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
].join(", ");

type TradingViewMenuMode = "default" | "restricted";
type TradingViewMenuVariant = "desktop" | "mobile";

type TradingViewOverrideState = {
  avatarAlt: string | null;
  avatarSrc: string | null;
  menuMode: TradingViewMenuMode;
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

function disableButton(button: Element | null) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.disabled = true;
  button.setAttribute("aria-disabled", "true");
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
