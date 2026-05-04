import { detectAssetPlatformFromHostname } from '@/lib/asset-access/platforms';
import { readBootstrapCache } from '@/lib/storage/bootstrapCache';
import { runtimeMessageType } from '@/lib/runtime/messages';

import { syncRestrictedTvContextMenus } from './tv/tvContextMenus';
import { syncRestrictedTvDialogs } from './tv/tvDialogs';
import { syncRestrictedTvIndicatorTemplates } from './tv/tvIndicatorTemplates';
import { syncRestrictedTvLayouts } from './tv/tvLayouts';
import { logoutRedirectDelayMs, mainMenuButtonSelector } from './tv/tvSelectors';
import {
  cleanupTvShellBootstrapState,
  createTvOverrideState,
  findOpenTvMenu,
  hideTvMainAvatarBadge,
  hideTvMenuUntilStateIsReady,
  installTvShellBootstrapState,
  isRelevantTvMutation,
  syncOpenTvPopupMenu,
  syncRestrictedTvShell,
  syncTvShellBootstrapState,
  syncTvMainAvatar,
} from './tv/tvShell';
import { syncRestrictedTvTemplateMenus } from './tv/tvTemplateMenus';
import type { TvLogoutStatus, TvOverrideState } from './tv/tvTypes';
import { syncRestrictedTvWatchlists } from './tv/tvWatchlists';

export function installTvDomPatches(): () => void {
  if (!isTvPage()) {
    return () => undefined;
  }

  const usesMobileLayout = document.documentElement.classList.contains('feature-mobiletouch');
  let overrideState: TvOverrideState | null = null;
  let logoutStatus: TvLogoutStatus = 'idle';
  let isWaitingForFirstMenuOpen = false;
  let loadOverrideStatePromise: Promise<void> | null = null;
  let mutationObserver: MutationObserver | null = null;
  let isObserverActive = false;
  let isDisposed = false;

  installTvShellBootstrapState();

  const syncTvPage = () => {
    if (isDisposed) {
      return;
    }

    runWithoutObserver(() => {
      syncTvMainAvatar(overrideState);
      hideTvMainAvatarBadge();
      syncRestrictedTvActions(overrideState);
      syncOpenTvPopupMenu({ logoutStatus, overrideState, onLogoutClick: handleLogoutClick });
      syncTvShellBootstrapState(overrideState);
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
      .catch(() => null)
      .then((bootstrapCacheRecord) => {
        if (isDisposed) {
          return;
        }

        overrideState = createTvOverrideState(bootstrapCacheRecord);
        syncTvPage();
      })
      .finally(() => {
        loadOverrideStatePromise = null;
      });

    return loadOverrideStatePromise;
  };

  const handleMutations: MutationCallback = (mutations) => {
    const openMenu = findOpenTvMenu();

    if (openMenu && !overrideState) {
      hideTvMenuUntilStateIsReady(openMenu);
      void ensureOverrideStateLoaded().catch(() => undefined);
      return;
    }

    if (mutations.some(isRelevantTvMutation)) {
      syncTvPage();
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

    if (logoutStatus === 'loading') {
      return;
    }

    logoutStatus = 'loading';
    syncTvPage();

    void requestTvLogout()
      .then((redirectTo) => {
        logoutStatus = 'success';
        syncTvPage();

        window.setTimeout(() => {
          window.location.assign(redirectTo);
        }, logoutRedirectDelayMs);
      })
      .catch(() => {
        logoutStatus = 'error';
        syncTvPage();
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
      attributeFilter: ['src'],
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
  document.addEventListener('click', handleMainMenuButtonClick, true);

  void ensureOverrideStateLoaded().catch(() => undefined);
  syncTvPage();

  return () => {
    isDisposed = true;
    pauseObserver();
    document.removeEventListener('click', handleMainMenuButtonClick, true);
    cleanupTvShellBootstrapState();
  };
}

function isTvPage() {
  return detectAssetPlatformFromHostname(window.location.hostname) === 'tradingview';
}

function syncRestrictedTvActions(overrideState: TvOverrideState | null) {
  if (!overrideState || overrideState.menuMode !== 'restricted') {
    return;
  }

  syncRestrictedTvShell();
  syncRestrictedTvWatchlists(overrideState.publicId);
  syncRestrictedTvDialogs(overrideState.publicId);
  syncRestrictedTvIndicatorTemplates(overrideState.publicId);
  syncRestrictedTvLayouts(overrideState.publicId);
  syncRestrictedTvTemplateMenus(overrideState.publicId);
  syncRestrictedTvContextMenus();
}

async function requestTvLogout(): Promise<string> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    throw new Error('Runtime extension tidak tersedia.');
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
          reject(new Error(chrome.runtime.lastError.message ?? 'Logout gagal diproses.'));
          return;
        }

        if (!response?.ok || !response.value?.redirectTo) {
          reject(new Error(response?.errorMessage ?? 'Logout gagal diproses.'));
          return;
        }

        resolve(response.value.redirectTo);
      },
    );
  });
}
