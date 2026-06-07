import { useEffect, useState } from "react";
import { RefreshCcwIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";

import { ProxyConflictExtensionList } from "@/components/asset-manager/ProxyConflictExtensionList";
import { Logo } from "@/components/asset-manager/Logo";
import { StatusNotice } from "@/components/asset-manager/StatusNotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { CookieGuardState } from "@/lib/cookie-guard/cookieGuardState";
import { cookieGuardStateStorageKey } from "@/lib/cookie-guard/cookieGuardConfig";
import { runtimeMessageType, type CookieGuardRuntimeValue } from "@/lib/runtime/messages";
import { sendRuntimeMessage } from "@/lib/runtime/sendRuntimeMessage";
import { disableManagedExtension, uninstallManagedExtension } from "@/lib/proxy/proxyExtensionManagement";

export function CookiesBlockedApp() {
  const [cookieGuardState, setCookieGuardState] = useState<CookieGuardState | null>(null);
  const [disablingExtensionId, setDisablingExtensionId] = useState<string | null>(null);
  const [uninstallingExtensionId, setUninstallingExtensionId] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [isRefreshingGuard, setIsRefreshingGuard] = useState(false);
  const isLoadingCookieGuardState = cookieGuardState === null;
  const isCookieGuardBlocked = cookieGuardState?.isBlocked === true;

  useEffect(() => {
    void requestCookieGuardState(runtimeMessageType.cookieGuardStatusRequested).catch((error: unknown) => {
      setActionErrorMessage(getErrorMessage(error));
    });
  }, []);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return () => {};
    }

    const handleStorageChange: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      areaName,
    ) => {
      if (areaName !== "local" || !(cookieGuardStateStorageKey in changes)) {
        return;
      }

      const nextCookieGuardState = changes[cookieGuardStateStorageKey]?.newValue as
        | CookieGuardState
        | undefined;
      setCookieGuardState(nextCookieGuardState ?? null);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!cookieGuardState?.isBlocked) {
      setDisablingExtensionId(null);
      setUninstallingExtensionId(null);
      setActionErrorMessage(null);
    }
  }, [cookieGuardState?.isBlocked]);

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
                    {isLoadingCookieGuardState
                      ? "Memeriksa status"
                      : isCookieGuardBlocked
                        ? "Akses diblokir"
                        : "Akses dipulihkan"}
                  </Badge>
                  <CardTitle className="text-xl tracking-tight">
                    {isLoadingCookieGuardState
                      ? "Memeriksa extension cookies"
                      : isCookieGuardBlocked
                        ? "Extension cookies terdeteksi"
                        : "Conflict cookies sudah selesai"}
                  </CardTitle>
                  <CardDescription className="max-w-xl leading-6">
                    {(isLoadingCookieGuardState
                      ? "TvLink sedang memeriksa extension lain yang memiliki akses cookies."
                      : cookieGuardState?.message) ??
                      "Akses asset dapat dibuka kembali. Tutup halaman ini lalu buka asset lagi dari popup."}
                  </CardDescription>
                </div>
              </div>
              {isLoadingCookieGuardState ? (
                <Spinner className="size-8 shrink-0" />
              ) : isCookieGuardBlocked ? (
                <ShieldAlertIcon className="size-8 shrink-0 text-red-500" />
              ) : (
                <ShieldCheckIcon className="size-8 shrink-0 text-emerald-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 py-6">
            {isLoadingCookieGuardState ? (
              <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 text-sm leading-6 text-muted-foreground">
                Memuat daftar extension dengan permission cookies.
              </div>
            ) : isCookieGuardBlocked ? (
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
                          {cookieGuardState.extensions.length} aktif
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Nonaktifkan extension dengan permission cookies untuk melindungi cookies asset.
                      </p>
                    </div>
                    <Button
                      className="border-red-500/15 bg-background/90 hover:bg-red-500/6"
                      disabled={isRefreshingGuard}
                      type="button"
                      variant="outline"
                      onClick={handleRefreshGuard}
                    >
                      {isRefreshingGuard ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <RefreshCcwIcon data-icon="inline-start" />
                      )}
                      Periksa ulang
                    </Button>
                  </div>

                  {actionErrorMessage ? (
                    <StatusNotice message={actionErrorMessage} title="Aksi gagal" tone="warning" />
                  ) : null}

                  <ProxyConflictExtensionList
                    conflictKind="cookies"
                    conflictExtensions={cookieGuardState.extensions}
                    disablingExtensionId={disablingExtensionId}
                    onDisableExtension={handleDisableExtension}
                    onUninstallExtension={handleUninstallExtension}
                    uninstallingExtensionId={uninstallingExtensionId}
                  />
                </div>
              </section>
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

  async function handleDisableExtension(extensionId: string) {
    setDisablingExtensionId(extensionId);
    setActionErrorMessage(null);

    try {
      await disableManagedExtension(extensionId);
      await handleRefreshGuard();
    } catch (error) {
      setActionErrorMessage(getErrorMessage(error));
    } finally {
      setDisablingExtensionId(null);
    }
  }

  async function handleUninstallExtension(extensionId: string) {
    setUninstallingExtensionId(extensionId);
    setActionErrorMessage(null);

    try {
      await uninstallManagedExtension(extensionId);
      await handleRefreshGuard();
    } catch (error) {
      setActionErrorMessage(getErrorMessage(error));
    } finally {
      setUninstallingExtensionId(null);
    }
  }

  async function handleRefreshGuard() {
    setIsRefreshingGuard(true);
    setActionErrorMessage(null);

    try {
      await requestCookieGuardState(runtimeMessageType.cookieGuardRefreshRequested);
    } catch (error) {
      setActionErrorMessage(getErrorMessage(error));
    } finally {
      setIsRefreshingGuard(false);
    }
  }

  async function requestCookieGuardState(
    messageType:
      | typeof runtimeMessageType.cookieGuardStatusRequested
      | typeof runtimeMessageType.cookieGuardRefreshRequested,
  ) {
    const runtimeResult = await sendRuntimeMessage<CookieGuardRuntimeValue>({
      type: messageType,
    });

    if (!runtimeResult.value) {
      throw new Error(runtimeResult.errorMessage ?? "Status conflict cookies belum bisa dibaca.");
    }

    setCookieGuardState(runtimeResult.value);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Permintaan gagal diproses.";
}
