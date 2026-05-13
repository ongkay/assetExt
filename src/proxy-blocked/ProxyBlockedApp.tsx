import { useEffect, useState } from "react";
import { RefreshCcwIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";

import { ProxyConflictExtensionList } from "@/components/asset-manager/ProxyConflictExtensionList";
import { StatusNotice } from "@/components/asset-manager/StatusNotice";
import { Logo } from "@/components/asset-manager/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { type AssetProxyState, assetProxyConflictMessage } from "@/lib/proxy/assetProxy";
import { disableManagedExtension } from "@/lib/proxy/proxyExtensionManagement";
import { runtimeMessageType } from "@/lib/runtime/messages";
import { sendRuntimeMessage } from "@/lib/runtime/sendRuntimeMessage";
import { assetProxyStateStorageKey, readAssetProxyState } from "@/lib/storage/assetProxyState";

export function ProxyBlockedApp() {
  const [assetProxyState, setAssetProxyState] = useState<AssetProxyState | null>(null);
  const [disablingProxyExtensionId, setDisablingProxyExtensionId] = useState<string | null>(null);
  const [proxyConflictActionErrorMessage, setProxyConflictActionErrorMessage] = useState<string | null>(null);
  const [isRefreshingConflict, setIsRefreshingConflict] = useState(false);
  const isLoadingProxyState = assetProxyState === null;
  const proxyConflictState = assetProxyState?.conflict ?? null;
  const isProxyConflictActive = proxyConflictState?.isActive === true;
  const proxyConflictMessage = proxyConflictState?.isActive
    ? (proxyConflictState.message ?? assetProxyConflictMessage)
    : null;

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
      setProxyConflictActionErrorMessage(null);
    }
  }, [proxyConflictState?.isActive]);

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.14),_transparent_32%),linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--background)_94%,rgb(239_68_68)_6%))] px-5 py-6 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <Card className="overflow-hidden border-red-500/30 bg-card/96 shadow-xl shadow-red-500/10 ring-1 ring-red-500/10 backdrop-blur-sm">
          <CardHeader className="gap-4 border-b border-red-500/10 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-red-500/20 bg-linear-to-br from-red-500/18 to-red-500/6 text-red-500 shadow-sm shadow-red-500/10">
                  <Logo className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <Badge
                    className="w-fit border border-red-500/15 bg-red-500/10 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                    variant="secondary"
                  >
                    {isLoadingProxyState
                      ? "Memeriksa status"
                      : isProxyConflictActive
                        ? "Akses diblokir"
                        : "Akses dipulihkan"}
                  </Badge>
                  <CardTitle className="text-xl tracking-tight">
                    {isLoadingProxyState
                      ? "Memeriksa status proxy"
                      : isProxyConflictActive
                        ? "Proxy lain sedang aktif"
                        : "Proxy conflict sudah selesai"}
                  </CardTitle>
                  <CardDescription className="max-w-xl leading-6">
                    {(isLoadingProxyState
                      ? "Asset Manager sedang memeriksa kontrol proxy browser."
                      : proxyConflictMessage) ??
                      "Asset Manager kembali memegang kontrol proxy. Tutup halaman ini lalu buka asset lagi."}
                  </CardDescription>
                </div>
              </div>
              {isLoadingProxyState ? (
                <Spinner className="size-8 shrink-0" />
              ) : isProxyConflictActive ? (
                <ShieldAlertIcon className="size-8 shrink-0 text-red-500" />
              ) : (
                <ShieldCheckIcon className="size-8 shrink-0 text-emerald-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 py-6">
            {isLoadingProxyState ? (
              <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 text-sm leading-6 text-muted-foreground">
                Memuat status proxy dan daftar extension terkait.
              </div>
            ) : isProxyConflictActive ? (
              <>
                <section className="rounded-[28px] border border-red-500/14 bg-background/82 p-4 shadow-[0_18px_48px_rgba(239,68,68,0.08)] backdrop-blur-sm sm:p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold text-foreground">Extension terdeteksi</h2>
                          <Badge
                            className="border-red-500/15 bg-red-500/10 text-red-600 dark:text-red-300"
                            variant="secondary"
                          >
                            {proxyConflictState.extensions.length} aktif
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Nonaktifkan proxy lain untuk melanjutkan akses asset.
                        </p>
                      </div>
                      <Button
                        className="border-red-500/15 bg-background/90 hover:bg-red-500/6"
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
                    </div>

                    {proxyConflictActionErrorMessage ? (
                      <StatusNotice
                        message={proxyConflictActionErrorMessage}
                        title="Aksi gagal"
                        tone="warning"
                      />
                    ) : null}

                    <ProxyConflictExtensionList
                      conflictExtensions={proxyConflictState.extensions}
                      disablingExtensionId={disablingProxyExtensionId}
                      onDisableExtension={handleDisableProxyExtension}
                    />
                  </div>
                </section>
              </>
            ) : (
              <StatusNotice
                message="Tutup halaman ini lalu buka asset lagi dari popup atau refresh tab asset terakhir."
                title="Akses asset sudah kembali"
                tone="success"
              />
            )}
          </CardContent>
        </Card>
      </div>
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

  async function handleRefreshConflict() {
    setIsRefreshingConflict(true);
    setProxyConflictActionErrorMessage(null);

    try {
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
      setIsRefreshingConflict(false);
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Permintaan gagal diproses.";
}
