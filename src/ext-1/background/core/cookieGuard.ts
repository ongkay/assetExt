import { clearExtensionSessionArtifactsForSecurityBlock } from "@/background/core/bootstrap";
import { redirectPeerGuardProtectedAssetTabs } from "@/background/core/tabs";
import { openOrFocusPeerGuardWarningPage } from "@/lib/peer-guard/peerGuardWarningPage";
import { cookieGuardWarningPagePath } from "@/lib/cookie-guard/cookieGuardConfig";
import { readCookieGuardExtensionCandidates } from "@/lib/cookie-guard/cookieExtensionManagement";
import {
  createBlockedCookieGuardState,
  createUnblockedCookieGuardState,
  type CookieGuardState,
} from "@/lib/cookie-guard/cookieGuardState";
import { readCookieGuardState, writeCookieGuardState } from "@/lib/cookie-guard/cookieGuardStorage";

let isInitialized = false;
let cookieGuardSyncPromise: Promise<CookieGuardState> | null = null;

export class CookieGuardBlockedError extends Error {
  cookieGuardState: CookieGuardState;

  constructor(cookieGuardState: CookieGuardState) {
    super(cookieGuardState.message ?? "Akses extension diblokir.");
    this.name = "CookieGuardBlockedError";
    this.cookieGuardState = cookieGuardState;
  }
}

export async function initializeCookieGuard(): Promise<void> {
  if (!isInitialized) {
    registerCookieGuardListeners();
    isInitialized = true;
  }

  await refreshCookieGuardState();
}

export async function ensureCookieGuardAccess(): Promise<CookieGuardState> {
  const cookieGuardState = await refreshCookieGuardState();

  if (cookieGuardState.isBlocked) {
    throw new CookieGuardBlockedError(cookieGuardState);
  }

  return cookieGuardState;
}

export function getCookieGuardWarningPageUrl(): string {
  return chrome.runtime.getURL(cookieGuardWarningPagePath);
}

export async function readCurrentCookieGuardState(): Promise<CookieGuardState> {
  const storedCookieGuardState = await readCookieGuardState();

  return storedCookieGuardState ?? createUnblockedCookieGuardState();
}

export async function refreshCookieGuardState(): Promise<CookieGuardState> {
  if (cookieGuardSyncPromise) {
    return cookieGuardSyncPromise;
  }

  cookieGuardSyncPromise = syncCookieGuardState().finally(() => {
    cookieGuardSyncPromise = null;
  });

  return cookieGuardSyncPromise;
}

async function syncCookieGuardState(): Promise<CookieGuardState> {
  const storedCookieGuardState = await readCookieGuardState();
  const previousCookieGuardState = storedCookieGuardState ?? createUnblockedCookieGuardState();
  const conflictExtensions = await readCookieGuardExtensionCandidates();

  if (conflictExtensions.length === 0) {
    const nextCookieGuardState = createUnblockedCookieGuardState();
    await writeCookieGuardState(nextCookieGuardState);
    return nextCookieGuardState;
  }

  const nextCookieGuardState = createBlockedCookieGuardState(conflictExtensions);

  await writeCookieGuardState(nextCookieGuardState);

  if (!previousCookieGuardState.isBlocked) {
    try {
      await clearExtensionSessionArtifactsForSecurityBlock();
      const assetRedirectResult = await redirectPeerGuardProtectedAssetTabs(getCookieGuardWarningPageUrl());

      if (assetRedirectResult.redirectedTabCount === 0) {
        await openOrFocusPeerGuardWarningPage(cookieGuardWarningPagePath);
      }
    } catch {
      // Keep the extension fail-closed even when cleanup only completes partially.
    }
  }

  return nextCookieGuardState;
}

function registerCookieGuardListeners(): void {
  if (typeof chrome === "undefined" || !chrome.management) {
    return;
  }

  chrome.management.onDisabled?.addListener(() => {
    void refreshCookieGuardState().catch(() => undefined);
  });

  chrome.management.onEnabled?.addListener(() => {
    void refreshCookieGuardState().catch(() => undefined);
  });

  chrome.management.onInstalled?.addListener(() => {
    void refreshCookieGuardState().catch(() => undefined);
  });

  chrome.management.onUninstalled?.addListener(() => {
    void refreshCookieGuardState().catch(() => undefined);
  });
}
