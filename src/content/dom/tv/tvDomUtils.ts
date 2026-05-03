import {
  restrictedNavigationButtonOverlaySelector,
  restrictedNavigationAccessDeniedMessage,
} from './tvSelectors';

export function isTvMobileLayout() {
  return document.documentElement.classList.contains('feature-mobiletouch');
}

export function normalizeText(textContent: string | null | undefined) {
  return textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

export function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function hidePersistentElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.setAttribute('aria-hidden', 'true');
  element.style.display = 'none';
  element.style.pointerEvents = 'none';
}

export function removeElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.remove();
}

export function setInputValue(dialogInput: HTMLInputElement, nextValue: string) {
  const inputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;

  if (inputValueSetter) {
    inputValueSetter.call(dialogInput, nextValue);
  } else {
    dialogInput.value = nextValue;
  }

  dialogInput.dispatchEvent(new Event('input', { bubbles: true }));
  dialogInput.dispatchEvent(new Event('change', { bubbles: true }));
}

export function disableButton(button: Element | null) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.disabled = true;
  button.setAttribute('aria-disabled', 'true');
}

export function disableStyledButton(button: HTMLButtonElement) {
  disableButton(button);
  button.style.opacity = '0.5';
  button.style.cursor = 'not-allowed';
}

export function disableFavoriteButton(button: Element | null) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  disableButton(button);
  button.removeAttribute('title');
  button.removeAttribute('data-tooltip');
  button.classList.remove('apply-common-tooltip');
}

export function disableFavoriteIcon(icon: Element | null) {
  if (!(icon instanceof HTMLSpanElement)) {
    return;
  }

  icon.setAttribute('aria-disabled', 'true');
  icon.removeAttribute('title');
  icon.removeAttribute('data-tooltip');
  icon.classList.remove('apply-common-tooltip');

  if (icon.dataset.assetManagerFavoriteDisabled === 'true') {
    return;
  }

  icon.dataset.assetManagerFavoriteDisabled = 'true';
  icon.addEventListener('click', preventFavoriteInteraction);
  icon.addEventListener('mousedown', preventFavoriteInteraction);
  icon.addEventListener('pointerdown', preventFavoriteInteraction);
}

export function findButtonByNormalizedText(dialogRoot: HTMLElement, label: string) {
  return (
    [...dialogRoot.querySelectorAll('button')].find((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return false;
      }

      return normalizeText(button.textContent) === label;
    }) ?? null
  );
}

export function syncRestrictedListRowVisibility(layoutItem: HTMLElement, shouldShowRow: boolean) {
  layoutItem.hidden = !shouldShowRow;
  layoutItem.setAttribute('aria-hidden', shouldShowRow ? 'false' : 'true');
  layoutItem.style.display = shouldShowRow ? '' : 'none';
}

export function disableRestrictedNavigationButtons(restrictedButtons: HTMLButtonElement[]) {
  for (const restrictedButton of restrictedButtons) {
    restrictedButton.setAttribute('aria-disabled', 'true');
    restrictedButton.style.opacity = '0.5';
    restrictedButton.style.cursor = 'not-allowed';
    restrictedButton.tabIndex = -1;

    if (!restrictedButton.style.position) {
      restrictedButton.style.position = 'relative';
    }

    ensureRestrictedNavigationButtonOverlay(restrictedButton);

    if (restrictedButton.dataset.assetManagerRestrictedBound === 'true') {
      continue;
    }

    restrictedButton.dataset.assetManagerRestrictedBound = 'true';
    restrictedButton.addEventListener('keydown', handleRestrictedNavigationButtonKeyDown, true);
    restrictedButton.addEventListener('focus', handleRestrictedNavigationButtonFocus, true);
  }
}

export function getMenuItemContainer(menuItem: HTMLElement) {
  const parentElement = menuItem.parentElement;

  if (parentElement && parentElement.childElementCount === 1) {
    return parentElement;
  }

  return menuItem;
}

function preventFavoriteInteraction(event: Event) {
  event.preventDefault();
  event.stopPropagation();
}

function ensureRestrictedNavigationButtonOverlay(restrictedButton: HTMLButtonElement) {
  let overlay = restrictedButton.querySelector(
    restrictedNavigationButtonOverlaySelector,
  ) as HTMLSpanElement | null;

  if (!(overlay instanceof HTMLSpanElement)) {
    overlay = document.createElement('span');
    overlay.dataset.assetManagerRestrictedTabOverlay = 'true';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.zIndex = '1';
    overlay.style.cursor = 'not-allowed';
    overlay.style.background = 'transparent';
    restrictedButton.append(overlay);
  }

  if (overlay.dataset.assetManagerRestrictedBound === 'true') {
    return;
  }

  overlay.dataset.assetManagerRestrictedBound = 'true';

  for (const eventName of [
    'pointerdown',
    'mousedown',
    'pointerup',
    'mouseup',
    'touchstart',
    'touchend',
  ]) {
    overlay.addEventListener(eventName, handleRestrictedNavigationBlockedPointerEvent, true);
  }

  overlay.addEventListener('click', handleRestrictedNavigationBlockedClick, true);
}

function handleRestrictedNavigationBlockedPointerEvent(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function handleRestrictedNavigationBlockedClick(event: Event) {
  handleRestrictedNavigationBlockedPointerEvent(event);
  window.alert(restrictedNavigationAccessDeniedMessage);
}

function handleRestrictedNavigationButtonKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  window.alert(restrictedNavigationAccessDeniedMessage);
}

function handleRestrictedNavigationButtonFocus(event: FocusEvent) {
  const restrictedButton = event.currentTarget;

  if (!(restrictedButton instanceof HTMLButtonElement)) {
    return;
  }

  restrictedButton.blur();
}
