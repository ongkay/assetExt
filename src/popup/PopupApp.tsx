import { useState } from "react";
import { Logo } from "@/component/Logo";
import { runtimeMessageType } from "@/lib/runtime/messages";
import { ActionButton } from "./ui/ActionButton";

export function PopupApp() {
  const [status, setStatus] = useState("");

  const handleOpenOptions = () => {
    if (typeof chrome === "undefined") {
      return;
    }

    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
      return;
    }

    if (chrome.runtime?.getURL) {
      window.open(chrome.runtime.getURL("options.html"));
    }
  };

  const handleToggleUi = () => {
    if (typeof chrome === "undefined") {
      return;
    }

    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs?.[0]?.id;
      if (!tabId) {
        return;
      }

      chrome.tabs.sendMessage(tabId, { type: runtimeMessageType.toggleUi }, () => {
        if (chrome.runtime.lastError) {
          setStatus("No overlay on this page.");
          return;
        }
        setStatus("");
      });
    });
  };

  const handleIncrementBadge = () => {
    if (typeof chrome === "undefined") {
      return;
    }

    chrome.runtime.sendMessage({ type: runtimeMessageType.incrementBadge }, (response) => {
      if (chrome.runtime.lastError || !response) {
        setStatus("Could not update badge.");
        return;
      }
      setStatus("");
    });
  };

  return (
    <div className="w-[280px] bg-gray-900 p-4 text-white">
      <div className="flex items-center gap-3">
        <Logo className="h-8 w-8 shrink-0" title="My Extension logo" />
        <div className="min-w-0">
          <h1 className="text-sm font-semibold">My Extension</h1>
          <p className="text-xs text-gray-400">Popup tools for the active tab.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionButton variant="solid" onClick={handleToggleUi}>
          Overlay
        </ActionButton>
        <ActionButton onClick={handleIncrementBadge}>Badge +</ActionButton>
      </div>
      <button
        className="mt-3 text-xs text-gray-400 hover:text-white"
        type="button"
        onClick={handleOpenOptions}
      >
        Open settings
      </button>
      {status ? <p className="mt-2 text-[11px] text-gray-400">{status}</p> : null}
    </div>
  );
}
