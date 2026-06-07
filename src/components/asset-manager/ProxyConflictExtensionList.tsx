import { PowerOffIcon, ShieldOffIcon, Trash2Icon, WrenchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { AssetProxyConflictExtensionCandidate } from "@/lib/proxy/assetProxy";

type ProxyConflictExtensionListProps = {
  compact?: boolean;
  conflictExtensions: AssetProxyConflictExtensionCandidate[];
  conflictKind?: "cookies" | "proxy";
  disablingExtensionId: string | null;
  onDisableExtension: (extensionId: string) => void;
  onUninstallExtension: (extensionId: string) => void;
  uninstallingExtensionId: string | null;
};

export function ProxyConflictExtensionList({
  compact = false,
  conflictExtensions,
  conflictKind = "proxy",
  disablingExtensionId,
  onDisableExtension,
  onUninstallExtension,
  uninstallingExtensionId,
}: ProxyConflictExtensionListProps) {
  const listWrapperClassName = compact ? "flex flex-col gap-2" : "flex flex-col gap-3";

  if (conflictExtensions.length === 0) {
    return (
      <div
        className={
          compact
            ? "rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-danger-bg px-3.5 py-3 text-sm leading-6 text-tvlink-muted"
            : "rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-danger-bg p-4 text-sm leading-6 text-tvlink-muted shadow-tvlink-soft"
        }
      >
        {getMissingConflictCopy(conflictKind)} belum teridentifikasi. Buka{" "}
        <code className="font-mono text-foreground">chrome://extensions</code>
        dan matikan atau hapus extension lain yang bentrok.
      </div>
    );
  }

  return (
    <div className={listWrapperClassName}>
      {conflictExtensions.map((extension) => {
        const isDisabling = disablingExtensionId === extension.id;
        const isUninstalling = uninstallingExtensionId === extension.id;
        const isActionRunning = Boolean(disablingExtensionId || uninstallingExtensionId);
        const itemClassName = extension.mayDisable
          ? "border-tvlink-danger-border bg-tvlink-card-bg shadow-tvlink-soft"
          : "border-tvlink-app-border bg-tvlink-card-bg";
        const iconClassName = extension.mayDisable
          ? "border-tvlink-danger-border bg-tvlink-danger-bg text-tvlink-danger"
          : "border-tvlink-app-border bg-tvlink-surface-soft text-tvlink-muted";

        return (
          <div
            key={extension.id}
            className={`rounded-tvlink-card border p-4 transition-colors ${compact ? "flex flex-col gap-3" : "flex flex-col gap-3.5"} ${itemClassName}`}
          >
            <div className="flex items-start gap-3">
              {extension.iconUrl ? (
                <img
                  alt={`${extension.name} icon`}
                  className="size-10 rounded-tvlink-card border border-white/10 bg-background object-cover shadow-xs"
                  height={40}
                  src={extension.iconUrl}
                  width={40}
                />
              ) : (
                <div
                  className={`flex size-10 items-center justify-center rounded-tvlink-card border ${iconClassName}`}
                >
                  <ShieldOffIcon className="size-4" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-tvlink-text-strong">{extension.name}</p>
                  {!compact ? (
                    <Badge
                      className={
                        extension.mayDisable
                          ? "border-tvlink-danger-border bg-tvlink-danger-bg text-tvlink-danger"
                          : "border-tvlink-app-border bg-tvlink-surface-soft text-tvlink-muted"
                      }
                      variant="secondary"
                    >
                      {extension.mayDisable ? "Siap dinonaktifkan" : "Perlu manual"}
                    </Badge>
                  ) : null}
                  {!compact && !extension.mayDisable && extension.installType ? (
                    <Badge variant="outline">{formatInstallTypeLabel(extension.installType)}</Badge>
                  ) : null}
                </div>
                {!compact ? (
                  <p className="mt-1 text-sm leading-6 text-tvlink-muted">
                    {extension.mayDisable
                      ? getManageableConflictCopy(conflictKind)
                      : getManualConflictCopy(conflictKind)}
                  </p>
                ) : !extension.mayDisable ? (
                  <p className="mt-1 text-xs leading-5 text-tvlink-muted">
                    Manual via <span className="font-mono text-tvlink-text-strong">chrome://extensions</span>
                  </p>
                ) : null}
              </div>
            </div>

            {extension.mayDisable ? (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  className="border-tvlink-danger-border bg-tvlink-danger-bg text-tvlink-danger hover:bg-tvlink-danger-hover-bg hover:text-tvlink-danger-hover"
                  disabled={isActionRunning}
                  size={compact ? "sm" : "default"}
                  type="button"
                  variant="destructive"
                  onClick={() => onDisableExtension(extension.id)}
                >
                  {isDisabling ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <PowerOffIcon data-icon="inline-start" />
                  )}
                  {compact ? "Nonaktifkan" : "Nonaktifkan sekarang"}
                </Button>
                <Button
                  className="border-tvlink-danger-border bg-tvlink-card-bg text-tvlink-danger hover:bg-tvlink-danger-hover-bg hover:text-tvlink-danger-hover"
                  disabled={isActionRunning}
                  size={compact ? "sm" : "default"}
                  type="button"
                  variant="outline"
                  onClick={() => onUninstallExtension(extension.id)}
                >
                  {isUninstalling ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <Trash2Icon data-icon="inline-start" />
                  )}
                  {compact ? "Hapus" : "Hapus extension"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-tvlink-muted">
                <WrenchIcon className="size-4 text-amber-500" />
                Buka <code className="font-mono text-tvlink-text-strong">chrome://extensions</code>
                untuk menonaktifkan extension ini.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getMissingConflictCopy(conflictKind: ProxyConflictExtensionListProps["conflictKind"]): string {
  return conflictKind === "cookies" ? "Extension cookies" : "VPN aktif";
}

function getManageableConflictCopy(conflictKind: ProxyConflictExtensionListProps["conflictKind"]): string {
  return conflictKind === "cookies"
    ? "Nonaktifkan atau hapus extension ini untuk melindungi cookies asset."
    : "Nonaktifkan atau hapus extension ini untuk melepas conflict VPN.";
}

function getManualConflictCopy(conflictKind: ProxyConflictExtensionListProps["conflictKind"]): string {
  return conflictKind === "cookies"
    ? "Hapus atau nonaktifkan manual dari chrome://extensions agar proteksi cookies bisa dipulihkan."
    : "Hapus atau nonaktifkan manual dari chrome://extensions untuk membuka akses asset.";
}

function formatInstallTypeLabel(installType: AssetProxyConflictExtensionCandidate["installType"]): string {
  switch (installType) {
    case "admin":
      return "Dikelola admin";
    case "development":
      return "Development";
    case "normal":
      return "Install normal";
    case "other":
      return "Install lain";
    case "sideload":
      return "Sideload";
    default:
      return "Manual";
  }
}
