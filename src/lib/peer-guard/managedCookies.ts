import { getManagedCookieDomains } from "@/lib/peer-guard/managedCookieDomains";

export async function clearCookiesForDomains(domains: readonly string[]): Promise<void> {
  for (const domain of domains) {
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

export async function clearPeerGuardManagedCookies(): Promise<void> {
  await clearCookiesForDomains(getManagedCookieDomains());
}

export function buildCookieUrl(cookie: chrome.cookies.Cookie): string {
  const hostname = cookie.domain.replace(/^\./, "");
  const scheme = cookie.secure ? "https" : "http";

  return `${scheme}://${hostname}${cookie.path || "/"}`;
}
