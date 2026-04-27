export async function getChromeStorageValue<TValue>(key: string): Promise<TValue | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  const storedValues = await chrome.storage.local.get(key);

  if (!(key in storedValues)) {
    return null;
  }

  return storedValues[key] as TValue;
}

export async function setChromeStorageValue<TValue>(
  key: string,
  value: TValue,
): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.set({ [key]: value });
}

export async function removeChromeStorageValue(key: string): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.remove(key);
}
