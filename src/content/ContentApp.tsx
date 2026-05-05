import { useEffect, useState } from "react";

import { detectAssetPlatformFromHostname, type AssetPlatform } from "@/lib/asset-access/platforms";
import {
  runtimeMessageType,
  type AssetSessionEnsureResult,
  type RuntimeMessage,
  type RuntimeResponse,
} from "@/lib/runtime/messages";
import { useThemePreference } from "@/lib/useThemePreference";

import { installTvDomPatches } from "./dom/installTvDomPatches";
import { AccessOverlay } from "./ui/AccessOverlay";

type ContentAppProps = {
  themeRoot: HTMLDivElement;
};

type AccessOverlayState = "idle" | "loading" | "success" | "error";

export function ContentApp({ themeRoot }: ContentAppProps) {
  const { isReady } = useThemePreference(themeRoot);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<AccessOverlayState>("idle");
  const platform = detectAssetPlatformFromHostname(window.location.hostname);

  useEffect(() => {
    if (platform !== "tradingview") {
      return;
    }

    return installTvDomPatches();
  }, [platform]);

  useEffect(() => {
    if (!platform) {
      return;
    }

    let shouldIgnoreReload = false;

    void sendRuntimeMessage<null>({
      platform,
      type: runtimeMessageType.heartbeatStarted,
    });

    async function ensureAssetSession(platform: AssetPlatform) {
      const ensureResult = await sendRuntimeMessage<AssetSessionEnsureResult>({
        platform,
        type: runtimeMessageType.assetSessionEnsureRequested,
      });

      if (shouldIgnoreReload || ensureResult.value?.action !== "reload_required") {
        return;
      }

      setMessage("Akses aktif. Halaman akan dimuat ulang.");
      setState("loading");

      window.setTimeout(() => {
        if (!shouldIgnoreReload) {
          window.location.reload();
        }
      }, 500);
    }

    void ensureAssetSession(platform);

    return () => {
      shouldIgnoreReload = true;
    };
  }, [platform]);

  if (!isReady) {
    return null;
  }

  return <AccessOverlay message={message} platform={platform} state={state} />;
}

type RuntimeMessageResult<TValue> = {
  errorMessage: string | null;
  value: TValue | null;
};

async function sendRuntimeMessage<TValue>(message: RuntimeMessage): Promise<RuntimeMessageResult<TValue>> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    return { errorMessage: "Runtime extension tidak tersedia.", value: null };
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: RuntimeResponse<TValue> | undefined) => {
      if (chrome.runtime.lastError) {
        resolve({
          errorMessage: chrome.runtime.lastError.message ?? null,
          value: null,
        });
        return;
      }

      if (!response) {
        resolve({ errorMessage: null, value: null });
        return;
      }

      if (!response.ok) {
        resolve({ errorMessage: response.errorMessage, value: null });
        return;
      }

      resolve({ errorMessage: null, value: response.value });
    });
  });
}
