import { useEffect, useState } from "react";

import {
  applyThemeClass,
  defaultThemePreference,
  getThemePreference,
  onThemePreferenceChange,
  setThemePreference,
  type ThemePreference,
} from "@/lib/theme";

type ThemeTarget = Element | null;

export function useThemePreference(target: ThemeTarget) {
  const [theme, setTheme] = useState<ThemePreference>(defaultThemePreference);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    void getThemePreference().then((storedTheme) => {
      if (!isActive) {
        return;
      }

      setTheme(storedTheme);
      if (target) {
        applyThemeClass(target, storedTheme);
      }

      setIsReady(true);
    });

    const unsubscribe = onThemePreferenceChange((nextTheme) => {
      if (!isActive) {
        return;
      }

      setTheme(nextTheme);
      if (target) {
        applyThemeClass(target, nextTheme);
      }

      setIsReady(true);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [target]);

  const updateTheme = async (nextTheme: ThemePreference) => {
    setTheme(nextTheme);
    if (target) {
      applyThemeClass(target, nextTheme);
    }
    await setThemePreference(nextTheme);
  };

  return {
    isDark: theme === "dark",
    isReady,
    theme,
    setTheme: updateTheme,
  };
}
