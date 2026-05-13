import { useCallback, useEffect, useState } from "react";
import { LogOutIcon, RefreshCcwIcon } from "lucide-react";

import { AssetAccessList } from "@/components/asset-manager/AssetAccessList";
import { BootstrapSkeleton } from "@/components/asset-manager/BootstrapSkeleton";
import { ExtensionHeader } from "@/components/asset-manager/ExtensionHeader";
import { ProxyConflictExtensionList } from "@/components/asset-manager/ProxyConflictExtensionList";
import { ProfilePanel } from "@/components/asset-manager/ProfilePanel";
import { RenewalActions } from "@/components/asset-manager/RenewalActions";
import { StatusNotice } from "@/components/asset-manager/StatusNotice";
import { SubscriptionSummary } from "@/components/asset-manager/SubscriptionSummary";
import { UnauthenticatedPanel } from "@/components/asset-manager/UnauthenticatedPanel";
import { VersionGatePanel } from "@/components/asset-manager/VersionGatePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getExtensionApiBaseUrl } from "@/lib/api/extensionApiConfig";
import type {
  ExtensionAssetResponse,
  ExtensionAssetSummary,
  ExtensionBootstrap,
} from "@/lib/api/extensionApiTypes";
import type { AssetProxyState } from "@/lib/proxy/assetProxy";
import { getAutomaticAssetMode } from "@/lib/asset-access/mode";
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { isSubscriptionActive } from "@/lib/asset-access/subscription";
import { disableManagedExtension } from "@/lib/proxy/proxyExtensionManagement";
import { runtimeMessageType, type BootstrapRuntimeValue } from "@/lib/runtime/messages";
import { sendRuntimeMessage } from "@/lib/runtime/sendRuntimeMessage";
import {
  bootstrapCacheStorageKey,
  createBootstrapCacheRecord,
  type BootstrapCacheRecord,
} from "@/lib/storage/bootstrapCache";
import { assetProxyStateStorageKey, readAssetProxyState } from "@/lib/storage/assetProxyState";
import { useThemePreference } from "@/lib/useThemePreference";

import { PopupShell } from "./ui/PopupShell";

type PopupView = "main" | "profile";

export function PopupApp() {
  const themeTarget = typeof document === "undefined" ? null : document.documentElement;
  const { isReady: isThemeReady, theme, setTheme } = useThemePreference(themeTarget);
  const apiBaseUrl = getExtensionApiBaseUrl();
  const [bootstrapValue, setBootstrapValue] = useState<BootstrapRuntimeValue | null>(null);
  const [assetProxyState, setAssetProxyState] = useState<AssetProxyState | null>(null);
  const [popupView, setPopupView] = useState<PopupView>("main");
  const [accessingPlatform, setAccessingPlatform] = useState<AssetPlatform | null>(null);
  const [assetAccessErrorMessage, setAssetAccessErrorMessage] = useState<string | null>(null);
  const [disablingProxyExtensionId, setDisablingProxyExtensionId] = useState<string | null>(null);
  const [proxyConflictActionErrorMessage, setProxyConflictActionErrorMessage] = useState<string | null>(null);
  const [redeemErrorMessage, setRedeemErrorMessage] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const snapshot = bootstrapValue?.cache?.snapshot ?? null;
  const isSyncing = Boolean(bootstrapValue?.isSyncing || isRefreshing);
  const proxyConflictMessage = assetProxyState?.conflict.isActive ? assetProxyState.conflict.message : null;

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
    void requestAssetProxyState();
  }, []);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return () => {};
    }

    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      if (bootstrapCacheStorageKey in changes) {
        const nextCache = changes[bootstrapCacheStorageKey]?.newValue as BootstrapCacheRecord | undefined;

        setBootstrapValue({ cache: nextCache ?? null, isSyncing: false });
        setIsRefreshing(false);
      }

      if (assetProxyStateStorageKey in changes) {
        const nextAssetProxyState = changes[assetProxyStateStorageKey]?.newValue as
          | AssetProxyState
          | undefined;

        setAssetProxyState(nextAssetProxyState ?? null);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (!assetProxyState?.conflict.isActive) {
      setDisablingProxyExtensionId(null);
      setProxyConflictActionErrorMessage(null);
    }
  }, [assetProxyState?.conflict.isActive]);

  const handleRefreshBootstrap = () => {
    void refreshBootstrap();
  };

  const handleAccessAsset = (asset: ExtensionAssetSummary) => {
    if (proxyConflictMessage) {
      setAssetAccessErrorMessage(proxyConflictMessage);
      return;
    }

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

  const handleDisableProxyExtension = async (extensionId: string) => {
    setDisablingProxyExtensionId(extensionId);
    setProxyConflictActionErrorMessage(null);

    try {
      await disableManagedExtension(extensionId);

      const refreshResult = await sendRuntimeMessage<AssetProxyState>({
        type: runtimeMessageType.proxyConflictRefreshRequested,
      });

      if (!refreshResult.value) {
        throw new Error(refreshResult.errorMessage ?? "Status konflik proxy belum bisa diperbarui.");
      }

      setAssetProxyState(refreshResult.value);
    } catch (error) {
      setProxyConflictActionErrorMessage(getErrorMessage(error));
    } finally {
      setDisablingProxyExtensionId(null);
    }
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
        <div className="flex flex-col gap-4">
          {proxyConflictMessage ? renderProxyConflictPanel() : null}
          <UnauthenticatedPanel loginUrl={getAbsoluteApiUrl(apiBaseUrl, snapshot.auth.loginUrl)} />
        </div>
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

        {proxyConflictMessage ? renderProxyConflictPanel() : null}

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
              isAccessBlocked={Boolean(proxyConflictMessage)}
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

  async function requestAssetProxyState() {
    const nextAssetProxyState = await readAssetProxyState();

    setAssetProxyState(nextAssetProxyState);
  }

  function renderProxyConflictPanel() {
    const conflictExtensions = assetProxyState?.conflict.extensions ?? [];

    return (
      <div className="flex flex-col gap-3">
        <StatusNotice
          message={proxyConflictMessage ?? "Proxy lain aktif."}
          title="Proxy lain aktif"
          tone="danger"
        />

        <section className="rounded-[24px] border border-red-500/16 bg-linear-to-b from-red-500/[0.08] via-red-500/[0.03] to-background p-3.5 shadow-sm shadow-red-500/5">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Extension terdeteksi</h2>
                  {conflictExtensions.length > 0 ? (
                    <Badge
                      className="border-red-500/15 bg-red-500/10 text-red-600 dark:text-red-300"
                      variant="secondary"
                    >
                      {conflictExtensions.length} aktif
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Nonaktifkan proxy lain untuk lanjut.
                </p>
              </div>
            </div>

            {proxyConflictActionErrorMessage ? (
              <StatusNotice message={proxyConflictActionErrorMessage} title="Aksi gagal" tone="warning" />
            ) : null}

            <ProxyConflictExtensionList
              compact
              conflictExtensions={conflictExtensions}
              disablingExtensionId={disablingProxyExtensionId}
              onDisableExtension={handleDisableProxyExtension}
            />
          </div>
        </section>
      </div>
    );
  }
}

function getAbsoluteApiUrl(apiBaseUrl: string, path: string): string {
  return new URL(path, apiBaseUrl).toString();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Permintaan gagal diproses.";
}

function getExtensionVersion(): string {
  if (typeof chrome === "undefined" || !chrome.runtime?.getManifest) {
    return "0.0.0";
  }

  return chrome.runtime.getManifest().version;
}
