import { useEffect, useRef, useState } from "react";

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

import {
  markRecentAutoAccessReload,
  shouldSkipRecentAutoAccessReload,
} from "./autoAccessReloadGuard";
import { AccessOverlay } from "./ui/AccessOverlay";

type ContentAppProps = {
  themeRoot: HTMLDivElement;
};

type AccessOverlayState = "idle" | "loading" | "chooser" | "success" | "error";

type AutoAccessRequest = {
  mode?: ExtensionMode;
  platform: AssetPlatform;
};

export function ContentApp({ themeRoot }: ContentAppProps) {
  const { isReady } = useThemePreference(themeRoot);
  const [assetResponse, setAssetResponse] = useState<ExtensionAssetResponse>();
  const [message, setMessage] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [state, setState] = useState<AccessOverlayState>("idle");
  const platform = detectAssetPlatformFromHostname(window.location.hostname);
  const hasSubmittedSelectionRef = useRef(false);

  useEffect(() => {
    if (!platform) {
      return;
    }

    if (shouldSkipRecentAutoAccessReload(platform)) {
      return;
    }

    void requestAutoAccess({ platform });
  }, [platform]);

  useEffect(() => {
    if (state !== "chooser") {
      return;
    }

    const countdown = window.setInterval(() => {
      setSecondsRemaining((currentSecondsRemaining) => {
        if (currentSecondsRemaining <= 0) {
          return 0;
        }

        return currentSecondsRemaining - 1;
      });
    }, 1000);

    return () => window.clearInterval(countdown);
  }, [state]);

  useEffect(() => {
    if (
      state !== "chooser" ||
      secondsRemaining > 0 ||
      assetResponse?.status !== "selection_required" ||
      !platform ||
      hasSubmittedSelectionRef.current
    ) {
      return;
    }

    hasSubmittedSelectionRef.current = true;
    void requestAutoAccess({ mode: assetResponse.defaultMode, platform });
  }, [assetResponse, platform, secondsRemaining, state]);

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
      setAssetResponse(undefined);
      setMessage(result.errorMessage ?? "Akses asset belum tersedia.");
      setState("error");
      return;
    }

    setAssetResponse(result.value);

    if (result.value.status === "selection_required") {
      hasSubmittedSelectionRef.current = false;
      setSecondsRemaining(result.value.selectionTimeoutSeconds);
      setMessage(`Pilih mode akses untuk ${platformLabel}.`);
      setState("chooser");
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

  function handleSelectMode(mode: ExtensionMode) {
    if (!platform || hasSubmittedSelectionRef.current) {
      return;
    }

    hasSubmittedSelectionRef.current = true;
    void requestAutoAccess({ mode, platform });
  }

  if (!isReady) {
    return null;
  }

  return (
    <AccessOverlay
      assetResponse={assetResponse}
      message={message}
      platform={platform}
      secondsRemaining={secondsRemaining}
      state={state}
      onSelectMode={handleSelectMode}
    />
  );
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
