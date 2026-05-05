import {
  layoutsDialogSelector,
  layoutsSearchClearButtonSelector,
  layoutsSearchInputSelector,
} from "./tvSelectors";
import { setInputValue } from "./tvDomUtils";

export function syncRestrictedTvLayouts(publicId: string | null) {
  const dialogRoots = document.querySelectorAll(layoutsDialogSelector);

  for (const dialogRoot of dialogRoots) {
    if (!(dialogRoot instanceof HTMLElement)) {
      continue;
    }

    syncRestrictedLayoutsDialog(dialogRoot, publicId);
  }
}

function syncRestrictedLayoutsDialog(dialogRoot: HTMLElement, publicId: string | null) {
  const requiredPublicId = publicId?.trim() ?? "";
  const searchInput = dialogRoot.querySelector(layoutsSearchInputSelector);

  if (searchInput instanceof HTMLInputElement) {
    syncRestrictedLayoutsSearchInput(searchInput, requiredPublicId);
  }

  hideRestrictedLayoutsClearButtons(dialogRoot);
}

function syncRestrictedLayoutsSearchInput(searchInput: HTMLInputElement, requiredPublicId: string) {
  if (searchInput.value !== requiredPublicId) {
    setInputValue(searchInput, requiredPublicId);
  }

  searchInput.readOnly = true;
  searchInput.setAttribute("aria-readonly", "true");
}

function hideRestrictedLayoutsClearButtons(dialogRoot: HTMLElement) {
  const clearButtons = dialogRoot.querySelectorAll(layoutsSearchClearButtonSelector);

  for (const clearButton of clearButtons) {
    if (!(clearButton instanceof HTMLElement)) {
      continue;
    }

    clearButton.hidden = true;
    clearButton.setAttribute("aria-hidden", "true");
    clearButton.style.display = "none";
    clearButton.style.pointerEvents = "none";
  }
}
