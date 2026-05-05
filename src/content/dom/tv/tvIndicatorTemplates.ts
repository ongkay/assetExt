import {
  indicatorTemplatesDialogSelector,
  indicatorTemplatesMyTemplatesDialogSelector,
  indicatorTemplatesMyTemplatesTabSelector,
  indicatorTemplatesRestrictedTabSelector,
  indicatorTemplatesRowSelector,
  indicatorTemplatesSearchInputSelector,
} from "./tvSelectors";
import {
  disableRestrictedNavigationButtons,
  findButtonByNormalizedText,
  syncRestrictedListRowVisibility,
} from "./tvDomUtils";

export function syncRestrictedTvIndicatorTemplates(publicId: string | null) {
  const dialogRoots = findRestrictedIndicatorTemplatesDialogRoots();

  for (const dialogRoot of dialogRoots) {
    syncRestrictedIndicatorTemplatesDialog(dialogRoot, publicId);
  }
}

function findRestrictedIndicatorTemplatesDialogRoots() {
  const dialogRoots = new Set<HTMLElement>();

  for (const selector of [indicatorTemplatesDialogSelector, indicatorTemplatesMyTemplatesDialogSelector]) {
    const matchedRoots = document.querySelectorAll(selector);

    for (const matchedRoot of matchedRoots) {
      if (matchedRoot instanceof HTMLElement) {
        dialogRoots.add(matchedRoot);
      }
    }
  }

  return [...dialogRoots];
}

function isDesktopIndicatorTemplatesDialogRoot(dialogRoot: HTMLElement) {
  return (
    dialogRoot.querySelector(indicatorTemplatesSearchInputSelector) instanceof HTMLInputElement &&
    dialogRoot.querySelector(indicatorTemplatesMyTemplatesTabSelector) instanceof HTMLButtonElement
  );
}

function syncRestrictedIndicatorTemplatesDialog(dialogRoot: HTMLElement, publicId: string | null) {
  const requiredPublicId = publicId?.trim() ?? "";
  const dialogName = dialogRoot.dataset.dialogName ?? "";

  if (isDesktopIndicatorTemplatesDialogRoot(dialogRoot)) {
    disableRestrictedNavigationButtons(getRestrictedDesktopIndicatorTemplatesButtons(dialogRoot));
    syncRestrictedIndicatorTemplatesRows(dialogRoot, requiredPublicId);
    return;
  }

  if (dialogName === "Indicator templates") {
    disableRestrictedNavigationButtons(getRestrictedMobileIndicatorTemplatesButtons(dialogRoot));
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

function syncRestrictedIndicatorTemplatesRows(dialogRoot: HTMLElement, requiredPublicId: string) {
  const templateRows = dialogRoot.querySelectorAll(indicatorTemplatesRowSelector);

  for (const templateRow of templateRows) {
    if (!(templateRow instanceof HTMLElement)) {
      continue;
    }

    const templateTitle = templateRow.dataset.title?.trim() ?? "";
    const shouldShowRow = requiredPublicId.length > 0 && templateTitle.includes(requiredPublicId);

    syncRestrictedListRowVisibility(templateRow, shouldShowRow);
  }
}
