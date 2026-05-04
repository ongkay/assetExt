import {
  contextMenuRootSelector,
  drawingTemplateSpacerRowSelector,
  drawingTemplateMenuItemSelector,
  drawingTemplatesMenuRowSelector,
  drawingTemplatesMenuSelector,
  mobileWatchlistSymbolDrawerItemSelector,
  mobileWatchlistSymbolDrawerSelector,
  restrictedHorizontalLineContextMenuAlertLabelPrefix,
  restrictedHorizontalLineContextMenuLabelPrefix,
  restrictedHorizontalLineContextMenuTradeActionPrefix,
} from './tvSelectors';
import { isTvMobileLayout, normalizeText } from './tvDomUtils';

const desktopContextMenuSeparatorRowSelector = 'tr.row-DFIg7eOh';

const restrictedDesktopContextMenuLabelPatterns = [
  /^Add alert on /,
  /^Buy /,
  /^Sell /,
  /^Add order on /,
  /^Chart template$/,
  /^Add indicator\/strategy on /,
  /^Add financial metric for /,
  /^Add .+ to watchlist$/,
  /^Add text note for /,
  /^Template$/,
  /^Add this indicator to favorites?$/,
  /^Remove this indicator from favorites?$/,
] as const;

export function syncRestrictedTvContextMenus() {
  syncRestrictedDesktopContextMenus();
  syncRestrictedMobileHorizontalLineContextMenus();
}

function syncRestrictedDesktopContextMenus() {
  const menuRoots = document.querySelectorAll(drawingTemplatesMenuSelector);

  for (const menuRoot of menuRoots) {
    if (!(menuRoot instanceof HTMLElement)) {
      continue;
    }

    if (!(menuRoot.closest(contextMenuRootSelector) instanceof HTMLElement)) {
      continue;
    }

    if (isRestrictedHorizontalLineContextMenuRoot(menuRoot)) {
      filterRestrictedHorizontalLineContextMenuRows(menuRoot);
      continue;
    }

    filterRestrictedDesktopContextMenuRows(menuRoot);
  }
}

function syncRestrictedMobileHorizontalLineContextMenus() {
  if (!isTvMobileLayout()) {
    return;
  }

  const drawerRoots = document.querySelectorAll(mobileWatchlistSymbolDrawerSelector);

  for (const drawerRoot of drawerRoots) {
    if (
      !(drawerRoot instanceof HTMLElement) ||
      !isRestrictedMobileHorizontalLineContextMenuRoot(drawerRoot)
    ) {
      continue;
    }

    filterRestrictedMobileHorizontalLineContextMenuItems(drawerRoot);
  }
}

function isRestrictedHorizontalLineContextMenuRoot(menuRoot: HTMLElement) {
  if (!(menuRoot.closest(contextMenuRootSelector) instanceof HTMLElement)) {
    return false;
  }

  if (
    !(findMenuItemByNormalizedTextPrefix(menuRoot, restrictedHorizontalLineContextMenuLabelPrefix) instanceof
      HTMLTableRowElement)
  ) {
    return false;
  }

  return (
    findMenuItemByNormalizedTextPrefix(menuRoot, restrictedHorizontalLineContextMenuAlertLabelPrefix) instanceof
      HTMLTableRowElement ||
    [...menuRoot.querySelectorAll(drawingTemplateMenuItemSelector)].some(
      (row) =>
        row instanceof HTMLTableRowElement &&
        (row.dataset.actionName ?? '').startsWith(restrictedHorizontalLineContextMenuTradeActionPrefix),
    )
  );
}

function isRestrictedMobileHorizontalLineContextMenuRoot(drawerRoot: HTMLElement) {
  return (
    findMobileDrawerItemByTextPrefix(
      drawerRoot,
      restrictedHorizontalLineContextMenuAlertLabelPrefix,
    ) instanceof HTMLLIElement &&
    findMobileDrawerItemByTextPrefix(
      drawerRoot,
      restrictedHorizontalLineContextMenuLabelPrefix,
    ) instanceof HTMLLIElement
  );
}

function filterRestrictedHorizontalLineContextMenuRows(menuRoot: HTMLElement) {
  const menuRows = menuRoot.querySelectorAll(drawingTemplatesMenuRowSelector);

  for (const menuRow of menuRows) {
    if (!(menuRow instanceof HTMLTableRowElement)) {
      continue;
    }

    if (
      menuRow.matches(drawingTemplateMenuItemSelector) &&
      getMenuItemLabel(menuRow).startsWith(restrictedHorizontalLineContextMenuLabelPrefix)
    ) {
      continue;
    }

    hideDesktopContextMenuRow(menuRow);
  }
}

function filterRestrictedDesktopContextMenuRows(menuRoot: HTMLElement) {
  const menuRows = menuRoot.querySelectorAll(drawingTemplateMenuItemSelector);

  for (const menuRow of menuRows) {
    if (!(menuRow instanceof HTMLTableRowElement)) {
      continue;
    }

    if (!shouldRemoveRestrictedDesktopContextMenuRow(getMenuItemLabel(menuRow))) {
      continue;
    }

    hideDesktopContextMenuRowWithSpacer(menuRow);
  }

  cleanupRestrictedDesktopContextMenuSeparators(menuRoot);
}

