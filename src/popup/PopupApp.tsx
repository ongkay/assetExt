import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { LogOutIcon, RefreshCcwIcon } from "lucide-react";

import { AssetAccessList } from "@/components/asset-manager/AssetAccessList";
import { AssetModeChooser } from "@/components/asset-manager/AssetModeChooser";
import { BootstrapSkeleton } from "@/components/asset-manager/BootstrapSkeleton";
import { ExtensionHeader } from "@/components/asset-manager/ExtensionHeader";
import { ProfilePanel } from "@/components/asset-manager/ProfilePanel";
import { RenewalActions } from "@/components/asset-manager/RenewalActions";
import { StatusNotice } from "@/components/asset-manager/StatusNotice";
import { SubscriptionSummary } from "@/components/asset-manager/SubscriptionSummary";
import { UnauthenticatedPanel } from "@/components/asset-manager/UnauthenticatedPanel";
import { VersionGatePanel } from "@/components/asset-manager/VersionGatePanel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getExtensionApiBaseUrl } from "@/lib/api/extensionApiConfig";
import type {
  ExtensionAssetResponse,
  ExtensionAssetSelectionResponse,
  ExtensionBootstrap,
  ExtensionMode,
} from "@/lib/api/extensionApiTypes";
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { getAssetPlatformConfig } from "@/lib/asset-access/platforms";
import { isSubscriptionActive } from "@/lib/asset-access/subscription";
import {
  runtimeMessageType,
  type BootstrapRuntimeValue,
  type RuntimeMessage,
  type RuntimeResponse,
} from "@/lib/runtime/messages";
import type { BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";
import { createBootstrapCacheRecord } from "@/lib/storage/bootstrapCache";
import { useThemePreference } from "@/lib/useThemePreference";

import { PopupShell } from "./ui/PopupShell";

type PopupView = "main" | "profile";

type AssetModeSelection = ExtensionAssetSelectionResponse & {
  secondsRemaining: number;
};

export function PopupApp() {
  const themeTarget = typeof document === "undefined" ? null : document.documentElement;
  const { isReady: isThemeReady } = useThemePreference(themeTarget);
  const apiBaseUrl = getExtensionApiBaseUrl();
  const [bootstrapValue, setBootstrapValue] = useState<BootstrapRuntimeValue | null>(null);
  const [popupView, setPopupView] = useState<PopupView>("main");
  const [accessingPlatform, setAccessingPlatform] = useState<AssetPlatform | null>(null);
  const [assetModeSelection, setAssetModeSelection] = useState<AssetModeSelection | null>(
    null,
  );
  const [assetAccessErrorMessage, setAssetAccessErrorMessage] = useState<string | null>(null);
  const [redeemErrorMessage, setRedeemErrorMessage] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasSelectedDefaultModeRef = useRef(false);
  const snapshot = bootstrapValue?.cache?.snapshot ?? null;
  const isSyncing = Boolean(bootstrapValue?.isSyncing || isPending);

  const requestAssetAccess = useCallback(
    async (platform: AssetPlatform, mode?: ExtensionMode) => {
      setAccessingPlatform(platform);
      setAssetAccessErrorMessage(null);

      const assetResult = await sendRuntimeMessage<ExtensionAssetResponse>({
        mode,
        platform,
        type: runtimeMessageType.assetAccessRequested,
      });

      setAccessingPlatform(null);

      if (!assetResult.value) {
        setAssetAccessErrorMessage(
          assetResult.errorMessage ??
            "Asset belum bisa dibuka. Coba refresh lalu akses ulang.",
        );
        return;
      }

      const assetResponse = assetResult.value;

      if (assetResponse.status === "selection_required") {
        setAssetModeSelection({
          ...assetResponse,
          secondsRemaining: assetResponse.selectionTimeoutSeconds,
        });
        return;
      }

      if (assetResponse.status === "forbidden") {
        setAssetModeSelection(null);
        setAssetAccessErrorMessage("Subscription aktif diperlukan untuk membuka asset ini.");
        return;
      }

      setAssetModeSelection(null);
    },
    [],
  );

  const handleSelectAssetMode = useCallback(
    async (mode: ExtensionMode) => {
      const selectedPlatform = assetModeSelection?.platform;

      if (!selectedPlatform) {
        return;
      }

      setAssetModeSelection(null);
      await requestAssetAccess(selectedPlatform, mode);
    },
    [assetModeSelection?.platform, requestAssetAccess],
  );

  useEffect(() => {
    void requestBootstrap();
  }, []);

  useEffect(() => {
    if (!assetModeSelection) {
      hasSelectedDefaultModeRef.current = false;
      return;
    }

    if (assetModeSelection.secondsRemaining <= 0) {
      if (hasSelectedDefaultModeRef.current) {
        return;
      }

      hasSelectedDefaultModeRef.current = true;
      void handleSelectAssetMode(assetModeSelection.defaultMode);
      return;
    }

    const countdownId = window.setTimeout(() => {
      setAssetModeSelection((currentSelection) => {
        if (!currentSelection) {
          return null;
        }

        return {
          ...currentSelection,
          secondsRemaining: currentSelection.secondsRemaining - 1,
        };
      });
    }, 1_000);

    return () => window.clearTimeout(countdownId);
  }, [assetModeSelection, handleSelectAssetMode]);

  const handleRefreshBootstrap = () => {
    startTransition(() => {
      void refreshBootstrap();
    });
  };

  const handleAccessAsset = (platform: AssetPlatform) => {
    void requestAssetAccess(platform);
  };

  const handleRedeemCdKey = async (cdKeyCode: string) => {
    setIsRedeeming(true);
    setRedeemErrorMessage(null);

    const redeemResult = await sendRuntimeMessage<ExtensionBootstrap>({
      code: cdKeyCode,
      type: runtimeMessageType.redeemCdKeyRequested,
    });

    setIsRedeeming(false);

    if (!redeemResult.value) {
      setRedeemErrorMessage(
        redeemResult.errorMessage ?? "CD Key gagal diproses. Coba lagi beberapa saat.",
      );
      return;
    }

    updateBootstrapCache(createBootstrapCacheRecord(redeemResult.value));
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    await sendRuntimeMessage<{ redirectTo: string }>({
      type: runtimeMessageType.logoutRequested,
    });

    setIsLoggingOut(false);
    setPopupView("main");
    await requestBootstrap();
  };

  if (!snapshot) {
    return (
      <PopupShell isThemeReady={isThemeReady}>
        <BootstrapSkeleton />
      </PopupShell>
    );
  }

  if (snapshot.version.status === "update_required") {
    return (
      <PopupShell isThemeReady={isThemeReady}>
        <VersionGatePanel version={snapshot.version} />
      </PopupShell>
    );
  }

  if (snapshot.auth.status === "unauthenticated") {
    return (
      <PopupShell isThemeReady={isThemeReady}>
        <UnauthenticatedPanel
          loginUrl={getAbsoluteApiUrl(apiBaseUrl, snapshot.auth.loginUrl)}
        />
      </PopupShell>
    );
  }

  if (!snapshot.user || !snapshot.subscription) {
    return (
      <PopupShell isThemeReady={isThemeReady}>
        <StatusNotice
          message="Data user atau subscription belum tersedia dari Asset Manager. Refresh data untuk mencoba sinkron ulang."
          title="Data belum lengkap"
          tone="warning"
        />
      </PopupShell>
    );
  }

  if (popupView === "profile") {
    return (
      <PopupShell isThemeReady={isThemeReady}>
        <ProfilePanel
          isLoggingOut={isLoggingOut}
          user={snapshot.user}
          onBack={() => setPopupView("main")}
          onLogout={handleLogout}
        />
      </PopupShell>
    );
  }

  const assets = snapshot.assets ?? [];
  const packages = snapshot.packages ?? [];
  const hasProcessedSubscription = snapshot.subscription.status === "processed";
  const hasActiveSubscription = isSubscriptionActive(snapshot.subscription.status);

  return (
    <PopupShell isThemeReady={isThemeReady}>
      <div className="flex flex-col gap-4">
        <ExtensionHeader
          subtitle="Akses asset langsung dari extension."
          title="Asset Manager"
          user={snapshot.user}
          version={getExtensionVersion()}
          onOpenProfile={() => setPopupView("profile")}
        />

        {snapshot.version.status === "update_available" ? (
          <StatusNotice
            message={`Versi ${snapshot.version.latestVersion} tersedia. Update untuk mendapatkan perbaikan terbaru.`}
            title="Update tersedia"
            tone="info"
          />
        ) : null}

        {bootstrapValue?.cache?.lastErrorMessage ? (
          <StatusNotice
            message={bootstrapValue.cache.lastErrorMessage}
            title="Menggunakan cache terakhir"
            tone="warning"
          />
        ) : null}

        <SubscriptionSummary subscription={snapshot.subscription} />

        {hasProcessedSubscription ? (
          <StatusNotice
            message="Pembayaran sedang diproses. Akses akan aktif setelah konfirmasi selesai."
            title="Subscription diproses"
            tone="info"
          />
        ) : null}

        {assetAccessErrorMessage ? (
          <StatusNotice
            message={assetAccessErrorMessage}
            title="Akses asset gagal"
            tone="danger"
          />
        ) : null}

        {assetModeSelection ? (
          <AssetModeChooser
            key={`${assetModeSelection.platform}-${assetModeSelection.defaultMode}`}
            availableModes={assetModeSelection.availableModes}
            defaultMode={assetModeSelection.defaultMode}
            isSubmitting={accessingPlatform === assetModeSelection.platform}
            platformLabel={getAssetPlatformConfig(assetModeSelection.platform).label}
            secondsRemaining={assetModeSelection.secondsRemaining}
            onSelectMode={handleSelectAssetMode}
          />
        ) : null}

        <RenewalActions
          errorMessage={redeemErrorMessage ?? undefined}
          isRedeeming={isRedeeming}
          packages={packages}
          redeem={snapshot.redeem}
          onRedeemCdKey={handleRedeemCdKey}
        />

        {hasActiveSubscription ? (
          <AssetAccessList
            assets={assets}
            isAccessingPlatform={accessingPlatform}
            onAccessAsset={handleAccessAsset}
          />
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={isSyncing}
            type="button"
            variant="outline"
            onClick={handleRefreshBootstrap}
          >
            {isSyncing ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCcwIcon data-icon="inline-start" />
            )}
            Refresh
          </Button>
          <Button
            disabled={isLoggingOut}
            type="button"
            variant="outline"
            onClick={() => void handleLogout()}
          >
            {isLoggingOut ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <LogOutIcon data-icon="inline-start" />
            )}
            Logout
          </Button>
        </div>
      </div>
    </PopupShell>
  );

  async function requestBootstrap() {
    const nextBootstrapValue = await sendRuntimeMessage<BootstrapRuntimeValue>({
      type: runtimeMessageType.bootstrapRequested,
    });

    if (nextBootstrapValue.value) {
      setBootstrapValue(nextBootstrapValue.value);
    }
  }

  async function refreshBootstrap() {
    const bootstrapCache = await sendRuntimeMessage<BootstrapCacheRecord>({
      type: runtimeMessageType.bootstrapRefreshRequested,
    });

    if (bootstrapCache.value) {
      updateBootstrapCache(bootstrapCache.value);
    }
  }

  function updateBootstrapCache(cache: BootstrapCacheRecord) {
    setBootstrapValue({ cache, isSyncing: false });
  }
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
        resolve({
          errorMessage: response.errorMessage,
          value: null,
        });
        return;
      }

      resolve({ errorMessage: null, value: response.value });
    });
  });
}

function getAbsoluteApiUrl(apiBaseUrl: string, path: string): string {
  return new URL(path, apiBaseUrl).toString();
}

function getExtensionVersion(): string {
  if (typeof chrome === "undefined" || !chrome.runtime?.getManifest) {
    return "0.0.0";
  }

  return chrome.runtime.getManifest().version;
}
