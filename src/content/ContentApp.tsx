import { useEffect, useState } from "react";

import { runtimeMessageType, type ToggleUiResponse } from "@/lib/runtime/messages";
import { useThemePreference } from "@/lib/useThemePreference";

import { OverlayPanel } from "./ui/OverlayPanel";

type ContentAppProps = {
  themeRoot: HTMLDivElement;
};

export function ContentApp({ themeRoot }: ContentAppProps) {
  const { isDark, isReady, setTheme } = useThemePreference(themeRoot);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handler = (
      message: { type?: string },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: ToggleUiResponse) => void,
    ) => {
      if (message.type !== runtimeMessageType.toggleUi) {
        return;
      }

      setIsVisible((current) => {
        const next = !current;
        sendResponse({ visible: next });
        return next;
      });

      return true;
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const handleIncrementBadge = () => {
    if (typeof chrome === "undefined") {
      return;
    }

    chrome.runtime.sendMessage({ type: runtimeMessageType.incrementBadge });
  };

  return (
    <OverlayPanel
      isDark={isDark}
      isReady={isReady}
      isVisible={isVisible}
      onHide={() => setIsVisible(false)}
      onIncrementBadge={handleIncrementBadge}
      onShow={() => setIsVisible(true)}
      onThemeChange={(checked) => void setTheme(checked ? "dark" : "light")}
    />
  );
}