function filterRestrictedMobileHorizontalLineContextMenuItems(drawerRoot: HTMLElement) {
  const drawerChildren = [...drawerRoot.querySelectorAll(':scope > ul > li')];

  for (const drawerChild of drawerChildren) {
    if (
      drawerChild instanceof HTMLLIElement &&
      drawerChild.matches(mobileWatchlistSymbolDrawerItemSelector) &&
      normalizeText(drawerChild.textContent).startsWith(restrictedHorizontalLineContextMenuLabelPrefix)
    ) {
      continue;
    }

    if (drawerChild instanceof HTMLElement) {
      drawerChild.remove();
    }
  }
}

function findMenuItemByNormalizedTextPrefix(menuRoot: HTMLElement, labelPrefix: string) {
  return (
    [...menuRoot.querySelectorAll(drawingTemplateMenuItemSelector)].find((row) => {
      if (!(row instanceof HTMLTableRowElement)) {
        return false;
      }

      return getMenuItemLabel(row).startsWith(labelPrefix);
    }) ?? null
  );
}

function shouldRemoveRestrictedDesktopContextMenuRow(label: string) {
  return restrictedDesktopContextMenuLabelPatterns.some((pattern) => pattern.test(label));
}

function hideDesktopContextMenuRowWithSpacer(menuRow: HTMLTableRowElement) {
  const spacerRow = menuRow.nextElementSibling;

  hideDesktopContextMenuRow(menuRow);

  if (
    spacerRow instanceof HTMLTableRowElement &&
    spacerRow.matches(drawingTemplateSpacerRowSelector)
  ) {
    hideDesktopContextMenuRow(spacerRow);
  }
}

function cleanupRestrictedDesktopContextMenuSeparators(menuRoot: HTMLElement) {
  const tbody = menuRoot.querySelector('tbody');

  if (!(tbody instanceof HTMLTableSectionElement)) {
    return;
  }

  const rows = [...tbody.children].filter(
    (row): row is HTMLTableRowElement => row instanceof HTMLTableRowElement,
  );

  for (const row of rows) {
    if (!row.matches(desktopContextMenuSeparatorRowSelector)) {
      continue;
    }

    const previousSignificantRow = findAdjacentDesktopContextMenuSignificantRow(row, 'backward');
    const nextSignificantRow = findAdjacentDesktopContextMenuSignificantRow(row, 'forward');

    if (
      !(previousSignificantRow instanceof HTMLTableRowElement) ||
      !isVisibleDesktopContextMenuMenuItemRow(previousSignificantRow) ||
      !(nextSignificantRow instanceof HTMLTableRowElement) ||
      !isVisibleDesktopContextMenuMenuItemRow(nextSignificantRow)
    ) {
      hideDesktopContextMenuRow(row);
    }
  }
}

function findAdjacentDesktopContextMenuSignificantRow(
  row: HTMLTableRowElement,
  direction: 'forward' | 'backward',
) {
  let currentElement =
    direction === 'forward' ? row.nextElementSibling : row.previousElementSibling;

  while (currentElement) {
    if (
      currentElement instanceof HTMLTableRowElement &&
      (currentElement.matches(drawingTemplateMenuItemSelector) ||
        currentElement.matches(desktopContextMenuSeparatorRowSelector))
    ) {
      if (isDesktopContextMenuRowHidden(currentElement)) {
        currentElement =
          direction === 'forward'
            ? currentElement.nextElementSibling
            : currentElement.previousElementSibling;
        continue;
      }

      return currentElement;
    }

    currentElement =
      direction === 'forward' ? currentElement.nextElementSibling : currentElement.previousElementSibling;
  }

  return null;
}

function findMobileDrawerItemByTextPrefix(drawerRoot: HTMLElement, labelPrefix: string) {
  return (
    [...drawerRoot.querySelectorAll(mobileWatchlistSymbolDrawerItemSelector)].find(
      (item) => item instanceof HTMLLIElement && normalizeText(item.textContent).startsWith(labelPrefix),
    ) ?? null
  );
}

function getMenuItemLabel(menuRow: HTMLTableRowElement) {
  return normalizeText(menuRow.textContent);
}

function hideDesktopContextMenuRow(menuRow: HTMLTableRowElement) {
  menuRow.hidden = true;
  menuRow.setAttribute('aria-hidden', 'true');
  menuRow.style.display = 'none';
}

function isDesktopContextMenuRowHidden(menuRow: HTMLTableRowElement) {
  return menuRow.hidden || menuRow.style.display === 'none';
}

function isVisibleDesktopContextMenuMenuItemRow(menuRow: HTMLTableRowElement) {
  return menuRow.matches(drawingTemplateMenuItemSelector) && !isDesktopContextMenuRowHidden(menuRow);
}
