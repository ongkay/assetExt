import { useCallback, useEffect, useState } from "react";
import { LogOutIcon, RefreshCcwIcon } from "lucide-react";

import { AssetAccessList } from "@/components/asset-manager/AssetAccessList";
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
  ExtensionAssetSummary,
  ExtensionBootstrap,
} from "@/lib/api/extensionApiTypes";
import { getAutomaticAssetMode } from "@/lib/asset-access/mode";
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { isSubscriptionActive } from "@/lib/asset-access/subscription";
import {
  runtimeMessageType,
  type BootstrapRuntimeValue,
  type RuntimeMessage,
  type RuntimeResponse,
} from "@/lib/runtime/messages";
import {
  bootstrapCacheStorageKey,
  createBootstrapCacheRecord,
  type BootstrapCacheRecord,
} from "@/lib/storage/bootstrapCache";
import { useThemePreference } from "@/lib/useThemePreference";

import { PopupShell } from "./ui/PopupShell";

type PopupView = "main" | "profile";

export function PopupApp() {
  const themeTarget = typeof document === "undefined" ? null : document.documentElement;
  const { isReady: isThemeReady, theme, setTheme } = useThemePreference(themeTarget);
  const apiBaseUrl = getExtensionApiBaseUrl();
  const [bootstrapValue, setBootstrapValue] = useState<BootstrapRuntimeValue | null>(null);
  const [popupView, setPopupView] = useState<PopupView>("main");
  const [accessingPlatform, setAccessingPlatform] = useState<AssetPlatform | null>(null);
  const [assetAccessErrorMessage, setAssetAccessErrorMessage] = useState<string | null>(null);
  const [redeemErrorMessage, setRedeemErrorMessage] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const snapshot = bootstrapValue?.cache?.snapshot ?? null;
  const isSyncing = Boolean(bootstrapValue?.isSyncing || isRefreshing);

  const requestAssetAccess = useCallback(async (platform: AssetPlatform) => {
    setAccessingPlatform(platform);
    setAssetAccessErrorMessage(null);

    const assetResult = await sendRuntimeMessage<ExtensionAssetResponse>({
      platform,
      type: runtimeMessageType.assetAccessRequested,
    });

    setAccessingPlatform(null);

    if (!assetResult.value) {
      setAssetAccessErrorMessage(
        assetResult.errorMessage ?? "Asset belum bisa dibuka. Coba refresh lalu akses ulang.",
      );
      return;
    }

    const assetResponse = assetResult.value;

    if (assetResponse.status === "forbidden") {
      setAssetAccessErrorMessage("Subscription aktif diperlukan untuk membuka asset ini.");
      return;
    }
  }, []);

  useEffect(() => {
    void requestBootstrap();
  }, []);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return () => {};
    }

    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      if (!(bootstrapCacheStorageKey in changes)) {
        return;
      }

      const nextCache = changes[bootstrapCacheStorageKey]?.newValue as BootstrapCacheRecord | undefined;

      setBootstrapValue({ cache: nextCache ?? null, isSyncing: false });
      setIsRefreshing(false);
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const handleRefreshBootstrap = () => {
    void refreshBootstrap();
  };

  const handleAccessAsset = (asset: ExtensionAssetSummary) => {
    const mode = getAutomaticAssetMode(asset);

    if (!mode) {
      setAssetAccessErrorMessage("Asset belum memiliki mode akses yang siap dipakai.");
      return;
    }

    void requestAssetAccess(asset.platform);
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
      setRedeemErrorMessage(redeemResult.errorMessage ?? "CD Key gagal diproses. Coba lagi beberapa saat.");
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
        <UnauthenticatedPanel loginUrl={getAbsoluteApiUrl(apiBaseUrl, snapshot.auth.loginUrl)} />
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
          theme={theme}
          user={snapshot.user}
          onBack={() => setPopupView("main")}
          onLogout={handleLogout}
          onThemeChange={(newTheme) => {
            void setTheme(newTheme);
          }}
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
          <StatusNotice message={assetAccessErrorMessage} title="Akses asset gagal" tone="danger" />
        ) : null}

        {packages.length > 0 ? (
          <RenewalActions
            apiBaseUrl={apiBaseUrl}
            errorMessage={redeemErrorMessage ?? undefined}
            isRedeeming={isRedeeming}
            packages={packages}
            redeem={snapshot.redeem}
            onRedeemCdKey={handleRedeemCdKey}
          />
        ) : null}

        {hasActiveSubscription ? (
          <div className="flex flex-col gap-2 mt-1">
            <AssetAccessList
              assets={assets}
              isAccessingPlatform={accessingPlatform}
              onAccessAsset={handleAccessAsset}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            className="relative overflow-hidden bg-white! hover:bg-muted! text-foreground! font-medium border! border-border/60! shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] active:translate-y-0 group/refresh"
            disabled={isSyncing}
            type="button"
            onClick={handleRefreshBootstrap}
          >
            {isSyncing ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCcwIcon
                className={
                  isSyncing
                    ? "animate-spin"
                    : "transition-transform duration-500 group-hover/refresh:rotate-180"
                }
                data-icon="inline-start"
              />
            )}
            Refresh
          </Button>
          <Button
            className="relative overflow-hidden bg-destructive/10! hover:bg-destructive/20! text-destructive! font-medium border! border-destructive/20! shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] active:translate-y-0 group/logout"
            disabled={isLoggingOut}
            type="button"
            onClick={() => void handleLogout()}
          >
            {isLoggingOut ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <LogOutIcon
                className="transition-transform duration-300 group-hover/logout:-translate-x-1"
                data-icon="inline-start"
              />
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
    setIsRefreshing(true);

    const bootstrapCache = await sendRuntimeMessage<BootstrapCacheRecord>({
      type: runtimeMessageType.bootstrapRefreshRequested,
    });

    setIsRefreshing(false);

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
