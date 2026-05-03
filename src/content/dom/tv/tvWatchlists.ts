import {
  activeWatchlistMenuItemSelector,
  createLimitOrderButtonSelector,
  desktopActiveWatchlistMenuSelector,
  desktopHotlistsTabSelector,
  desktopMyWatchlistsTabSelector,
  desktopWatchlistActiveTitleSelector,
  desktopWatchlistRemoveButtonSelector,
  desktopWatchlistSymbolRowSelector,
  desktopWatchlistSymbolTreeSelector,
  mobileActiveWatchlistMenuSelector,
  mobileWatchlistSymbolDrawerColorMenuItemSelector,
  mobileWatchlistSymbolDrawerItemSelector,
  mobileWatchlistSymbolDrawerSelector,
  mobileWatchlistSymbolDrawerSeparatorSelector,
  myWatchlistsDialogSelector,
  restrictedActiveWatchlistMenuMessage,
  searchWatchlistsDialogSelector,
  watchlistAddSymbolButtonSelector,
  watchlistAdvancedViewButtonSelector,
  watchlistsDialogSelector,
  watchlistsRowSelector,
  watchlistsSearchInputSelector,
  watchlistsSectionContainerSelector,
  watchlistsSectionTitleSelector,
} from './tvSelectors';
import {
  disableRestrictedNavigationButtons,
  findButtonByNormalizedText,
  isTvMobileLayout,
  normalizeText,
  syncRestrictedListRowVisibility,
} from './tvDomUtils';

type RestrictedActiveWatchlistState = {
  activeWatchlistTitle: string;
  isOwnedWatchlist: boolean;
  requiredPublicId: string;
  shouldRestrictForeignWatchlist: boolean;
};

export function syncRestrictedTvWatchlists(publicId: string | null) {
  syncRestrictedDesktopWatchlistSymbols(publicId);
  syncRestrictedWatchlistAddSymbolButtons(publicId);
  syncRestrictedWatchlistAdvancedViewButtons();
  syncRestrictedCreateLimitOrderButtons();
  syncRestrictedMobileWatchlistSymbolDrawers(publicId);
  syncRestrictedActiveWatchlistMenus(publicId);
  syncRestrictedWatchlistsDialogs(publicId);
}

function getRestrictedActiveWatchlistState(publicId: string | null): RestrictedActiveWatchlistState {
  const activeWatchlistTitle = normalizeText(
    document.querySelector(desktopWatchlistActiveTitleSelector)?.textContent,
  );
  const requiredPublicId = publicId?.trim() ?? '';
  const isOwnedWatchlist =
    activeWatchlistTitle.length > 0 &&
    requiredPublicId.length > 0 &&
    activeWatchlistTitle.includes(requiredPublicId);

  return {
    activeWatchlistTitle,
    isOwnedWatchlist,
    requiredPublicId,
    shouldRestrictForeignWatchlist:
      activeWatchlistTitle.length > 0 &&
      (requiredPublicId.length === 0 || !activeWatchlistTitle.includes(requiredPublicId)),
  };
}

function syncRestrictedDesktopWatchlistSymbols(publicId: string | null) {
  if (isTvMobileLayout()) {
    return;
  }

  const symbolTree = document.querySelector(desktopWatchlistSymbolTreeSelector);

  if (!(symbolTree instanceof HTMLElement)) {
    return;
  }

  const { shouldRestrictForeignWatchlist } = getRestrictedActiveWatchlistState(publicId);
  const symbolRows = symbolTree.querySelectorAll(desktopWatchlistSymbolRowSelector);

  for (const symbolRow of symbolRows) {
    if (!(symbolRow instanceof HTMLDivElement)) {
      continue;
    }

    syncRestrictedDesktopWatchlistSymbolRow(symbolRow, shouldRestrictForeignWatchlist);
  }
}

