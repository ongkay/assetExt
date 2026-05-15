const warningPageOpenThrottleMs = 1_500;

let lastOpenedWarningAt = 0;

export async function openOrFocusPeerGuardWarningPage(warningPagePath: string): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.runtime?.getURL || !chrome.tabs?.query) {
    return;
  }

  const now = Date.now();

  if (now - lastOpenedWarningAt < warningPageOpenThrottleMs) {
    return;
  }

  lastOpenedWarningAt = now;
  const warningPageUrl = chrome.runtime.getURL(warningPagePath);
  const existingTabs = await chrome.tabs.query({});
  const existingWarningTab = existingTabs.find(
    (tab) => (tab.url ?? tab.pendingUrl ?? "") === warningPageUrl && typeof tab.id === "number",
  );

  if (existingWarningTab?.id) {
    await chrome.tabs.update(existingWarningTab.id, { active: true, url: warningPageUrl });
    return;
  }

  await chrome.tabs.create({ active: true, url: warningPageUrl });
}
