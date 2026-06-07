import { useEffect, useState } from "react";
import { PlugZapIcon, RefreshCcwIcon } from "lucide-react";

import { ProxyConflictExtensionList } from "@/components/asset-manager/ProxyConflictExtensionList";
import { StatusNotice } from "@/components/asset-manager/StatusNotice";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { type AssetProxyState, assetProxyConflictMessage } from "@/lib/proxy/assetProxy";
import { disableManagedExtension, uninstallManagedExtension } from "@/lib/proxy/proxyExtensionManagement";
import { runtimeMessageType } from "@/lib/runtime/messages";
import { sendRuntimeMessage } from "@/lib/runtime/sendRuntimeMessage";
import { assetProxyStateStorageKey, readAssetProxyState } from "@/lib/storage/assetProxyState";

export function ProxyBlockedApp() {
  const [assetProxyState, setAssetProxyState] = useState<AssetProxyState | null>(null);
  const [disablingProxyExtensionId, setDisablingProxyExtensionId] = useState<string | null>(null);
  const [uninstallingProxyExtensionId, setUninstallingProxyExtensionId] = useState<string | null>(null);
  const [proxyConflictActionErrorMessage, setProxyConflictActionErrorMessage] = useState<string | null>(null);
  const [isRefreshingConflict, setIsRefreshingConflict] = useState(false);
  const isLoadingProxyState = assetProxyState === null;
  const proxyConflictState = assetProxyState?.conflict ?? null;
  const isProxyConflictActive = proxyConflictState?.isActive === true;
  const proxyConflictMessage = proxyConflictState?.isActive
    ? (proxyConflictState.message ?? assetProxyConflictMessage)
    : null;
  const pageStatusLabel = isLoadingProxyState
    ? "checking"
    : isProxyConflictActive
      ? "access denied"
      : "access restored";
  const pageMessage = isLoadingProxyState
    ? "TvLink sedang memeriksa status VPN."
    : isProxyConflictActive
      ? (proxyConflictMessage ?? "VPN lain sedang aktif. Nonaktifkan agar akses kembali.")
      : "Akses sudah dipulihkan.";

  useEffect(() => {
    void readAssetProxyState().then(setAssetProxyState);
  }, []);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return () => {};
    }

    const handleStorageChange: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      areaName,
    ) => {
      if (areaName !== "local" || !(assetProxyStateStorageKey in changes)) {
        return;
      }

      const nextAssetProxyState = changes[assetProxyStateStorageKey]?.newValue as AssetProxyState | undefined;
      setAssetProxyState(nextAssetProxyState ?? null);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!proxyConflictState?.isActive) {
      setDisablingProxyExtensionId(null);
      setUninstallingProxyExtensionId(null);
      setProxyConflictActionErrorMessage(null);
    }
  }, [proxyConflictState?.isActive]);

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,_#ecf6ff_0%,_#e6f2ff_45%,_#dcecff_100%)] p-4 text-[#2d4962] antialiased [font-family:ui-sans-serif,system-ui,sans-serif]">
      <section
        aria-labelledby="proxy-warning-title"
        className="mx-auto flex min-h-[calc(100dvh-32px)] w-full max-w-[420px] items-center justify-center"
      >
        <article className="w-full overflow-hidden rounded-2xl border border-[#fed7aa] bg-white shadow-[0_18px_34px_rgba(217,119,6,0.18)]">
          <div className="relative px-6 pb-6 pt-7 text-center [background:radial-gradient(circle_at_top,rgba(251,191,36,0.28),transparent_48%),linear-gradient(180deg,#ffffff_0%,#fffaf0_100%)]">
            <div className="pointer-events-none absolute left-5 top-5 size-2 rounded-full bg-[#d97706]/35" />
            <div className="pointer-events-none absolute right-7 top-9 size-3 rounded-full bg-[#d97706]/25" />
            <div className="pointer-events-none absolute bottom-6 left-8 size-2.5 rounded-full bg-[#d97706]/20" />

            <div className="mx-auto mb-5 grid size-[76px] place-items-center rounded-2xl border border-[#fed7aa] bg-[#fff7ed] text-[#d97706] shadow-[0_12px_24px_rgba(22,50,74,0.08)]">
              <WarningTriangleIcon />
            </div>

            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#92400e]">
              {pageStatusLabel}
            </p>
            <h1 id="proxy-warning-title" className="sr-only">
              TvLink VPN warning
            </h1>
            <p className="mx-auto max-w-[300px] text-sm font-medium leading-6 text-[#5a6f85]">
              {pageMessage}
            </p>
          </div>

          <div className="border-t border-[#fed7aa] bg-[#fff7ed]/70 px-4 py-4">
            <div className="flex flex-col gap-3 rounded-xl border border-[#fed7aa] bg-white/90 p-3.5 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ffedd5] text-[#92400e]">
                  <PlugZapIcon aria-hidden="true" className="size-4" strokeWidth={2.25} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="mb-1 text-sm font-bold leading-5 text-[#18324a]">Mau bisa akses lagi?</p>
                      <p className="text-xs leading-5 text-[#6e8297]">
                        Silahkan hapus extension dibawah ini.
                      </p>
                    </div>
                    {isProxyConflictActive ? (
                      <span className="rounded-full border border-[#fed7aa] bg-[#fff7ed] px-2.5 py-1 text-[11px] font-bold text-[#92400e]">
                        {proxyConflictState.extensions.length} aktif
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {isLoadingProxyState ? (
                <div className="flex items-center gap-2 rounded-lg bg-[#fff7ed] px-3 py-2 text-xs font-semibold text-[#92400e]">
                  <Spinner data-icon="inline-start" />
                  Memeriksa extension VPN
                </div>
              ) : isProxyConflictActive ? (
                <>
                  <Button
                    className="w-full border-[#fed7aa] bg-white text-[#92400e] hover:bg-[#fff7ed]"
                    disabled={isRefreshingConflict}
                    type="button"
                    variant="outline"
                    onClick={handleRefreshConflict}
                  >
                    {isRefreshingConflict ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <RefreshCcwIcon data-icon="inline-start" />
                    )}
                    Periksa ulang
                  </Button>

                  {proxyConflictActionErrorMessage ? (
                    <StatusNotice
                      message={proxyConflictActionErrorMessage}
                      title="Aksi gagal"
                      tone="warning"
                    />
                  ) : null}

                  <ProxyConflictExtensionList
                    compact
                    conflictKind="proxy"
                    conflictExtensions={proxyConflictState.extensions}
                    disablingExtensionId={disablingProxyExtensionId}
                    onDisableExtension={handleDisableProxyExtension}
                    onUninstallExtension={handleUninstallProxyExtension}
                    uninstallingExtensionId={uninstallingProxyExtensionId}
                  />
                </>
              ) : (
                <StatusNotice
                  message="sekarang sudah bisa akses lagi"
                  title="Akses sudah pulih"
                  tone="success"
                />
              )}
            </div>
          </div>
        </article>
      </section>
    </main>
  );

  async function handleDisableProxyExtension(extensionId: string) {
    setDisablingProxyExtensionId(extensionId);
    setProxyConflictActionErrorMessage(null);

    try {
      await disableManagedExtension(extensionId);
      await handleRefreshConflict();
    } catch (error) {
      setProxyConflictActionErrorMessage(getErrorMessage(error));
    } finally {
      setDisablingProxyExtensionId(null);
    }
  }

  async function handleUninstallProxyExtension(extensionId: string) {
    setUninstallingProxyExtensionId(extensionId);
    setProxyConflictActionErrorMessage(null);

    try {
      await uninstallManagedExtension(extensionId);
      await handleRefreshConflict();
    } catch (error) {
      setProxyConflictActionErrorMessage(getErrorMessage(error));
    } finally {
      setUninstallingProxyExtensionId(null);
    }
  }

  async function handleRefreshConflict() {
    setIsRefreshingConflict(true);
    setProxyConflictActionErrorMessage(null);

    try {
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
      setIsRefreshingConflict(false);
    }
  }
}

function WarningTriangleIcon() {
  return (
    <svg aria-hidden="true" className="size-9" viewBox="0 0 32 32">
      <path d="M16 3 30 28H2z" fill="currentColor" />
      <path d="M15 11h2v9h-2zm0 12h2v2h-2z" fill="#ffffff" />
    </svg>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Permintaan gagal diproses.";
}