function syncRestrictedDesktopWatchlistSymbolRow(
  symbolRow: HTMLDivElement,
  shouldRestrictSymbolRow: boolean,
) {
  preserveDesktopWatchlistRowState(symbolRow);
  bindRestrictedDesktopWatchlistRow(symbolRow);

  symbolRow.dataset.assetManagerWatchlistRestricted = shouldRestrictSymbolRow ? 'true' : 'false';
  symbolRow.dataset.assetManagerWatchlistContextMenuRestricted = 'true';
  symbolRow.setAttribute(
    'draggable',
    shouldRestrictSymbolRow ? 'false' : symbolRow.dataset.assetManagerOriginalDraggable || 'true',
  );

  const removeButton = symbolRow.querySelector(desktopWatchlistRemoveButtonSelector);

  if (removeButton instanceof HTMLSpanElement) {
    syncRestrictedDesktopWatchlistRemoveButton(removeButton, shouldRestrictSymbolRow);
  }
}

function preserveDesktopWatchlistRowState(symbolRow: HTMLDivElement) {
  if (symbolRow.dataset.assetManagerOriginalDraggable === undefined) {
    symbolRow.dataset.assetManagerOriginalDraggable = symbolRow.getAttribute('draggable') || '';
  }
}

function bindRestrictedDesktopWatchlistRow(symbolRow: HTMLDivElement) {
  if (symbolRow.dataset.assetManagerWatchlistBound === 'true') {
    return;
  }

  symbolRow.dataset.assetManagerWatchlistBound = 'true';
  symbolRow.addEventListener('dragstart', handleRestrictedDesktopWatchlistDragEvent, true);
  symbolRow.addEventListener('dragover', handleRestrictedDesktopWatchlistDragEvent, true);
  symbolRow.addEventListener('drop', handleRestrictedDesktopWatchlistDragEvent, true);
  symbolRow.addEventListener('contextmenu', handleRestrictedDesktopWatchlistContextMenu, true);
}

