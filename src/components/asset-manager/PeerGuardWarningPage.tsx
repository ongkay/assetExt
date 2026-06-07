import { useEffect, useState } from "react";
import { PlugZapIcon } from "lucide-react";

import { runtimeMessageType, type PeerGuardRuntimeValue } from "@/lib/runtime/messages";
import { sendRuntimeMessage } from "@/lib/runtime/sendRuntimeMessage";
import { peerGuardStateStorageKey } from "@/lib/peer-guard/peerGuardConfig";
import type { PeerGuardState } from "@/lib/peer-guard/peerGuardState";

type PeerGuardWarningPageProps = {
  extensionLabel: string;
};

export function PeerGuardWarningPage({ extensionLabel }: PeerGuardWarningPageProps) {
  const [peerGuardState, setPeerGuardState] = useState<PeerGuardState | null>(null);
  const isLoading = peerGuardState === null;
  const isBlocked = peerGuardState?.isBlocked === true;

  useEffect(() => {
    void requestPeerGuardState(runtimeMessageType.peerGuardStatusRequested).catch(() => {});
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
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,_#ecf6ff_0%,_#e6f2ff_45%,_#dcecff_100%)] p-4 text-[#2d4962] antialiased [font-family:ui-sans-serif,system-ui,sans-serif]">
      <section
        aria-labelledby="warning-title"
        className="mx-auto flex min-h-[calc(100dvh-32px)] w-full max-w-[360px] items-center justify-center"
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
              access denied
            </p>
            <h1 id="warning-title" className="sr-only">
              TvLink access denied for {extensionLabel}
            </h1>
            <p className="mx-auto max-w-[285px] text-sm font-medium leading-6 text-[#5a6f85]">
              Silakan aktifkan semua extension untuk bisa akses tvlink.
            </p>
          </div>

          <div className="border-t border-[#fed7aa] bg-[#fff7ed]/70 px-4 py-4">
            <div className="flex items-start gap-3 rounded-xl border border-[#fed7aa] bg-white/90 p-3.5 text-left shadow-sm">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ffedd5] text-[#92400e]">
                <PlugZapIcon aria-hidden="true" className="size-4" strokeWidth={2.25} />
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-sm font-bold leading-5 text-[#18324a]">Periksa extension tvlink</p>
                <p className="text-xs leading-5 text-[#6e8297]">Pastikan 2 extension terinstall dan aktif.</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );

  async function requestPeerGuardState(
    messageType:
      | typeof runtimeMessageType.peerGuardStatusRequested
      | typeof runtimeMessageType.peerGuardRefreshRequested,
  ) {
    const runtimeResult = await sendRuntimeMessage<PeerGuardRuntimeValue>({
      type: messageType,
    });

    if (!runtimeResult.value) {
      throw new Error(runtimeResult.errorMessage ?? "Status pasangan extension belum bisa dibaca.");
    }

    setPeerGuardState(runtimeResult.value);
  }
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

function WarningTriangleIcon() {
  return (
    <svg aria-hidden="true" className="size-9" viewBox="0 0 32 32">
      <path d="M16 3 30 28H2z" fill="currentColor" />
      <path d="M15 11h2v9h-2zm0 12h2v2h-2z" fill="#ffffff" />
    </svg>
  );
}
