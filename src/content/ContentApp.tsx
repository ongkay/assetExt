import { useEffect, useState } from "react";

import {
  detectAssetPlatformFromHostname,
  getAssetPlatformConfig,
  type AssetPlatform,
} from "@/lib/asset-access/platforms";
import type { ExtensionAssetResponse, ExtensionMode } from "@/lib/api/extensionApiTypes";
import {
  runtimeMessageType,
  type RuntimeMessage,
  type RuntimeResponse,
} from "@/lib/runtime/messages";
import { useThemePreference } from "@/lib/useThemePreference";

import { markRecentAutoAccessReload } from "./autoAccessReloadGuard";
import { installTradingViewAvatarOverride } from "./dom/installTradingViewAvatarOverride";
import { prepareManualAutoAccessPageLoad } from "./pageLoadControl";
import { AccessOverlay } from "./ui/AccessOverlay";

type ContentAppProps = {
  themeRoot: HTMLDivElement;
};

type AccessOverlayState = "idle" | "loading" | "success" | "error";

type AutoAccessRequest = {
  mode?: ExtensionMode;
  platform: AssetPlatform;
};

export function ContentApp({ themeRoot }: ContentAppProps) {
  const { isReady } = useThemePreference(themeRoot);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<AccessOverlayState>("idle");
  const platform = detectAssetPlatformFromHostname(window.location.hostname);

  useEffect(() => {
    if (platform !== "tradingview") {
      return;
    }

    return installTradingViewAvatarOverride();
  }, [platform]);

  useEffect(() => {
    if (!platform) {
      return;
    }

    async function requestAutoAccessUnlessPopupNavigation(platform: AssetPlatform) {
      const shouldRunManualAutoAccess = await prepareManualAutoAccessPageLoad(platform);

      if (!shouldRunManualAutoAccess) {
        return;
      }

      await requestAutoAccess({ platform });
    }

    void requestAutoAccessUnlessPopupNavigation(platform);
  }, [platform]);

  async function requestAutoAccess({ mode, platform }: AutoAccessRequest) {
    const platformLabel = getAssetPlatformConfig(platform).label;

    setState("loading");
    setMessage(
      mode ? `Mengaktifkan akses ${platformLabel}...` : `Memeriksa akses ${platformLabel}...`,
    );

    const result = await sendRuntimeMessage<ExtensionAssetResponse>({
      mode,
      platform,
      type: runtimeMessageType.autoAccessRequested,
    });

    if (result.errorMessage || !result.value) {
      setMessage(result.errorMessage ?? "Akses asset belum tersedia.");
      setState("error");
      return;
    }

    if (result.value.status === "selection_required") {
      setMessage("Mode akses belum bisa ditentukan otomatis.");
      setState("error");
      return;
    }

    if (result.value.status === "forbidden") {
      setMessage("Langganan aktif diperlukan untuk membuka asset ini.");
      setState("error");
      return;
    }

    setMessage("Akses aktif. Halaman akan dimuat ulang.");
    setState("success");
    markRecentAutoAccessReload(platform);
    window.setTimeout(() => window.location.reload(), 500);
  }

  if (!isReady) {
    return null;
  }

  return <AccessOverlay message={message} platform={platform} state={state} />;
}

type RuntimeMessageResult<TValue> = {
  errorMessage: string | null;
  value: TValue | null;
};

async function sendRuntimeMessage<TValue>(
  message: RuntimeMessage,
): Promise<RuntimeMessageResult<TValue>> {
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
