import { assetPlatforms, getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";
import type { ExtensionCookiePayload, ExtensionCookieSameSite } from "@/lib/api/extensionApiTypes";

export async function clearAssetPlatformCookies(platform: AssetPlatform): Promise<void> {
  const platformConfig = getAssetPlatformConfig(platform);

  for (const domain of platformConfig.cookieDomains) {
    const cookies = await chrome.cookies.getAll({ domain });

    await Promise.all(
      cookies.map((cookie) =>
        chrome.cookies.remove({
          name: cookie.name,
          storeId: cookie.storeId,
          url: buildCookieUrl(cookie),
        }),
      ),
    );
  }
}

export async function clearAllAssetPlatformCookies(): Promise<void> {
  for (const platform of assetPlatforms) {
    await clearAssetPlatformCookies(platform);
  }
}

export async function injectExtensionCookies(cookies: ExtensionCookiePayload[]): Promise<void> {
  await Promise.all(cookies.map((cookie) => chrome.cookies.set(toChromeCookieDetails(cookie))));
}

export function toChromeCookieDetails(cookie: ExtensionCookiePayload): chrome.cookies.SetDetails {
  return {
    domain: cookie.hostOnly ? undefined : cookie.domain,
    expirationDate: cookie.expirationDate,
    httpOnly: cookie.httpOnly,
    name: cookie.name,
    path: cookie.path ?? "/",
    sameSite: toChromeSameSite(cookie.sameSite),
    secure: cookie.secure,
    storeId: cookie.storeId,
    url: buildCookieSetUrl(cookie),
    value: cookie.value,
  };
}

export function buildCookieSetUrl(cookie: ExtensionCookiePayload): string {
  if (!cookie.domain) {
    throw new Error(`Cookie ${cookie.name} tidak memiliki domain.`);
  }

  const hostname = cookie.domain.replace(/^\./, "");

  return `https://${hostname}${cookie.path ?? "/"}`;
}

export function buildCookieUrl(cookie: chrome.cookies.Cookie): string {
  const hostname = cookie.domain.replace(/^\./, "");

  return `https://${hostname}${cookie.path || "/"}`;
}

export function toChromeSameSite(
  sameSite: ExtensionCookieSameSite | undefined,
): chrome.cookies.SameSiteStatus | undefined {
  if (!sameSite || sameSite === "unspecified") {
    return undefined;
  }

  return sameSite;
}
