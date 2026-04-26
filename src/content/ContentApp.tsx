import { useEffect, useState } from "react";
import { runtimeMessageType, type ToggleUiResponse } from "@/lib/runtime/messages";
import { OverlayPanel } from "./ui/OverlayPanel";

export function ContentApp() {
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
      isVisible={isVisible}
      onHide={() => setIsVisible(false)}
      onShow={() => setIsVisible(true)}
      onIncrementBadge={handleIncrementBadge}
    />
  );
}
