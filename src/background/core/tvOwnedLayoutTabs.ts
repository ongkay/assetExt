import {
  rememberTradingViewOwnedLayoutCreateCandidateTab,
  resolveRestrictedTradingViewRouteStatus,
  resolveTradingViewAssetTargetUrl,
} from "./tvOwnedLayoutController";

let hasInstalledTvOwnedLayoutRedirectListener = false;

export { resolveTradingViewAssetTargetUrl };

export function initializeTvOwnedLayoutRedirectListener() {
  if (hasInstalledTvOwnedLayoutRedirectListener || typeof chrome === "undefined" || !chrome.tabs?.onUpdated) {
    return;
  }

  chrome.tabs.onUpdated.addListener(handleTvOwnedLayoutTabUpdated);
  chrome.tabs.onCreated?.addListener(handleTvOwnedLayoutTabCreated);
  hasInstalledTvOwnedLayoutRedirectListener = true;
}

export async function resolveRestrictedTradingViewRedirectUrl(
  tabUrl: string,
  tabId?: number,
  openerTabId?: number,
): Promise<string | null> {
  const routeStatus = await resolveRestrictedTradingViewRouteStatus(tabUrl, tabId, openerTabId);

  return routeStatus.redirectUrl;
}

async function handleTvOwnedLayoutTabUpdated(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab,
): Promise<void> {
  const candidateUrl = changeInfo.url ?? tab.pendingUrl ?? tab.url;

  if (!candidateUrl || !chrome.tabs?.update) {
    return;
  }

  const routeStatus = await resolveRestrictedTradingViewRouteStatus(candidateUrl, tabId, tab.openerTabId);

  if (!routeStatus.redirectUrl) {
    return;
  }

  await chrome.tabs.update(tabId, { url: routeStatus.redirectUrl });
}

async function handleTvOwnedLayoutTabCreated(tab: chrome.tabs.Tab): Promise<void> {
  await rememberTradingViewOwnedLayoutCreateCandidateTab(tab.openerTabId, tab.id);
}
