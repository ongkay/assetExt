import type { BootstrapCacheRecord } from '@/lib/storage/bootstrapCache';

import {
  desktopPopupMenuSelector,
  mobilePopupMenuSelector,
  desktopPublishSelector,
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
  mainAvatarImageSelector,
  mainAvatarBadgeSelector,
  mobilePublishSelector,
  mobilePublishWrapperSelector,
  recentLayoutMenuItemSelector,
  recentIndicatorMenuItemSelector,
  recentTitleListItemSelector,
  watchlistsRecentTitleSelector,
  watchlistsSeparatorSelector,
  menuDividerSelector,
  desktopActiveWatchlistMenuSelector,
  mobileActiveWatchlistMenuSelector,
  activeWatchlistMenuItemSelector,
  logoutMenuItemSelector,
  homeMenuItemSelector,
  desktopProfileMenuItemSelector,
  profileMenuImageSelector,
  restrictedMenuLabels,
  restrictedMenuPrefixes,
  googleHomeUrl,
  tvShellBootstrapStyleElementId,
  tvShellHiddenOnPendingAndRestrictedSelectors,
  tvShellStateAttributeName,
  tvRelevantMutationSelectors,
} from './tvSelectors';
import type { TvLogoutStatus, TvOverrideState } from './tvTypes';
import {
  disableButton,
  disableFavoriteButton,
  disableFavoriteIcon,
  escapeHtml,
  getMenuItemContainer,
  hidePersistentElement,
  normalizeText,
} from './tvDomUtils';

type TvShellBootstrapState = 'pending' | 'default' | 'restricted';

export function installTvShellBootstrapState() {
  ensureTvShellBootstrapStyle();
  setTvShellBootstrapState('pending');
}

export function syncTvShellBootstrapState(overrideState: TvOverrideState | null) {
  setTvShellBootstrapState(overrideState?.menuMode ?? 'pending');
}

export function cleanupTvShellBootstrapState() {
  document.documentElement.removeAttribute(tvShellStateAttributeName);
  document.getElementById(tvShellBootstrapStyleElementId)?.remove();
}

