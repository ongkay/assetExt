import {
  drawingTemplateLabelSelector,
  drawingTemplateMenuItemSelector,
  drawingTemplateRemoveButtonSelector,
  drawingTemplateSpacerRowSelector,
  drawingTemplatesMenuRowSelector,
  drawingTemplatesMenuSelector,
  popupTemplateMenuItemSelector,
  popupTemplateMenuLabelSelector,
  popupTemplateMenuRootSelector,
  popupTemplateThemeItemSelector,
  seriesThemeTemplateActionSelector,
  templatesMenuRootSelector,
} from './tvSelectors';
import { getMenuItemContainer, normalizeText, removeElement } from './tvDomUtils';

export function syncRestrictedTvTemplateMenus(publicId: string | null) {
  const requiredPublicId = publicId?.trim() ?? '';
  const menuRoots = document.querySelectorAll(drawingTemplatesMenuSelector);

  for (const menuRoot of menuRoots) {
    if (!(menuRoot instanceof HTMLElement)) {
      continue;
    }

    if (isDrawingTemplatesMenuRoot(menuRoot)) {
      filterRestrictedDrawingTemplateRows(menuRoot, requiredPublicId);
      continue;
    }

    if (isPopupTemplateMenuRoot(menuRoot)) {
      filterRestrictedPopupTemplateMenuItems(menuRoot, requiredPublicId);
    }
  }
}

function isDrawingTemplatesMenuRoot(menuRoot: HTMLElement) {
  if (!(menuRoot.closest(templatesMenuRootSelector) instanceof HTMLElement)) {
    return false;
  }

  return (
    menuRoot.querySelector(drawingTemplateRemoveButtonSelector) instanceof HTMLElement &&
    (findMenuItemByNormalizedText(menuRoot, 'Save Drawing Template As…') instanceof
      HTMLTableRowElement ||
      findMenuItemByNormalizedText(menuRoot, 'Apply Default Drawing Template') instanceof
        HTMLTableRowElement)
  );
}

function isPopupTemplateMenuRoot(menuRoot: HTMLElement) {
  const hasKnownPopupTemplateContainer =
    menuRoot.closest(popupTemplateMenuRootSelector) instanceof HTMLElement;
  const hasSeriesThemeTemplateActions =
    menuRoot.querySelector(seriesThemeTemplateActionSelector) instanceof HTMLElement;
  const hasSeriesThemeTemplateItems =
    menuRoot.querySelector(popupTemplateThemeItemSelector) instanceof HTMLElement;

  if (
    !hasKnownPopupTemplateContainer &&
    !hasSeriesThemeTemplateActions &&
    !hasSeriesThemeTemplateItems
  ) {
    return false;
  }

  return (
    menuRoot.querySelector(drawingTemplateRemoveButtonSelector) instanceof HTMLElement &&
    (findPopupTemplateMenuItemByNormalizedText(menuRoot, 'Save as…') instanceof HTMLElement ||
      findPopupTemplateMenuItemByNormalizedText(menuRoot, 'Apply defaults') instanceof HTMLElement)
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
  const templateRows = getRestrictedDrawingTemplateRows(menuRoot);

  if (templateRows.length === 0) {
    return;
  }

  for (const menuRow of templateRows) {
    const templateTitle = getMenuItemLabel(menuRow);

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

function filterRestrictedPopupTemplateMenuItems(menuRoot: HTMLElement, requiredPublicId: string) {
  const templateItems = getRestrictedPopupTemplateMenuItems(menuRoot);

  if (templateItems.length === 0) {
    return;
  }

  for (const templateItem of templateItems) {
    if (
      requiredPublicId.length > 0 &&
      getPopupTemplateMenuItemLabel(templateItem).includes(requiredPublicId)
    ) {
      continue;
    }

    removeElement(getMenuItemContainer(templateItem));
  }
}

function getRestrictedDrawingTemplateRows(menuRoot: HTMLElement) {
  return [...menuRoot.querySelectorAll(drawingTemplatesMenuRowSelector)].filter(
    (menuRow): menuRow is HTMLTableRowElement =>
      menuRow instanceof HTMLTableRowElement &&
      menuRow.matches(drawingTemplateMenuItemSelector) &&
      menuRow.querySelector(drawingTemplateRemoveButtonSelector) instanceof HTMLElement,
  );
}

function getRestrictedPopupTemplateMenuItems(menuRoot: HTMLElement) {
  return [...menuRoot.querySelectorAll(popupTemplateMenuItemSelector)].filter(
    (menuItem): menuItem is HTMLDivElement =>
      menuItem instanceof HTMLDivElement &&
      menuItem.querySelector(drawingTemplateRemoveButtonSelector) instanceof HTMLElement,
  );
}

function getPopupTemplateMenuItemLabel(menuItem: HTMLDivElement) {
  return normalizeText(menuItem.querySelector(popupTemplateMenuLabelSelector)?.textContent);
}

function getMenuItemLabel(menuRow: HTMLTableRowElement) {
  const titleLabel = menuRow.querySelector(drawingTemplateLabelSelector);

  return normalizeText(titleLabel?.textContent);
}

function findPopupTemplateMenuItemByNormalizedText(menuRoot: HTMLElement, label: string) {
  return (
    [...menuRoot.querySelectorAll(popupTemplateMenuItemSelector)].find((menuItem) => {
      if (!(menuItem instanceof HTMLDivElement)) {
        return false;
      }

      return getPopupTemplateMenuItemLabel(menuItem) === label;
    }) ?? null
  );
}