function handleRestrictedDesktopWatchlistDragEvent(event: Event) {
  const symbolRow = event.currentTarget;

  if (!(symbolRow instanceof HTMLDivElement)) {
    return;
  }

  if (symbolRow.dataset.assetManagerWatchlistRestricted !== 'true') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function handleRestrictedDesktopWatchlistContextMenu(event: MouseEvent) {
  const symbolRow = event.currentTarget;

  if (!(symbolRow instanceof HTMLDivElement)) {
    return;
  }

  if (symbolRow.dataset.assetManagerWatchlistContextMenuRestricted !== 'true') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function syncRestrictedDesktopWatchlistRemoveButton(
  removeButton: HTMLSpanElement,
  shouldRestrictRemoveButton: boolean,
) {
  bindRestrictedDesktopWatchlistRemoveButton(removeButton);
  removeButton.dataset.assetManagerWatchlistRestricted = shouldRestrictRemoveButton ? 'true' : 'false';
  removeButton.setAttribute('aria-disabled', shouldRestrictRemoveButton ? 'true' : 'false');
  removeButton.style.opacity = shouldRestrictRemoveButton ? '0.5' : '';
  removeButton.style.cursor = shouldRestrictRemoveButton ? 'not-allowed' : '';
}

function bindRestrictedDesktopWatchlistRemoveButton(removeButton: HTMLSpanElement) {
  if (removeButton.dataset.assetManagerWatchlistBound === 'true') {
    return;
  }

  removeButton.dataset.assetManagerWatchlistBound = 'true';
  removeButton.addEventListener('click', handleRestrictedDesktopWatchlistRemoveButtonEvent, true);
  removeButton.addEventListener(
    'mousedown',
    handleRestrictedDesktopWatchlistRemoveButtonEvent,
    true,
  );
  removeButton.addEventListener(
    'pointerdown',
    handleRestrictedDesktopWatchlistRemoveButtonEvent,
    true,
  );
}

function handleRestrictedDesktopWatchlistRemoveButtonEvent(event: Event) {
  const removeButton = event.currentTarget;

  if (!(removeButton instanceof HTMLSpanElement)) {
    return;
  }

  if (removeButton.dataset.assetManagerWatchlistRestricted !== 'true') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function syncRestrictedWatchlistAddSymbolButtons(publicId: string | null) {
  const { shouldRestrictForeignWatchlist } = getRestrictedActiveWatchlistState(publicId);
  const addSymbolButtons = document.querySelectorAll(watchlistAddSymbolButtonSelector);

  for (const addSymbolButton of addSymbolButtons) {
    if (!(addSymbolButton instanceof HTMLButtonElement)) {
      continue;
    }

    syncRestrictedWatchlistActionButton(addSymbolButton, shouldRestrictForeignWatchlist);
  }
}

function syncRestrictedWatchlistAdvancedViewButtons() {
  const advancedViewButtons = document.querySelectorAll(watchlistAdvancedViewButtonSelector);

  for (const advancedViewButton of advancedViewButtons) {
    if (!(advancedViewButton instanceof HTMLButtonElement)) {
      continue;
    }

    syncRestrictedWatchlistActionButton(advancedViewButton, true);
  }
}

function syncRestrictedCreateLimitOrderButtons() {
  const createLimitOrderButtons = document.querySelectorAll(createLimitOrderButtonSelector);

  for (const createLimitOrderButton of createLimitOrderButtons) {
    if (!(createLimitOrderButton instanceof HTMLElement)) {
      continue;
    }

    disableRestrictedCreateLimitOrderButton(createLimitOrderButton);
  }
}

function disableRestrictedCreateLimitOrderButton(createLimitOrderButton: HTMLElement) {
  preserveRestrictedCreateLimitOrderButtonState(createLimitOrderButton);
  bindRestrictedCreateLimitOrderButton(createLimitOrderButton);

  createLimitOrderButton.dataset.assetManagerCreateLimitOrderRestricted = 'true';
  createLimitOrderButton.setAttribute('aria-disabled', 'true');
  createLimitOrderButton.style.opacity = '0.5';
  createLimitOrderButton.style.cursor = 'not-allowed';
  createLimitOrderButton.tabIndex = -1;
}

function preserveRestrictedCreateLimitOrderButtonState(createLimitOrderButton: HTMLElement) {
  if (createLimitOrderButton.dataset.assetManagerOriginalAriaDisabled === undefined) {
    createLimitOrderButton.dataset.assetManagerOriginalAriaDisabled =
      createLimitOrderButton.getAttribute('aria-disabled') || '';
  }

  if (createLimitOrderButton.dataset.assetManagerOriginalOpacity === undefined) {
    createLimitOrderButton.dataset.assetManagerOriginalOpacity =
      createLimitOrderButton.style.opacity || '';
  }

  if (createLimitOrderButton.dataset.assetManagerOriginalCursor === undefined) {
    createLimitOrderButton.dataset.assetManagerOriginalCursor =
      createLimitOrderButton.style.cursor || '';
  }

  if (createLimitOrderButton.dataset.assetManagerOriginalTabIndex === undefined) {
    createLimitOrderButton.dataset.assetManagerOriginalTabIndex =
      createLimitOrderButton.getAttribute('tabindex') || '';
  }
}

function bindRestrictedCreateLimitOrderButton(createLimitOrderButton: HTMLElement) {
  if (createLimitOrderButton.dataset.assetManagerCreateLimitOrderBound === 'true') {
    return;
  }

  createLimitOrderButton.dataset.assetManagerCreateLimitOrderBound = 'true';

  for (const eventName of ['click', 'mousedown', 'pointerdown']) {
    createLimitOrderButton.addEventListener(
      eventName,
      handleRestrictedCreateLimitOrderButtonPointerEvent,
      true,
    );
  }

  createLimitOrderButton.addEventListener(
    'keydown',
    handleRestrictedCreateLimitOrderButtonKeyDown,
    true,
  );
}

function handleRestrictedCreateLimitOrderButtonPointerEvent(event: Event) {
  const createLimitOrderButton = event.currentTarget;

  if (!(createLimitOrderButton instanceof HTMLElement)) {
    return;
  }

  if (createLimitOrderButton.dataset.assetManagerCreateLimitOrderRestricted !== 'true') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function handleRestrictedCreateLimitOrderButtonKeyDown(event: KeyboardEvent) {
  const createLimitOrderButton = event.currentTarget;

  if (!(createLimitOrderButton instanceof HTMLElement)) {
    return;
  }

  if (createLimitOrderButton.dataset.assetManagerCreateLimitOrderRestricted !== 'true') {
    return;
  }

  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function syncRestrictedWatchlistActionButton(
  actionButton: HTMLButtonElement,
  shouldDisableButton: boolean,
) {
  if (actionButton.dataset.assetManagerOriginalDisabled === undefined) {
    actionButton.dataset.assetManagerOriginalDisabled = actionButton.disabled ? 'true' : 'false';
  }

  if (actionButton.dataset.assetManagerOriginalAriaDisabled === undefined) {
    actionButton.dataset.assetManagerOriginalAriaDisabled =
      actionButton.getAttribute('aria-disabled') || '';
  }

  if (actionButton.dataset.assetManagerOriginalOpacity === undefined) {
    actionButton.dataset.assetManagerOriginalOpacity = actionButton.style.opacity || '';
  }

  if (actionButton.dataset.assetManagerOriginalCursor === undefined) {
    actionButton.dataset.assetManagerOriginalCursor = actionButton.style.cursor || '';
  }

  const originalDisabled = actionButton.dataset.assetManagerOriginalDisabled === 'true';

  actionButton.disabled = shouldDisableButton || originalDisabled;

  if (shouldDisableButton) {
    actionButton.setAttribute('aria-disabled', 'true');
    actionButton.style.opacity = '0.5';
    actionButton.style.cursor = 'not-allowed';
    return;
  }

  if (actionButton.dataset.assetManagerOriginalAriaDisabled === '') {
    actionButton.removeAttribute('aria-disabled');
  } else if (actionButton.dataset.assetManagerOriginalAriaDisabled) {
    actionButton.setAttribute(
      'aria-disabled',
      actionButton.dataset.assetManagerOriginalAriaDisabled,
    );
  }

  actionButton.style.opacity = actionButton.dataset.assetManagerOriginalOpacity || '';
  actionButton.style.cursor = actionButton.dataset.assetManagerOriginalCursor || '';
}

function syncRestrictedMobileWatchlistSymbolDrawers(publicId: string | null) {
  if (!isTvMobileLayout()) {
    return;
  }

  const { isOwnedWatchlist, shouldRestrictForeignWatchlist } =
    getRestrictedActiveWatchlistState(publicId);
  const drawerRoots = findRestrictedMobileWatchlistSymbolDrawerRoots();

  for (const drawerRoot of drawerRoots) {
    syncRestrictedMobileWatchlistSymbolDrawer(
      drawerRoot,
      isOwnedWatchlist,
      shouldRestrictForeignWatchlist,
    );
  }
}

function findRestrictedMobileWatchlistSymbolDrawerRoots() {
  return [...document.querySelectorAll(mobileWatchlistSymbolDrawerSelector)].filter(
    (drawerRoot): drawerRoot is HTMLElement =>
      drawerRoot instanceof HTMLElement && isMobileWatchlistSymbolDrawerRoot(drawerRoot),
  );
}

function isMobileWatchlistSymbolDrawerRoot(drawerRoot: HTMLElement) {
  if (drawerRoot.matches(mobileActiveWatchlistMenuSelector)) {
    return false;
  }

  return ['Symbol details…', 'Add section', 'Add symbol'].every((label) =>
    Boolean(findMobileWatchlistSymbolDrawerItemByText(drawerRoot, label)),
  );
}

function syncRestrictedMobileWatchlistSymbolDrawer(
  drawerRoot: HTMLElement,
  isOwnedWatchlist: boolean,
  shouldRestrictForeignWatchlist: boolean,
) {
  removeMobileWatchlistSymbolDrawerItemByPredicate(drawerRoot, (item) =>
    getIsMobileWatchlistSymbolFlagTitleItem(item),
  );
  removeMobileWatchlistSymbolDrawerItemByPredicate(drawerRoot, (item) =>
    getIsMobileWatchlistSymbolColorMenuItem(item),
  );
  removeMobileWatchlistSymbolDrawerItemByPredicate(
    drawerRoot,
    (item) => normalizeText(item.textContent) === 'Unflag all symbols',
  );
  removeFirstMobileWatchlistSymbolDrawerSeparator(drawerRoot);
  removeMobileWatchlistSymbolDrawerItemByPredicate(drawerRoot, (item) =>
    /^Add .+ to watchlist$/.test(normalizeText(item.textContent)),
  );
  removeMobileWatchlistSymbolDrawerItemByPredicate(drawerRoot, (item) =>
    /^Add .+ to compare$/.test(normalizeText(item.textContent)),
  );
  removeMobileWatchlistSymbolDrawerItemByPredicate(drawerRoot, (item) =>
    /^Open .+ Supercharts$/.test(normalizeText(item.textContent)),
  );
  removeMobileWatchlistSymbolDrawerItemByPredicate(drawerRoot, (item) =>
    /^Add note for /.test(normalizeText(item.textContent)),
  );

  if (isOwnedWatchlist) {
    restoreMobileWatchlistSymbolDrawerItem(drawerRoot, (item) =>
      /^Remove .+ from watchlist$/.test(normalizeText(item.textContent)),
    );
    restoreMobileWatchlistSymbolDrawerItem(
      drawerRoot,
      (item) => normalizeText(item.textContent) === 'Add section',
    );
    return;
  }

  if (!shouldRestrictForeignWatchlist) {
    return;
  }

  disableMobileWatchlistSymbolDrawerItem(drawerRoot, (item) =>
    /^Remove .+ from watchlist$/.test(normalizeText(item.textContent)),
  );
  disableMobileWatchlistSymbolDrawerItem(
    drawerRoot,
    (item) => normalizeText(item.textContent) === 'Add section',
  );
}

function getMobileWatchlistSymbolDrawerItems(drawerRoot: HTMLElement) {
  return [...drawerRoot.querySelectorAll(mobileWatchlistSymbolDrawerItemSelector)].filter(
    (item): item is HTMLLIElement => item instanceof HTMLLIElement,
  );
}

function findMobileWatchlistSymbolDrawerItemByText(drawerRoot: HTMLElement, label: string) {
  return (
    getMobileWatchlistSymbolDrawerItems(drawerRoot).find(
      (item) => normalizeText(item.textContent) === label,
    ) ?? null
  );
}

function removeMobileWatchlistSymbolDrawerItemByPredicate(
  drawerRoot: HTMLElement,
  predicate: (item: HTMLLIElement) => boolean,
) {
  const menuItem = getMobileWatchlistSymbolDrawerItems(drawerRoot).find((item) => predicate(item));

  if (menuItem instanceof HTMLLIElement) {
    menuItem.remove();
  }
}

function removeFirstMobileWatchlistSymbolDrawerSeparator(drawerRoot: HTMLElement) {
  const separators = drawerRoot.querySelectorAll(mobileWatchlistSymbolDrawerSeparatorSelector);

  for (const separator of separators) {
    if (!(separator instanceof HTMLLIElement)) {
      continue;
    }

    const previousItem = separator.previousElementSibling;
    const nextItem = separator.nextElementSibling;
    const previousText = normalizeText(previousItem?.textContent);
    const nextText = normalizeText(nextItem?.textContent);

    if (previousText === 'Unflag all symbols' || /^Add .+ to watchlist$/.test(nextText)) {
      separator.remove();
      return;
    }
  }
}

function getIsMobileWatchlistSymbolFlagTitleItem(menuItem: HTMLLIElement) {
  return normalizeText(menuItem.textContent).startsWith('Flag/Unflag ');
}

function getIsMobileWatchlistSymbolColorMenuItem(menuItem: HTMLLIElement) {
  return (
    menuItem.querySelector(mobileWatchlistSymbolDrawerColorMenuItemSelector) instanceof HTMLElement
  );
}

function disableMobileWatchlistSymbolDrawerItem(
  drawerRoot: HTMLElement,
  predicate: (item: HTMLLIElement) => boolean,
) {
  const menuItem = getMobileWatchlistSymbolDrawerItems(drawerRoot).find((item) => predicate(item));

  if (!(menuItem instanceof HTMLLIElement)) {
    return;
  }

  disableRestrictedWatchlistOwnedElement(menuItem);
}

function restoreMobileWatchlistSymbolDrawerItem(
  drawerRoot: HTMLElement,
  predicate: (item: HTMLLIElement) => boolean,
) {
  const menuItem = getMobileWatchlistSymbolDrawerItems(drawerRoot).find((item) => predicate(item));

  if (!(menuItem instanceof HTMLLIElement)) {
    return;
  }

  restoreRestrictedWatchlistOwnedElement(menuItem);
}

function disableRestrictedWatchlistOwnedElement(element: HTMLElement) {
  preserveRestrictedWatchlistOwnedElementState(element);
  bindRestrictedWatchlistOwnedElement(element);

  element.dataset.assetManagerWatchlistMenuRestricted = 'true';
  element.setAttribute('aria-disabled', 'true');
  element.style.opacity = '0.5';
  element.style.cursor = 'not-allowed';
}

function restoreRestrictedWatchlistOwnedElement(element: HTMLElement) {
  element.dataset.assetManagerWatchlistMenuRestricted = 'false';

  if (element.dataset.assetManagerOriginalAriaDisabled === '') {
    element.removeAttribute('aria-disabled');
  } else if (element.dataset.assetManagerOriginalAriaDisabled) {
    element.setAttribute('aria-disabled', element.dataset.assetManagerOriginalAriaDisabled);
  }

  element.style.opacity = element.dataset.assetManagerOriginalOpacity || '';
  element.style.cursor = element.dataset.assetManagerOriginalCursor || '';
}

function preserveRestrictedWatchlistOwnedElementState(element: HTMLElement) {
  if (element.dataset.assetManagerOriginalAriaDisabled === undefined) {
    element.dataset.assetManagerOriginalAriaDisabled = element.getAttribute('aria-disabled') || '';
  }

  if (element.dataset.assetManagerOriginalOpacity === undefined) {
    element.dataset.assetManagerOriginalOpacity = element.style.opacity || '';
  }

  if (element.dataset.assetManagerOriginalCursor === undefined) {
    element.dataset.assetManagerOriginalCursor = element.style.cursor || '';
  }
}

function bindRestrictedWatchlistOwnedElement(element: HTMLElement) {
  if (element.dataset.assetManagerWatchlistMenuBound === 'true') {
    return;
  }

  element.dataset.assetManagerWatchlistMenuBound = 'true';

  for (const eventName of ['click', 'mousedown', 'pointerdown']) {
    element.addEventListener(eventName, handleRestrictedWatchlistOwnedElementPointerEvent, true);
  }

  element.addEventListener('keydown', handleRestrictedWatchlistOwnedElementKeyDown, true);
}

function handleRestrictedWatchlistOwnedElementPointerEvent(event: Event) {
  const element = event.currentTarget;

  if (!(element instanceof HTMLElement)) {
    return;
  }

  if (element.dataset.assetManagerWatchlistMenuRestricted !== 'true') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (event.type === 'click') {
    window.alert(restrictedActiveWatchlistMenuMessage);
  }
}

function handleRestrictedWatchlistOwnedElementKeyDown(event: KeyboardEvent) {
  const element = event.currentTarget;

  if (!(element instanceof HTMLElement)) {
    return;
  }

  if (element.dataset.assetManagerWatchlistMenuRestricted !== 'true') {
    return;
  }

  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  window.alert(restrictedActiveWatchlistMenuMessage);
}

function syncRestrictedActiveWatchlistMenus(publicId: string | null) {
  const { isOwnedWatchlist } = getRestrictedActiveWatchlistState(publicId);
  const activeWatchlistMenuRoots = findRestrictedActiveWatchlistMenuRoots();

  for (const menuRoot of activeWatchlistMenuRoots) {
    syncRestrictedActiveWatchlistMenu(menuRoot, isOwnedWatchlist);
  }
}

function findRestrictedActiveWatchlistMenuRoots() {
  const menuRoots = new Set<HTMLElement>();

  const desktopMenuRoots = document.querySelectorAll(desktopActiveWatchlistMenuSelector);

  for (const desktopMenuRoot of desktopMenuRoots) {
    if (
      desktopMenuRoot instanceof HTMLElement &&
      isDesktopActiveWatchlistMenuRoot(desktopMenuRoot)
    ) {
      menuRoots.add(desktopMenuRoot);
    }
  }

  const mobileMenuRoots = document.querySelectorAll(mobileActiveWatchlistMenuSelector);

  for (const mobileMenuRoot of mobileMenuRoots) {
    if (mobileMenuRoot instanceof HTMLElement) {
      menuRoots.add(mobileMenuRoot);
    }
  }

  return [...menuRoots];
}

function isDesktopActiveWatchlistMenuRoot(menuRoot: HTMLElement) {
  return ['Share list', 'Rename', 'Clear list', 'Upload list…'].every((label) =>
    Boolean(findActiveWatchlistMenuItemByText(menuRoot, label)),
  );
}

function syncRestrictedActiveWatchlistMenu(menuRoot: HTMLElement, isOwnedWatchlist: boolean) {
  removeActiveWatchlistMenuItem(menuRoot, 'Add alert on the list…');
  removeActiveWatchlistMenuItem(menuRoot, 'Share list');

  if (isOwnedWatchlist) {
    restoreActiveWatchlistMenuItem(menuRoot, 'Rename');
    restoreActiveWatchlistMenuItem(menuRoot, 'Add section');
    restoreActiveWatchlistMenuItem(menuRoot, 'Clear list');
    return;
  }

  disableActiveWatchlistMenuItem(menuRoot, 'Rename');
  disableActiveWatchlistMenuItem(menuRoot, 'Add section');
  disableActiveWatchlistMenuItem(menuRoot, 'Clear list');
}

function removeActiveWatchlistMenuItem(menuRoot: HTMLElement, label: string) {
  const menuItem = findActiveWatchlistMenuItemByText(menuRoot, label);

  if (menuItem instanceof HTMLElement) {
    menuItem.remove();
  }
}

function disableActiveWatchlistMenuItem(menuRoot: HTMLElement, label: string) {
  const menuItem = findActiveWatchlistMenuItemByText(menuRoot, label);

  if (!(menuItem instanceof HTMLElement)) {
    return;
  }

  preserveActiveWatchlistMenuItemState(menuItem);
  bindRestrictedActiveWatchlistMenuItem(menuItem);

  menuItem.dataset.assetManagerWatchlistMenuRestricted = 'true';
  menuItem.setAttribute('aria-disabled', 'true');
  menuItem.style.opacity = '0.5';
  menuItem.style.cursor = 'not-allowed';
}

function restoreActiveWatchlistMenuItem(menuRoot: HTMLElement, label: string) {
  const menuItem = findActiveWatchlistMenuItemByText(menuRoot, label);

  if (!(menuItem instanceof HTMLElement)) {
    return;
  }

  menuItem.dataset.assetManagerWatchlistMenuRestricted = 'false';

  if (menuItem.dataset.assetManagerOriginalAriaDisabled === '') {
    menuItem.removeAttribute('aria-disabled');
  } else if (menuItem.dataset.assetManagerOriginalAriaDisabled) {
    menuItem.setAttribute('aria-disabled', menuItem.dataset.assetManagerOriginalAriaDisabled);
  }

  menuItem.style.opacity = menuItem.dataset.assetManagerOriginalOpacity || '';
  menuItem.style.cursor = menuItem.dataset.assetManagerOriginalCursor || '';
}

function preserveActiveWatchlistMenuItemState(menuItem: HTMLElement) {
  if (menuItem.dataset.assetManagerOriginalAriaDisabled === undefined) {
    menuItem.dataset.assetManagerOriginalAriaDisabled = menuItem.getAttribute('aria-disabled') || '';
  }

  if (menuItem.dataset.assetManagerOriginalOpacity === undefined) {
    menuItem.dataset.assetManagerOriginalOpacity = menuItem.style.opacity || '';
  }

  if (menuItem.dataset.assetManagerOriginalCursor === undefined) {
    menuItem.dataset.assetManagerOriginalCursor = menuItem.style.cursor || '';
  }
}

function bindRestrictedActiveWatchlistMenuItem(menuItem: HTMLElement) {
  if (menuItem.dataset.assetManagerWatchlistMenuBound === 'true') {
    return;
  }

  menuItem.dataset.assetManagerWatchlistMenuBound = 'true';

  for (const eventName of ['click', 'mousedown', 'pointerdown']) {
    menuItem.addEventListener(eventName, handleRestrictedActiveWatchlistMenuPointerEvent, true);
  }

  menuItem.addEventListener('keydown', handleRestrictedActiveWatchlistMenuKeyDown, true);
}

function handleRestrictedActiveWatchlistMenuPointerEvent(event: Event) {
  const menuItem = event.currentTarget;

  if (!(menuItem instanceof HTMLElement)) {
    return;
  }

  if (menuItem.dataset.assetManagerWatchlistMenuRestricted !== 'true') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (event.type === 'click') {
    window.alert(restrictedActiveWatchlistMenuMessage);
  }
}

function handleRestrictedActiveWatchlistMenuKeyDown(event: KeyboardEvent) {
  const menuItem = event.currentTarget;

  if (!(menuItem instanceof HTMLElement)) {
    return;
  }

  if (menuItem.dataset.assetManagerWatchlistMenuRestricted !== 'true') {
    return;
  }

  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  window.alert(restrictedActiveWatchlistMenuMessage);
}

function findActiveWatchlistMenuItemByText(menuRoot: HTMLElement, label: string) {
  return (
    [...menuRoot.querySelectorAll(activeWatchlistMenuItemSelector)].find((menuItem) => {
      if (!(menuItem instanceof HTMLElement)) {
        return false;
      }

      return normalizeText(menuItem.textContent) === label;
    }) ?? null
  );
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
  const dialogName = dialogRoot.dataset.dialogName ?? '';
  const requiredPublicId = publicId?.trim() ?? '';

  if (isDesktopWatchlistsDialogRoot(dialogRoot)) {
    disableRestrictedNavigationButtons(getRestrictedDesktopHotlistsButtons(dialogRoot));
    syncRestrictedWatchlistsRows(dialogRoot, requiredPublicId);
    return;
  }

  if (dialogName === 'Watchlists') {
    disableRestrictedNavigationButtons(getRestrictedMobileHotlistsButtons(dialogRoot));
    return;
  }

  if (dialogName === 'My watchlists') {
    syncRestrictedWatchlistsRows(dialogRoot, requiredPublicId);
    return;
  }

  if (dialogName === 'Search') {
    syncRestrictedWatchlistsRows(dialogRoot, requiredPublicId);
  }
}

function getRestrictedDesktopHotlistsButtons(dialogRoot: HTMLElement) {
  return [...dialogRoot.querySelectorAll(desktopHotlistsTabSelector)].filter(
    (button): button is HTMLButtonElement => button instanceof HTMLButtonElement,
  );
}

function getRestrictedMobileHotlistsButtons(dialogRoot: HTMLElement) {
  const hotlistsButton = findButtonByNormalizedText(dialogRoot, 'Hotlists');

  return hotlistsButton ? [hotlistsButton] : [];
}

function syncRestrictedWatchlistsRows(dialogRoot: HTMLElement, requiredPublicId: string) {
  const layoutItems = getOrderedWatchlistsLayoutItems(dialogRoot);
  let currentSectionTitle = '';

  for (const layoutItem of layoutItems) {
    if (layoutItem.matches(watchlistsSectionContainerSelector)) {
      currentSectionTitle = getWatchlistsSectionTitle(layoutItem);
      continue;
    }

    const watchlistTitle = layoutItem.dataset.title?.trim() ?? '';
    const shouldShowRow = shouldShowRestrictedWatchlistsRow({
      currentSectionTitle,
      dialogName: dialogRoot.dataset.dialogName ?? '',
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

    if (!layoutItem.hidden && layoutItem.style.display !== 'none') {
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
  if (options.dialogName === 'Search' && options.currentSectionTitle === 'Hotlists') {
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
      (child.matches(watchlistsSectionContainerSelector) || child.matches(watchlistsRowSelector)),
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
    !layoutItems.some((item) => item.style.position === 'absolute' || item.style.top)
  ) {
    return;
  }

  let nextTop = 0;

  for (const layoutItem of layoutItems) {
    preserveWatchlistsLayoutMetrics(layoutItem);

    if (layoutItem.hidden || layoutItem.style.display === 'none') {
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
    layoutItem.dataset.assetManagerOriginalTop = layoutItem.style.top || '';
  }

  if (layoutItem.dataset.assetManagerOriginalHeight === undefined) {
    layoutItem.dataset.assetManagerOriginalHeight = layoutItem.style.height || '';
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
