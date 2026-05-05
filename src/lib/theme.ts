export const themePreferenceStorageKey = "theme";
export const defaultThemePreference = "light";

export type ThemePreference = "light" | "dark";

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark";
}

export function applyThemeClass(element: Element, theme: ThemePreference) {
  element.classList.add("theme");
  element.classList.remove("light", "dark");
  element.classList.add(theme);
}

export async function getThemePreference(): Promise<ThemePreference> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return defaultThemePreference;
  }

  try {
    const stored = await chrome.storage.local.get<Record<string, unknown>>(themePreferenceStorageKey);
    const theme = stored[themePreferenceStorageKey];

    return isThemePreference(theme) ? theme : defaultThemePreference;
  } catch {
    return defaultThemePreference;
  }
}

export async function setThemePreference(theme: ThemePreference) {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  try {
    await chrome.storage.local.set({ [themePreferenceStorageKey]: theme });
  } catch {
    return;
  }
}

export function onThemePreferenceChange(callback: (theme: ThemePreference) => void) {
  if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
    return () => {};
  }

  const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    const nextTheme = changes[themePreferenceStorageKey]?.newValue;
    if (isThemePreference(nextTheme)) {
      callback(nextTheme);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
