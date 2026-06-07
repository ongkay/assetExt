import { useCallback, useEffect, useState } from "react";
import { LogOutIcon, RefreshCcwIcon, ShieldAlertIcon } from "lucide-react";

import { AssetAccessList } from "@/components/asset-manager/AssetAccessList";
import { BootstrapSkeleton } from "@/components/asset-manager/BootstrapSkeleton";
import { ExtensionHeader } from "@/components/asset-manager/ExtensionHeader";
import { InactiveSubscriptionPanel } from "@/components/asset-manager/InactiveSubscriptionPanel";
import { ProxyConflictExtensionList } from "@/components/asset-manager/ProxyConflictExtensionList";
import { ProfilePanel } from "@/components/asset-manager/ProfilePanel";
import { RenewalActions } from "@/components/asset-manager/RenewalActions";
import { StatusNotice } from "@/components/asset-manager/StatusNotice";
import { SubscriptionSummary } from "@/components/asset-manager/SubscriptionSummary";
import { UnauthenticatedPanel } from "@/components/asset-manager/UnauthenticatedPanel";
import { VersionGatePanel } from "@/components/asset-manager/VersionGatePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { getExtensionApiBaseUrl } from "@/lib/api/extensionApiConfig";
import type {
  ExtensionAssetResponse,
  ExtensionAssetSummary,
  ExtensionBootstrap,
} from "@/lib/api/extensionApiTypes";
import { createUnblockedCookieGuardState, type CookieGuardState } from "@/lib/cookie-guard/cookieGuardState";
import type { AssetProxyState } from "@/lib/proxy/assetProxy";
import type { PeerGuardState } from "@/lib/peer-guard/peerGuardState";
import { createUnblockedPeerGuardState } from "@/lib/peer-guard/peerGuardState";
import { getAutomaticAssetMode } from "@/lib/asset-access/mode";
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { isSubscriptionActive, isSubscriptionInactive } from "@/lib/asset-access/subscription";
import { disableManagedExtension, uninstallManagedExtension } from "@/lib/proxy/proxyExtensionManagement";
import { runtimeMessageType, type BootstrapRuntimeValue } from "@/lib/runtime/messages";
import { sendRuntimeMessage } from "@/lib/runtime/sendRuntimeMessage";
import { cookieGuardStateStorageKey } from "@/lib/cookie-guard/cookieGuardConfig";
import { peerGuardStateStorageKey } from "@/lib/peer-guard/peerGuardConfig";
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
  const [cookieGuardState, setCookieGuardState] = useState<CookieGuardState | null>(null);
  const [peerGuardState, setPeerGuardState] = useState<PeerGuardState | null>(null);
  const [popupView, setPopupView] = useState<PopupView>("main");
  const [accessingPlatform, setAccessingPlatform] = useState<AssetPlatform | null>(null);
  const [assetAccessErrorMessage, setAssetAccessErrorMessage] = useState<string | null>(null);
  const [disablingProxyExtensionId, setDisablingProxyExtensionId] = useState<string | null>(null);
  const [uninstallingProxyExtensionId, setUninstallingProxyExtensionId] = useState<string | null>(null);
  const [proxyConflictActionErrorMessage, setProxyConflictActionErrorMessage] = useState<string | null>(null);
  const [disablingCookieExtensionId, setDisablingCookieExtensionId] = useState<string | null>(null);
  const [uninstallingCookieExtensionId, setUninstallingCookieExtensionId] = useState<string | null>(null);
  const [cookieGuardActionErrorMessage, setCookieGuardActionErrorMessage] = useState<string | null>(null);
  const [redeemErrorMessage, setRedeemErrorMessage] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingCookieGuard, setIsRefreshingCookieGuard] = useState(false);
  const snapshot = bootstrapValue?.cache?.snapshot ?? null;
  const isSyncing = Boolean(bootstrapValue?.isSyncing || isRefreshing);
  const isCookieGuardBlocked = cookieGuardState?.isBlocked === true;
  const isPeerGuardBlocked = peerGuardState?.isBlocked === true;
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
      setAssetAccessErrorMessage(assetResult.errorMessage ?? "Silahkan coba lagi");
      return;
    }

    const assetResponse = assetResult.value;

    if (assetResponse.status === "forbidden") {
      setAssetAccessErrorMessage("Subscription not active");
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

        setBootstrapValue((currentBootstrapValue) => ({
          cache: nextCache ?? null,
          cookieGuardState: currentBootstrapValue?.cookieGuardState ?? createUnblockedCookieGuardState(),
          isSyncing: false,
          peerGuardState: currentBootstrapValue?.peerGuardState ?? createUnblockedPeerGuardState("ext-1"),
        }));
        setIsRefreshing(false);
      }

      if (cookieGuardStateStorageKey in changes) {
        const nextCookieGuardState = changes[cookieGuardStateStorageKey]?.newValue as
          | CookieGuardState
          | undefined;

        setCookieGuardState(nextCookieGuardState ?? null);

        if (nextCookieGuardState && !nextCookieGuardState.isBlocked) {
          void requestBootstrap();
          void requestAssetProxyState();
        }
      }

      if (assetProxyStateStorageKey in changes) {
        const nextAssetProxyState = changes[assetProxyStateStorageKey]?.newValue as
          | AssetProxyState
          | undefined;

        setAssetProxyState(nextAssetProxyState ?? null);
      }

      if (peerGuardStateStorageKey in changes) {
        const nextPeerGuardState = changes[peerGuardStateStorageKey]?.newValue as PeerGuardState | undefined;

        setPeerGuardState(nextPeerGuardState ?? null);

        if (nextPeerGuardState && !nextPeerGuardState.isBlocked) {
          void requestBootstrap();
          void requestAssetProxyState();
        }
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (!cookieGuardState?.isBlocked) {
      setDisablingCookieExtensionId(null);
      setUninstallingCookieExtensionId(null);
      setCookieGuardActionErrorMessage(null);
    }
  }, [cookieGuardState?.isBlocked]);

  useEffect(() => {
    if (!assetProxyState?.conflict.isActive) {
      setDisablingProxyExtensionId(null);
      setUninstallingProxyExtensionId(null);
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
      setAssetAccessErrorMessage("Ada masalah teknis, tnggu beberapa saat atau silahkan hub. admin");
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
      setRedeemErrorMessage(
        redeemResult.errorMessage ?? "Redeem code gagal diproses. Coba lagi beberapa saat.",
      );
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
        throw new Error(refreshResult.errorMessage ?? "Status konflik VPN belum bisa diperbarui.");
      }

      setAssetProxyState(refreshResult.value);
    } catch (error) {
      setProxyConflictActionErrorMessage(getErrorMessage(error));
    } finally {
      setDisablingProxyExtensionId(null);
    }
  };

  const handleUninstallProxyExtension = async (extensionId: string) => {
    setUninstallingProxyExtensionId(extensionId);
    setProxyConflictActionErrorMessage(null);

    try {
      await uninstallManagedExtension(extensionId);

      const refreshResult = await sendRuntimeMessage<AssetProxyState>({
        type: runtimeMessageType.proxyConflictRefreshRequested,
      });

      if (!refreshResult.value) {
        throw new Error(refreshResult.errorMessage ?? "Status konflik VPN belum bisa diperbarui.");
      }

      setAssetProxyState(refreshResult.value);
    } catch (error) {
      setProxyConflictActionErrorMessage(getErrorMessage(error));
    } finally {
      setUninstallingProxyExtensionId(null);
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

  if (isCookieGuardBlocked) {
    return renderCookieGuardBlockedState();
  }

  if (isPeerGuardBlocked) {
    return renderPeerGuardBlockedState();
  }

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
          message="Data terbaru belum tersedia. Refresh data untuk mencoba sinkron ulang."
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
  const hasInactiveSubscription = isSubscriptionInactive(snapshot.subscription.status);

  return (
    <PopupShell isThemeReady={isThemeReady}>
      <div className="flex flex-1 flex-col">
        <ExtensionHeader
          subtitle="TradingView Premium Solution"
          title="TvLink Extension"
          user={snapshot.user}
          version={getExtensionVersion()}
          onOpenProfile={() => setPopupView("profile")}
        />

        {snapshot.version.status === "update_available" ? (
          <StatusNotice
            message={`Versi ${snapshot.version.latestVersion} tersedia. Update untuk bisa akses versi terbaru`}
            title="Update tersedia"
            tone="info"
          />
        ) : null}

        {bootstrapValue?.cache?.lastErrorMessage ? (
          <StatusNotice
            message={bootstrapValue.cache.lastErrorMessage}
            title="Filed to sync data"
            tone="warning"
          />
        ) : null}

        <SubscriptionSummary subscription={snapshot.subscription} />

        {hasProcessedSubscription ? (
          <StatusNotice
            message="Akses tv premium full private sedang diproses. untuk sementara silahkan gunakan tv semiprivate terlebih dahulu."
            title="Subscription diproses"
            tone="info"
          />
        ) : null}

        {assetAccessErrorMessage ? (
          <StatusNotice message={assetAccessErrorMessage} title="Access Failed" tone="danger" />
        ) : null}

        {proxyConflictMessage ? renderProxyConflictPanel() : null}

        {hasInactiveSubscription ? (
          <InactiveSubscriptionPanel
            apiBaseUrl={apiBaseUrl}
            errorMessage={redeemErrorMessage ?? undefined}
            isRedeeming={isRedeeming}
            redeem={snapshot.redeem}
            subscription={snapshot.subscription}
            onRedeemCdKey={handleRedeemCdKey}
          />
        ) : null}

        {!hasInactiveSubscription && packages.length > 0 ? (
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
          <AssetAccessList
            assets={assets}
            isAccessBlocked={Boolean(proxyConflictMessage)}
            isAccessingPlatform={accessingPlatform}
            onAccessAsset={handleAccessAsset}
          />
        ) : null}

        <footer className="mt-auto grid grid-cols-2 gap-2.5 border-t border-tvlink-app-border pt-4">
          <button
            className="group inline-flex h-10 items-center justify-center gap-2 rounded-tvlink-button border border-tvlink-app-border bg-tvlink-card-bg text-sm font-semibold text-tvlink-text-strong shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-tvlink-primary-border hover:bg-tvlink-primary-soft hover:text-tvlink-primary-hover hover:shadow-tvlink-soft active:translate-y-0"
            disabled={isSyncing}
            type="button"
            onClick={handleRefreshBootstrap}
          >
            {isSyncing ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCcwIcon
                className="h-4 w-4 transition duration-200 group-hover:rotate-45"
                strokeWidth={2}
              />
            )}
            <span>Refresh</span>
          </button>
          <button
            className="group inline-flex h-10 items-center justify-center gap-2 rounded-tvlink-button border border-tvlink-danger-border bg-tvlink-danger-bg text-sm font-semibold text-tvlink-danger shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-tvlink-danger-hover-bg hover:text-tvlink-danger-hover hover:shadow-tvlink-soft active:translate-y-0"
            disabled={isLoggingOut}
            type="button"
            onClick={() => void handleLogout()}
          >
            {isLoggingOut ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <LogOutIcon
                className="h-4 w-4 transition duration-200 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            )}
            <span>Logout</span>
          </button>
        </footer>
      </div>
    </PopupShell>
  );

  async function requestBootstrap() {
    const nextBootstrapValue = await sendRuntimeMessage<BootstrapRuntimeValue>({
      type: runtimeMessageType.bootstrapRequested,
    });

    if (nextBootstrapValue.value) {
      setBootstrapValue(nextBootstrapValue.value);
      setCookieGuardState(nextBootstrapValue.value.cookieGuardState);
      setPeerGuardState(nextBootstrapValue.value.peerGuardState);
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
    setBootstrapValue((currentBootstrapValue) => ({
      cache,
      cookieGuardState: currentBootstrapValue?.cookieGuardState ?? createUnblockedCookieGuardState(),
      isSyncing: false,
      peerGuardState: currentBootstrapValue?.peerGuardState ?? createUnblockedPeerGuardState("ext-1"),
    }));
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
          message={proxyConflictMessage ?? "VPN lain aktif."}
          title="VPN lain aktif"
          tone="danger"
        />

        <section className="rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-card-bg p-4 shadow-tvlink-soft">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-tvlink-text-strong">Extension terdeteksi</h2>
                  {conflictExtensions.length > 0 ? (
                    <Badge
                      className="border-tvlink-danger-border bg-tvlink-danger-bg text-tvlink-danger"
                      variant="secondary"
                    >
                      {conflictExtensions.length} aktif
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-tvlink-muted">Nonaktifkan VPN lain untuk lanjut.</p>
              </div>
            </div>

            {proxyConflictActionErrorMessage ? (
              <StatusNotice message={proxyConflictActionErrorMessage} title="Aksi gagal" tone="warning" />
            ) : null}

            <ProxyConflictExtensionList
              compact
              conflictKind="proxy"
              conflictExtensions={conflictExtensions}
              disablingExtensionId={disablingProxyExtensionId}
              onDisableExtension={handleDisableProxyExtension}
              onUninstallExtension={handleUninstallProxyExtension}
              uninstallingExtensionId={uninstallingProxyExtensionId}
            />
          </div>
        </section>
      </div>
    );
  }

  function renderPeerGuardBlockedState() {
    return (
      <PopupShell isThemeReady={isThemeReady}>
        <Empty className="min-h-[350px] gap-3 rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg px-6 py-10 shadow-tvlink-soft">
          <EmptyHeader className="gap-3">
            <EmptyMedia
              className="size-11 rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-danger-bg text-tvlink-danger [&_svg:not([class*='size-'])]:size-5"
              variant="icon"
            >
              <ShieldAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Akses diblokir</EmptyTitle>
            <EmptyDescription>{getBlockedPopupSummary(peerGuardState)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PopupShell>
    );
  }

  function renderCookieGuardBlockedState() {
    const conflictExtensions = cookieGuardState?.extensions ?? [];

    return (
      <PopupShell isThemeReady={isThemeReady}>
        <div className="flex min-h-[350px] flex-col gap-3 rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-card-bg px-4 py-5 shadow-tvlink-soft">
          <div className="flex items-start gap-3 rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-danger-bg px-4 py-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-card-bg text-tvlink-danger">
              <ShieldAlertIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-tvlink-text-strong">Akses diblokir</p>
              <p className="mt-1 text-sm leading-6 text-tvlink-muted">
                {cookieGuardState?.message ??
                  "Extension lain dengan permission cookies terdeteksi. Nonaktifkan extension tersebut untuk lanjut."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-1">
            <div>
              <p className="text-sm font-semibold text-tvlink-text-strong">Extension terdeteksi</p>
              <p className="text-xs leading-5 text-tvlink-muted">Matikan extension dibawah ini.</p>
            </div>
            <Button
              className="rounded-tvlink-button border-tvlink-danger-border bg-tvlink-card-bg text-tvlink-danger hover:bg-tvlink-danger-hover-bg hover:text-tvlink-danger-hover"
              disabled={isRefreshingCookieGuard}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => void handleRefreshCookieGuard()}
            >
              {isRefreshingCookieGuard ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RefreshCcwIcon data-icon="inline-start" />
              )}
              Periksa ulang
            </Button>
          </div>

          {cookieGuardActionErrorMessage ? (
            <StatusNotice message={cookieGuardActionErrorMessage} title="Aksi gagal" tone="warning" />
          ) : null}

          <ProxyConflictExtensionList
            compact
            conflictKind="cookies"
            conflictExtensions={conflictExtensions}
            disablingExtensionId={disablingCookieExtensionId}
            onDisableExtension={(extensionId) => void handleDisableCookieExtension(extensionId)}
            onUninstallExtension={(extensionId) => void handleUninstallCookieExtension(extensionId)}
            uninstallingExtensionId={uninstallingCookieExtensionId}
          />
        </div>
      </PopupShell>
    );
  }

  async function handleDisableCookieExtension(extensionId: string) {
    setDisablingCookieExtensionId(extensionId);
    setCookieGuardActionErrorMessage(null);

    try {
      await disableManagedExtension(extensionId);
      await handleRefreshCookieGuard();
    } catch (error) {
      setCookieGuardActionErrorMessage(getErrorMessage(error));
    } finally {
      setDisablingCookieExtensionId(null);
    }
  }

  async function handleUninstallCookieExtension(extensionId: string) {
    setUninstallingCookieExtensionId(extensionId);
    setCookieGuardActionErrorMessage(null);

    try {
      await uninstallManagedExtension(extensionId);
      await handleRefreshCookieGuard();
    } catch (error) {
      setCookieGuardActionErrorMessage(getErrorMessage(error));
    } finally {
      setUninstallingCookieExtensionId(null);
    }
  }

  async function handleRefreshCookieGuard() {
    setIsRefreshingCookieGuard(true);
    setCookieGuardActionErrorMessage(null);

    try {
      const refreshResult = await sendRuntimeMessage<CookieGuardState>({
        type: runtimeMessageType.cookieGuardRefreshRequested,
      });

      if (!refreshResult.value) {
        throw new Error(refreshResult.errorMessage ?? "Status conflict belum bisa update.");
      }

      setCookieGuardState(refreshResult.value);
    } catch (error) {
      setCookieGuardActionErrorMessage(getErrorMessage(error));
    } finally {
      setIsRefreshingCookieGuard(false);
    }
  }
}

function getBlockedPopupSummary(peerGuardState: PeerGuardState | null): string {
  if (peerGuardState?.reason === "peer_missing") {
    return `${peerGuardState.peerLabel} belum aktif. Aktifkan server.`;
  }

  return `${peerGuardState?.peerLabel ?? "Extension server"} dimatikan. silahkan aktifkan.`;
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
