import {
  alertNotificationsButtonSelector,
  alertPresetsButtonSelector,
  alertsCreateEditDialogSelector,
  alertSubmitButtonSelector,
  createDialogSelector,
  dialogInputSelector,
  dialogSaveButtonSelector,
  dialogSelectButtonSelector,
  dialogSuggestionsSelector,
  renameDialogSelector,
  saveIndicatorTemplateDialogSelector,
} from './tvSelectors';
import { disableButton, disableStyledButton, setInputValue } from './tvDomUtils';

export function syncRestrictedTvDialogs(publicId: string | null) {
  syncRestrictedTvTextDialogs(publicId);
  syncRestrictedTvAlertDialogs();
}

function syncRestrictedTvTextDialogs(publicId: string | null) {
  const dialogRoots = findRestrictedDialogRoots();

  for (const dialogRoot of dialogRoots) {
    syncRestrictedTvTextDialog(dialogRoot, publicId);
  }
}

function findRestrictedDialogRoots() {
  const dialogRoots = new Set<HTMLElement>();

  for (const selector of [
    createDialogSelector,
    renameDialogSelector,
    saveIndicatorTemplateDialogSelector,
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

function syncRestrictedTvTextDialog(dialogRoot: HTMLElement, publicId: string | null) {
  const dialogInput = dialogRoot.querySelector(dialogInputSelector);

  if (dialogInput instanceof HTMLInputElement) {
    autofillRestrictedDialogInput(dialogInput, publicId);
    bindRestrictedDialogInput(dialogRoot, dialogInput, publicId);
  }

  disableRestrictedDialogSelectButton(dialogRoot);
  suppressRestrictedDialogSuggestions(dialogRoot);
  syncRestrictedDialogSaveButtons(dialogRoot, publicId);
}

function syncRestrictedTvAlertDialogs() {
  const dialogRoots = document.querySelectorAll(alertsCreateEditDialogSelector);

  for (const dialogRoot of dialogRoots) {
    if (!(dialogRoot instanceof HTMLElement)) {
      continue;
    }

    disableRestrictedAlertDialogButtons(dialogRoot);
  }
}

function disableRestrictedAlertDialogButtons(dialogRoot: HTMLElement) {
  for (const selector of [
    alertPresetsButtonSelector,
    alertNotificationsButtonSelector,
    alertSubmitButtonSelector,
  ]) {
    const button = dialogRoot.querySelector(selector);

    if (!(button instanceof HTMLButtonElement)) {
      continue;
    }

    disableStyledButton(button);
  }
}

function autofillRestrictedDialogInput(dialogInput: HTMLInputElement, publicId: string | null) {
  if (!publicId || dialogInput.dataset.assetManagerPublicIdAutofilled === 'true') {
    return;
  }

  setInputValue(dialogInput, `${publicId} `);
  dialogInput.dataset.assetManagerPublicIdAutofilled = 'true';
}

function bindRestrictedDialogInput(
  dialogRoot: HTMLElement,
  dialogInput: HTMLInputElement,
  publicId: string | null,
) {
  if (dialogInput.dataset.assetManagerPublicIdBound === 'true') {
    return;
  }

  const syncDialogState = () => {
    suppressRestrictedDialogSuggestions(dialogRoot);
    syncRestrictedDialogSaveButtons(dialogRoot, publicId);
  };

  dialogInput.dataset.assetManagerPublicIdBound = 'true';
  dialogInput.addEventListener('input', syncDialogState);
  dialogInput.addEventListener('change', syncDialogState);
}

function disableRestrictedDialogSelectButton(dialogRoot: HTMLElement) {
  const dialogSelectButton = dialogRoot.querySelector(dialogSelectButtonSelector);

  if (!(dialogSelectButton instanceof HTMLButtonElement)) {
    return;
  }

  disableButton(dialogSelectButton);
  dialogSelectButton.removeAttribute('title');
  dialogSelectButton.removeAttribute('data-tooltip');
  dialogSelectButton.classList.remove('apply-common-tooltip');
}

function suppressRestrictedDialogSuggestions(dialogRoot: HTMLElement) {
  const suggestions = dialogRoot.querySelectorAll(dialogSuggestionsSelector);

  for (const suggestion of suggestions) {
    if (suggestion instanceof HTMLElement) {
      suggestion.hidden = true;
      suggestion.setAttribute('aria-hidden', 'true');
      suggestion.style.display = 'none';
      suggestion.style.pointerEvents = 'none';
    }
  }
}

function syncRestrictedDialogSaveButtons(dialogRoot: HTMLElement, publicId: string | null) {
  const dialogInput = dialogRoot.querySelector(dialogInputSelector);
  const saveButtons = dialogRoot.querySelectorAll(dialogSaveButtonSelector);
  const requiredPublicId = publicId?.trim() ?? '';
  const hasRequiredPublicId =
    dialogInput instanceof HTMLInputElement &&
    requiredPublicId.length > 0 &&
    dialogInput.value.includes(requiredPublicId);

  for (const saveButton of saveButtons) {
    if (!(saveButton instanceof HTMLButtonElement)) {
      continue;
    }

    saveButton.disabled = !hasRequiredPublicId;
    saveButton.setAttribute('aria-disabled', hasRequiredPublicId ? 'false' : 'true');
  }
}
