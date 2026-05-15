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

const fallbackReloadMessage = "update data terbaru";

export function ContentApp({ themeRoot }: ContentAppProps) {
  const { isReady } = useThemePreference(themeRoot);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<AccessOverlayState>("idle");
  const platform = detectAssetPlatformFromHostname(window.location.hostname);
  const isTradingViewWebsite = isTradingViewHostname(window.location.hostname);

  useEffect(() => {
    if (platform !== "tradingview" || !isTradingViewWebsite) {
      return;
    }

    return installTvDomPatches();
  }, [isTradingViewWebsite, platform]);

  useEffect(() => {
    if (!platform) {
      return;
    }

    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) {
      return;
    }

    const handleOverlayStateChanged: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (
      message,
    ) => {
      if (message.type !== runtimeMessageType.overlayStateChanged) {
        return;
      }

      if (message.redirectTo) {
        window.location.assign(message.redirectTo);
        return;
      }

      setMessage(message.message);
      setState(message.state === "loading" ? "loading" : "idle");
    };

    chrome.runtime.onMessage.addListener(handleOverlayStateChanged);

    return () => {
      chrome.runtime.onMessage.removeListener(handleOverlayStateChanged);
    };
  }, [platform]);

  useEffect(() => {
    if (!platform) {
      return;
    }

    let shouldIgnoreReload = false;

    async function ensureAssetSession(platform: AssetPlatform) {
      const ensureResult = await sendRuntimeMessage<AssetSessionEnsureResult>({
        platform,
        type: runtimeMessageType.assetSessionEnsureRequested,
      });

      if (shouldIgnoreReload || !ensureResult.value) {
        return;
      }

      if (ensureResult.value.action === "redirect_login") {
        if (ensureResult.value.redirectTo) {
          window.location.assign(ensureResult.value.redirectTo);
        }

        return;
      }

      if (ensureResult.value.action === "peer_required") {
        if (ensureResult.value.redirectTo) {
          window.location.assign(ensureResult.value.redirectTo);
          return;
        }

        setMessage(ensureResult.value.message ?? fallbackReloadMessage);
        setState("error");
        return;
      }

      if (ensureResult.value.action === "proxy_blocked") {
        if (ensureResult.value.redirectTo) {
          window.location.assign(ensureResult.value.redirectTo);
          return;
        }

        setMessage(ensureResult.value.message ?? fallbackReloadMessage);
        setState("error");
        return;
      }

      if (ensureResult.value.action !== "reload_required") {
        if (ensureResult.value.shouldStartHeartbeat) {
          await sendRuntimeMessage<null>({
            platform,
            type: runtimeMessageType.heartbeatStarted,
          });
        }

        return;
      }

      setMessage(ensureResult.value.message ?? fallbackReloadMessage);
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

      void sendRuntimeMessage<null>({
        type: runtimeMessageType.heartbeatStopped,
      });
    };
  }, [platform]);

  if (!isReady) {
    return null;
  }

  return <AccessOverlay message={message} platform={platform} state={state} />;
}

function isTradingViewHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();

  return normalizedHostname === "tradingview.com" || normalizedHostname.endsWith(".tradingview.com");
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
