import { getPeerGuardProtectedAssetHostPatterns } from "@/lib/asset-access/platforms";

const peerGuardProtectedAssetRootDomains = getPeerGuardProtectedAssetHostPatterns();

export type PeerGuardAssetRedirectResult = {
  redirectedTabCount: number;
  warningTabId: number | null;
};

export async function getActiveTabId(): Promise<number | null> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  return activeTab?.id ?? null;
}

export async function openOrReloadTab(targetUrl: string, tabId?: number): Promise<chrome.tabs.Tab> {
  if (tabId) {
    return chrome.tabs.update(tabId, { active: true, url: targetUrl });
  }

  return chrome.tabs.create({ active: true, url: targetUrl });
}

export async function redirectPeerGuardProtectedAssetTabs(targetUrl: string): Promise<PeerGuardAssetRedirectResult> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query || !chrome.tabs?.update) {
    return { redirectedTabCount: 0, warningTabId: null };
  }

  const tabs = await chrome.tabs.query({});
  const protectedAssetTabs = tabs.filter((tab) => isPeerGuardProtectedAssetTab(tab));
  const primaryWarningTab = protectedAssetTabs.find((tab) => tab.active && typeof tab.id === "number") ?? protectedAssetTabs[0];

  if (!primaryWarningTab?.id) {
    return { redirectedTabCount: 0, warningTabId: null };
  }

  await Promise.all(
    protectedAssetTabs.flatMap((tab) =>
      typeof tab.id === "number"
        ? [chrome.tabs.update(tab.id, { active: tab.id === primaryWarningTab.id, url: targetUrl })]
        : [],
    ),
  );

  return {
    redirectedTabCount: protectedAssetTabs.length,
    warningTabId: primaryWarningTab.id,
  };
}

export function isPeerGuardProtectedAssetHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();

  return peerGuardProtectedAssetRootDomains.some(
    (rootDomain) => normalizedHostname === rootDomain || normalizedHostname.endsWith(`.${rootDomain}`),
  );
}

function isPeerGuardProtectedAssetTab(tab: chrome.tabs.Tab): boolean {
  const tabUrl = tab.url ?? tab.pendingUrl;

  if (!tabUrl) {
    return false;
  }

  try {
    return isPeerGuardProtectedAssetHostname(new URL(tabUrl).hostname);
  } catch {
    return false;
  }
}
