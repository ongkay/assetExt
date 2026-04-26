import { useState } from "react";
import { Logo } from "@/component/Logo";
import { runtimeMessageType } from "@/lib/runtime/messages";
import { StatusText } from "./ui/StatusText";

const manifest =
  typeof chrome !== "undefined" && chrome.runtime?.getManifest
    ? chrome.runtime.getManifest()
    : null;

const extensionName = manifest?.name ?? "Extension";
const extensionVersion = manifest?.version ?? "0.0.0";

export function OptionsApp() {
  const [status, setStatus] = useState("");

  const handleResetBadge = () => {
    if (typeof chrome === "undefined") {
      return;
    }

    chrome.runtime.sendMessage({ type: runtimeMessageType.resetBadge }, () => {
      if (chrome.runtime.lastError) {
        setStatus("Unable to reset badge.");
        return;
      }

      setStatus("Badge cleared.");
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 px-6 py-8 text-white">
      <div className="flex items-center gap-3">
        <Logo className="h-10 w-10 shrink-0" title="Extension logo" />
        <div>
          <h1 className="text-lg font-semibold">{extensionName} Settings</h1>
          <p className="text-sm text-gray-400">Version {extensionVersion}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold">Toolbar badge demo</h2>
        <p className="mt-1 text-sm text-gray-400">
          Reset the demo badge count managed by the background service worker.
        </p>
        <button
          className="mt-4 inline-flex items-center rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
          type="button"
          onClick={handleResetBadge}
        >
          Reset badge count
        </button>
        <StatusText status={status} />
      </div>
    </div>
  );
}
