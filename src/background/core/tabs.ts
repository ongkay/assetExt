export async function getActiveTabId(): Promise<number | null> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  return activeTab?.id ?? null;
}

export async function openOrReloadTab(
  targetUrl: string,
  tabId?: number,
): Promise<chrome.tabs.Tab> {
  if (tabId) {
    return chrome.tabs.update(tabId, { active: true, url: targetUrl });
  }

  return chrome.tabs.create({ active: true, url: targetUrl });
}