export function syncTvMainAvatar(overrideState: TvOverrideState | null) {
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

export function hideTvMainAvatarBadge() {
  const avatarBadge = document.querySelector(mainAvatarBadgeSelector);

  if (avatarBadge instanceof HTMLElement) {
    hidePersistentElement(avatarBadge);
  }
}

export function syncRestrictedTvShell() {
  hideRestrictedHeaderActions();
  hideRestrictedRightSidebarActions();
  disableRestrictedRightSidebarActions();
  disableRestrictedFavoriteButtons();
  removeRestrictedRecentSections();
}

export function findOpenTvMenu() {
  const desktopMenu = document.querySelector(desktopPopupMenuSelector);

  if (desktopMenu instanceof HTMLElement) {
    return desktopMenu;
  }

  const mobileMenu = document.querySelector(mobilePopupMenuSelector);

  return mobileMenu instanceof HTMLElement ? mobileMenu : null;
}

export function hideTvMenuUntilStateIsReady(popupMenu: HTMLElement) {
  popupMenu.style.visibility = 'hidden';
  popupMenu.style.pointerEvents = 'none';
}

export function syncOpenTvPopupMenu(options: {
  overrideState: TvOverrideState | null;
  logoutStatus: TvLogoutStatus;
  onLogoutClick: (event: Event) => void;
}) {
  const openMenu = findOpenTvMenu();

  if (!openMenu) {
    return;
  }

  patchLogoutMenuItem(
    openMenu.querySelector(logoutMenuItemSelector) as HTMLElement | null,
    options.logoutStatus,
    options.onLogoutClick,
  );

  showReadyMenu(openMenu);

  if (options.overrideState?.menuMode !== 'restricted') {
    return;
  }

  removeRestrictedPopupMenuItems(openMenu);
  patchRestrictedHomeMenuItem(openMenu.querySelector(homeMenuItemSelector) as HTMLAnchorElement | null);
}

export function isRelevantTvMutation(mutation: MutationRecord) {
  if (mutation.type === 'attributes') {
    return mutation.target instanceof Element && mutation.target.matches(mainAvatarImageSelector);
  }

  return [...mutation.addedNodes, ...mutation.removedNodes].some(isRelevantTvNode);
}

export function createTvOverrideState(
  bootstrapCacheRecord: BootstrapCacheRecord | null,
): TvOverrideState {
  const user = bootstrapCacheRecord?.snapshot.user;
  const tradingViewAsset = bootstrapCacheRecord?.snapshot.assets?.find(
    (assetSummary) => assetSummary.platform === 'tradingview',
  );

  return {
    avatarAlt: user ? getAvatarLabel(user.username, user.email, user.publicId) : null,
    avatarSrc: user
      ? getAvatarSource(user.avatarUrl, user.publicId, user.username, user.email)
      : null,
    menuMode: tradingViewAsset?.hasPrivateAccess === true ? 'default' : 'restricted',
    publicId: user?.publicId?.trim() || null,
  };
}

function hideRestrictedHeaderActions() {
  hidePersistentElement(document.querySelector(desktopPublishSelector));
  hidePersistentElement(findMobilePublishWrapper());
  hidePersistentElement(document.querySelector(desktopTradeSelector));
  hidePersistentElement(document.querySelector(quickSearchSelector));
  hidePersistentElement(document.querySelector(createAlertSelector));
  hidePersistentElement(document.querySelector(favoriteIndicatorsSelector));
}

function hideRestrictedRightSidebarActions() {
  hidePersistentElement(document.querySelector(sidebarAlertsSelector));
  hidePersistentElement(document.querySelector(sidebarChatsSelector));
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
  removeRecentRowgroupSections(recentLayoutMenuItemSelector);
  removeRecentRowgroupSections(recentIndicatorMenuItemSelector);
  removeRestrictedRecentWatchlistsSection();
}

function removeRestrictedRecentWatchlistsSection() {
  const watchlistsMenuRoots = findRestrictedRecentWatchlistsMenuRoots();

  for (const watchlistsMenuRoot of watchlistsMenuRoots) {
    const menuContentRoot = findWatchlistsMenuContentRoot(watchlistsMenuRoot);
    const recentSectionRoot = findWatchlistsRecentSectionRoot(menuContentRoot);

    if (!(recentSectionRoot instanceof HTMLElement)) {
      continue;
    }

    removeRecentWatchlistsSeparator(recentSectionRoot.previousElementSibling);
    recentSectionRoot.remove();
  }
}

function findRestrictedRecentWatchlistsMenuRoots() {
  const menuRoots = new Set<HTMLElement>();

  for (const selector of [desktopActiveWatchlistMenuSelector, mobileActiveWatchlistMenuSelector]) {
    const matchedMenuRoots = document.querySelectorAll(selector);

    for (const matchedMenuRoot of matchedMenuRoots) {
      if (!(matchedMenuRoot instanceof HTMLElement) || !isRestrictedRecentWatchlistsMenuRoot(matchedMenuRoot)) {
        continue;
      }

      menuRoots.add(matchedMenuRoot);
    }
  }

  return [...menuRoots];
}

function isRestrictedRecentWatchlistsMenuRoot(menuRoot: HTMLElement) {
  return ['Create new list', 'Upload list', 'Open list'].every((labelPrefix) =>
    Boolean(findActiveWatchlistsMenuItemByTextPrefix(menuRoot, labelPrefix)),
  );
}

function findActiveWatchlistsMenuItemByTextPrefix(menuRoot: HTMLElement, labelPrefix: string) {
  return (
    [...menuRoot.querySelectorAll(activeWatchlistMenuItemSelector)].find((menuItem) => {
      if (!(menuItem instanceof HTMLElement)) {
        return false;
      }

      return normalizeText(menuItem.textContent).startsWith(labelPrefix);
    }) ?? null
  );
}

function findWatchlistsMenuContentRoot(menuRoot: HTMLElement) {
  for (const childElement of menuRoot.children) {
    if (!(childElement instanceof HTMLElement)) {
      continue;
    }

    if (childElement.classList.contains('newView-mQBvegEO')) {
      return childElement;
    }

    for (const nestedChild of childElement.children) {
      if (nestedChild instanceof HTMLElement && nestedChild.classList.contains('newView-mQBvegEO')) {
        return nestedChild;
      }
    }
  }

  return menuRoot;
}

function findWatchlistsRecentSectionRoot(menuContentRoot: HTMLElement) {
  for (const childElement of menuContentRoot.children) {
    if (!(childElement instanceof HTMLElement)) {
      continue;
    }

    const recentTitleNode = childElement.querySelector(watchlistsRecentTitleSelector);

    if (
      recentTitleNode instanceof HTMLElement &&
      normalizeText(recentTitleNode.textContent) === 'Recently used'
    ) {
      return childElement;
    }
  }

  return null;
}

function removeRecentWatchlistsSeparator(separatorCandidate: Element | null) {
  if (!(separatorCandidate instanceof HTMLElement)) {
    return;
  }

  if (
    separatorCandidate.matches(watchlistsSeparatorSelector) ||
    separatorCandidate.matches(menuDividerSelector)
  ) {
    separatorCandidate.remove();
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

  return normalizeText(titleListItem.textContent) === 'Recently used';
}

function showReadyMenu(popupMenu: HTMLElement) {
  popupMenu.style.visibility = '';
  popupMenu.style.pointerEvents = '';
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
  homeMenuItem.target = '_blank';
  homeMenuItem.rel = 'noopener noreferrer';
}

function patchLogoutMenuItem(
  logoutMenuItem: HTMLElement | null,
  logoutStatus: TvLogoutStatus,
  onLogoutClick: (event: Event) => void,
) {
  if (!(logoutMenuItem instanceof HTMLElement)) {
    return;
  }

  const logoutLabel = getLogoutLabel(logoutStatus);

  logoutMenuItem.setAttribute('aria-disabled', logoutStatus === 'loading' ? 'true' : 'false');
  logoutMenuItem.setAttribute('aria-label', logoutLabel);
  updateMenuItemText(logoutMenuItem, logoutLabel);

  if (logoutMenuItem.dataset.assetManagerLogoutPatched === 'true') {
    return;
  }

  logoutMenuItem.dataset.assetManagerLogoutPatched = 'true';
  logoutMenuItem.addEventListener('click', onLogoutClick);
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

function findProfileMenuItem(popupMenu: HTMLElement) {
  const desktopProfileMenuItem = popupMenu.querySelector(desktopProfileMenuItemSelector);

  if (desktopProfileMenuItem instanceof HTMLElement) {
    return desktopProfileMenuItem;
  }

  return (
    getPopupMenuItems(popupMenu).find((menuItem) => Boolean(menuItem.querySelector(profileMenuImageSelector))) ??
    null
  );
}

function findMenuItemByAriaLabel(popupMenu: HTMLElement, ariaLabel: string) {
  return (
    getPopupMenuItems(popupMenu).find((menuItem) => menuItem.getAttribute('aria-label') === ariaLabel) ??
    null
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

function updateMenuItemText(menuItem: HTMLElement, label: string) {
  const gridCell = menuItem.querySelector('[role="gridcell"]');

  if (gridCell instanceof HTMLElement) {
    gridCell.textContent = label;
    return;
  }

  menuItem.textContent = label;
}

function getLogoutLabel(logoutStatus: TvLogoutStatus) {
  if (logoutStatus === 'loading') {
    return 'Loading...';
  }

  if (logoutStatus === 'success') {
    return 'Success';
  }

  if (logoutStatus === 'error') {
    return 'Logout failed';
  }

  return 'Logout';
}

function isRelevantTvNode(node: Node) {
  if (!(node instanceof Element)) {
    return false;
  }

  return node.matches(tvRelevantMutationSelectors) || Boolean(node.querySelector(tvRelevantMutationSelectors));
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
    labelCandidates.find((candidate) => Boolean(candidate?.trim()))?.trim() ?? 'A';

  return labelSource.charAt(0).toUpperCase();
}

function createFallbackAvatarUrl(seed: string, label: string) {
  const backgroundColor = getAvatarColor(seed);
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="${backgroundColor}"/><text x="24" y="24" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700">${escapeHtml(label)}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;
}

function getAvatarColor(seed: string) {
  const palette = [
    '#2563eb',
    '#7c3aed',
    '#db2777',
    '#ea580c',
    '#059669',
    '#0891b2',
    '#ca8a04',
    '#4f46e5',
  ];
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return palette[hash % palette.length];
}

function ensureTvShellBootstrapStyle() {
  if (document.getElementById(tvShellBootstrapStyleElementId)) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = tvShellBootstrapStyleElementId;
  styleElement.textContent = createTvShellBootstrapStyleText();

  (document.head ?? document.documentElement).append(styleElement);
}

function setTvShellBootstrapState(nextState: TvShellBootstrapState) {
  document.documentElement.setAttribute(tvShellStateAttributeName, nextState);
}

function createTvShellBootstrapStyleText() {
  return [
    `html[${tvShellStateAttributeName}] ${mainAvatarBadgeSelector} { display: none !important; pointer-events: none !important; }`,
    `html[${tvShellStateAttributeName}="pending"] ${mainAvatarImageSelector} { visibility: hidden !important; }`,
    `html[${tvShellStateAttributeName}="pending"] ${tvShellHiddenOnPendingAndRestrictedSelectors}, html[${tvShellStateAttributeName}="restricted"] ${tvShellHiddenOnPendingAndRestrictedSelectors} { display: none !important; pointer-events: none !important; }`,
  ].join('\n');
}
