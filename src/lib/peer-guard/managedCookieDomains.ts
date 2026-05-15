import { assetPlatformConfigs } from "@/lib/asset-access/platforms";
import { getExtensionApiBaseUrl } from "@/lib/api/extensionApiConfig";

export function getManagedCookieDomains(apiBaseUrl = getExtensionApiBaseUrl()): string[] {
  const managedDomains = new Set<string>();

  for (const platformConfig of Object.values(assetPlatformConfigs)) {
    for (const domain of platformConfig.cookieDomains) {
      managedDomains.add(domain);
    }

    for (const hostPattern of platformConfig.hostPatterns) {
      managedDomains.add(hostPattern);

      if (shouldIncludeWildcardDomain(hostPattern)) {
        managedDomains.add(`.${hostPattern}`);
      }
    }
  }

  for (const serverDomain of getServerCookieDomains(apiBaseUrl)) {
    managedDomains.add(serverDomain);
  }

  return [...managedDomains];
}

function getServerCookieDomains(apiBaseUrl: string): string[] {
  try {
    const hostname = new URL(apiBaseUrl).hostname;

    if (!hostname) {
      return [];
    }

    if (!shouldIncludeWildcardDomain(hostname)) {
      return [hostname];
    }

    return [hostname, `.${hostname}`];
  } catch {
    return [];
  }
}

function shouldIncludeWildcardDomain(hostname: string): boolean {
  return hostname !== "localhost" && !/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}
