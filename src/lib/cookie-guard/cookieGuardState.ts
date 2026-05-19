export type CookieGuardExtensionCandidate = {
  iconUrl: string | null;
  id: string;
  installType: chrome.management.ExtensionInfo["installType"] | null;
  mayDisable: boolean;
  name: string;
};

export type CookieGuardBlockReason = "cookies_permission_detected";

export type CookieGuardState = {
  blockedAt: number | null;
  extensions: CookieGuardExtensionCandidate[];
  isBlocked: boolean;
  message: string | null;
  reason: CookieGuardBlockReason | null;
  updatedAt: number;
};

export function createUnblockedCookieGuardState(now = Date.now()): CookieGuardState {
  return {
    blockedAt: null,
    extensions: [],
    isBlocked: false,
    message: null,
    reason: null,
    updatedAt: now,
  };
}

export function createBlockedCookieGuardState(
  extensions: CookieGuardExtensionCandidate[],
  now = Date.now(),
): CookieGuardState {
  return {
    blockedAt: now,
    extensions,
    isBlocked: true,
    message: createCookieGuardBlockedMessage(extensions.length),
    reason: "cookies_permission_detected",
    updatedAt: now,
  };
}

export function createCookieGuardBlockedMessage(extensionCount: number): string {
  return `Ada ${extensionCount} extension aktif dengan permission cookies. Session lokal dibersihkan dan akses asset dihentikan sampai extension tersebut dinonaktifkan.`;
}
