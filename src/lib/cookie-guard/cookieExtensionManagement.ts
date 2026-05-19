import { getCookieGuardExcludedExtensionIds } from "@/lib/cookie-guard/cookieGuardConfig";
import type { CookieGuardExtensionCandidate } from "@/lib/cookie-guard/cookieGuardState";

const cookiesPermissionName = "cookies";
const extensionTypeName = "extension";
const extensionManagementUnavailableMessage = "Kontrol extension browser tidak tersedia.";

export async function readCookieGuardExtensionCandidates(): Promise<CookieGuardExtensionCandidate[]> {
  if (typeof chrome === "undefined" || !chrome.management?.getAll) {
    return [];
  }

  const excludedExtensionIds = getCookieGuardExcludedExtensionIds();
  const extensionInfos = await getAllManagedExtensions();

  return extensionInfos
    .filter((extensionInfo) => isCookieGuardExtensionCandidate(extensionInfo, excludedExtensionIds))
    .map((extensionInfo) => ({
      iconUrl: getExtensionIconUrl(extensionInfo),
      id: extensionInfo.id,
      installType: extensionInfo.installType ?? null,
      mayDisable: extensionInfo.mayDisable,
      name: extensionInfo.name,
    }))
    .sort((leftExtension, rightExtension) => {
      if (leftExtension.mayDisable !== rightExtension.mayDisable) {
        return leftExtension.mayDisable ? -1 : 1;
      }

      return leftExtension.name.localeCompare(rightExtension.name);
    });
}

function isCookieGuardExtensionCandidate(
  extensionInfo: chrome.management.ExtensionInfo,
  excludedExtensionIds: ReadonlySet<string>,
): boolean {
  return (
    extensionInfo.enabled &&
    extensionInfo.type === extensionTypeName &&
    !excludedExtensionIds.has(extensionInfo.id) &&
    extensionInfo.permissions.includes(cookiesPermissionName)
  );
}

function getExtensionIconUrl(extensionInfo: chrome.management.ExtensionInfo): string | null {
  if (!extensionInfo.icons?.length) {
    return null;
  }

  const sortedIcons = [...extensionInfo.icons].sort((leftIcon, rightIcon) => leftIcon.size - rightIcon.size);

  return sortedIcons[sortedIcons.length - 1]?.url ?? null;
}

function getAllManagedExtensions(): Promise<chrome.management.ExtensionInfo[]> {
  if (typeof chrome === "undefined" || !chrome.management?.getAll) {
    return Promise.reject(new Error(extensionManagementUnavailableMessage));
  }

  return new Promise((resolve, reject) => {
    chrome.management.getAll((extensionInfos) => {
      const runtimeError = chrome.runtime.lastError;

      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }

      resolve(extensionInfos);
    });
  });
}
