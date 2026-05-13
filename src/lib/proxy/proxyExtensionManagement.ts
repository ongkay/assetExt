import type { AssetProxyConflictExtensionCandidate } from "@/lib/proxy/assetProxy";

const proxyPermissionName = "proxy";
const extensionTypeName = "extension";
const extensionManagementUnavailableMessage = "Kontrol extension browser tidak tersedia.";

export async function readProxyExtensionCandidates(): Promise<AssetProxyConflictExtensionCandidate[]> {
  if (typeof chrome === "undefined" || !chrome.management?.getAll) {
    return [];
  }

  const extensionInfos = await getAllManagedExtensions();
  const selfExtensionId = chrome.runtime?.id ?? null;

  return extensionInfos
    .filter((extensionInfo) => isProxyExtensionCandidate(extensionInfo, selfExtensionId))
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

export async function disableManagedExtension(extensionId: string): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.management?.setEnabled) {
    throw new Error(extensionManagementUnavailableMessage);
  }

  await new Promise<void>((resolve, reject) => {
    chrome.management.setEnabled(extensionId, false, () => {
      const runtimeError = chrome.runtime.lastError;

      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }

      resolve();
    });
  });
}

function isProxyExtensionCandidate(
  extensionInfo: chrome.management.ExtensionInfo,
  selfExtensionId: string | null,
): boolean {
  return (
    extensionInfo.enabled &&
    extensionInfo.type === extensionTypeName &&
    extensionInfo.id !== selfExtensionId &&
    extensionInfo.permissions.includes(proxyPermissionName)
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
