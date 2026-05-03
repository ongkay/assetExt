import {
  contextMenuRootSelector,
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

export function syncRestrictedTvContextMenus() {
  syncRestrictedHorizontalLineContextMenus();
  syncRestrictedMobileHorizontalLineContextMenus();
}

function syncRestrictedHorizontalLineContextMenus() {
  const menuRoots = document.querySelectorAll(drawingTemplatesMenuSelector);

  for (const menuRoot of menuRoots) {
    if (!(menuRoot instanceof HTMLElement) || !isRestrictedHorizontalLineContextMenuRoot(menuRoot)) {
      continue;
    }

    filterRestrictedHorizontalLineContextMenuRows(menuRoot);
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

    menuRow.remove();
  }
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
