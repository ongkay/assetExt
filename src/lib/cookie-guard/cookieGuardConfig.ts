import { ext1ExtensionId, ext2ExtensionId } from "@/lib/peer-guard/peerGuardConfig";

export const cookieGuardStateStorageKey = "assetManager.cookieGuardState";
export const cookieGuardWarningPagePath = "cookies-blocked.html";

// Tambahkan extension internal lain ke daftar ini bila memang dipercaya penuh.
export const cookieGuardExcludedExtensionIds = [ext1ExtensionId, ext2ExtensionId] as const;

export function getCookieGuardExcludedExtensionIds(): Set<string> {
  const excludedExtensionIds = new Set<string>(cookieGuardExcludedExtensionIds);

  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    excludedExtensionIds.add(chrome.runtime.id);
  }

  return excludedExtensionIds;
}
