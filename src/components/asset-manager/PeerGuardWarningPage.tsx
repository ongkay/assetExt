import { useEffect, useState } from "react";
import { ShieldAlertIcon } from "lucide-react";

import { Logo } from "@/components/asset-manager/Logo";
import { StatusNotice } from "@/components/asset-manager/StatusNotice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { runtimeMessageType, type PeerGuardRuntimeValue } from "@/lib/runtime/messages";
import { sendRuntimeMessage } from "@/lib/runtime/sendRuntimeMessage";
import { peerGuardStateStorageKey } from "@/lib/peer-guard/peerGuardConfig";
import type { PeerGuardState } from "@/lib/peer-guard/peerGuardState";

type PeerGuardWarningPageProps = {
  extensionLabel: string;
};

export function PeerGuardWarningPage({ extensionLabel }: PeerGuardWarningPageProps) {
  const [peerGuardState, setPeerGuardState] = useState<PeerGuardState | null>(null);
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);
  const isLoading = peerGuardState === null;
  const isBlocked = peerGuardState?.isBlocked === true;

  useEffect(() => {
    void requestPeerGuardState(runtimeMessageType.peerGuardStatusRequested).catch((error: unknown) => {
      setStatusErrorMessage(getErrorMessage(error));
    });
  }, []);

  useEffect(() => {
    if (!peerGuardState || peerGuardState.isBlocked) {
      return;
    }

    void closeCurrentWarningTab();
  }, [peerGuardState]);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return () => {};
    }

    const handleStorageChange: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      areaName,
    ) => {
      if (areaName !== "local" || !(peerGuardStateStorageKey in changes)) {
        return;
      }

      const nextPeerGuardState = changes[peerGuardStateStorageKey]?.newValue as PeerGuardState | undefined;
      setPeerGuardState(nextPeerGuardState ?? null);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  if (!isLoading && !isBlocked) {
    return null;
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.08),_transparent_34%),linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--background)_97%,rgb(15_23_42)_3%))] px-5 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <Card className="overflow-hidden border-border/80 bg-card/97 shadow-2xl shadow-black/5 ring-1 ring-black/5 backdrop-blur-sm">
          <CardHeader className="gap-4 border-b border-border/70 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-red-500/15 bg-linear-to-br from-red-500/12 to-background text-red-500 shadow-sm shadow-red-500/5">
                  <Logo className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <Badge
                    className="w-fit border border-red-500/12 bg-red-500/8 text-red-600 hover:bg-red-500/8 dark:text-red-400"
                    variant="secondary"
                  >
                    {isLoading ? "Memeriksa" : "Guard aktif"}
                  </Badge>
                  <CardTitle className="text-xl tracking-tight text-foreground sm:text-[1.35rem]">
                    {isLoading ? `Memeriksa ${extensionLabel}` : "Akses dihentikan"}
                  </CardTitle>
                  <CardDescription className="max-w-lg text-sm leading-6">
                    {isLoading ? "Status extension pasangan sedang diperiksa." : getBlockedHeroCopy(peerGuardState)}
                  </CardDescription>
                </div>
              </div>
              {isLoading ? <Spinner className="size-8 shrink-0" /> : <ShieldAlertIcon className="size-8 shrink-0 text-red-500" />}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 py-5">
            {statusErrorMessage ? (
              <StatusNotice message={statusErrorMessage} title="Status belum tersedia" tone="warning" />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">Status</p>
                <p className="mt-1 text-sm font-medium text-foreground">Pasangan {peerGuardState?.peerLabel ?? "ext-2"} tidak aktif</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">Tindakan</p>
                <p className="mt-1 text-sm font-medium text-foreground">Aktifkan pair. Tab ini akan tertutup otomatis.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.035] px-4 py-3 text-sm leading-6 text-muted-foreground">
              Session lama sudah direset agar akses tidak berjalan parsial.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );

  async function requestPeerGuardState(messageType: typeof runtimeMessageType.peerGuardStatusRequested | typeof runtimeMessageType.peerGuardRefreshRequested) {
    const runtimeResult = await sendRuntimeMessage<PeerGuardRuntimeValue>({
      type: messageType,
    });

    if (!runtimeResult.value) {
      throw new Error(runtimeResult.errorMessage ?? "Status pasangan extension belum bisa dibaca.");
    }

    setPeerGuardState(runtimeResult.value);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Permintaan gagal diproses.";
}

async function closeCurrentWarningTab(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.tabs?.getCurrent || !chrome.tabs?.remove) {
    return;
  }

  const currentTab = await chrome.tabs.getCurrent();

  if (typeof currentTab?.id === "number") {
    await chrome.tabs.remove(currentTab.id);
  }
}

function getBlockedHeroCopy(peerGuardState: PeerGuardState | null): string {
  if (peerGuardState?.reason === "peer_missing") {
    return `${peerGuardState.peerLabel} belum tersedia. Akses ditahan sampai pair lengkap.`;
  }

  return `${peerGuardState?.peerLabel ?? "Extension pasangan"} dimatikan. Session lokal sudah dibersihkan.`;
}
