import { PowerOffIcon, ShieldOffIcon, WrenchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { AssetProxyConflictExtensionCandidate } from "@/lib/proxy/assetProxy";

type ProxyConflictExtensionListProps = {
  compact?: boolean;
  conflictExtensions: AssetProxyConflictExtensionCandidate[];
  disablingExtensionId: string | null;
  onDisableExtension: (extensionId: string) => void;
};

export function ProxyConflictExtensionList({
  compact = false,
  conflictExtensions,
  disablingExtensionId,
  onDisableExtension,
}: ProxyConflictExtensionListProps) {
  const listWrapperClassName = compact ? "flex flex-col gap-2" : "flex flex-col gap-3";

  if (conflictExtensions.length === 0) {
    return (
      <div
        className={
          compact
            ? "rounded-2xl border border-red-500/16 bg-red-500/6 px-3.5 py-3 text-sm leading-6 text-muted-foreground"
            : "rounded-2xl border border-red-500/20 bg-red-500/6 p-4 text-sm leading-6 text-muted-foreground shadow-sm shadow-red-500/5"
        }
      >
        Proxy aktif belum teridentifikasi. Buka{" "}
        <code className="font-mono text-foreground">chrome://extensions</code>
        dan matikan proxy lain.
      </div>
    );
  }

  return (
    <div className={listWrapperClassName}>
      {conflictExtensions.map((extension) => {
        const isDisabling = disablingExtensionId === extension.id;
        const itemClassName = extension.mayDisable
          ? "border-red-500/20 bg-linear-to-r from-red-500/8 via-red-500/4 to-background shadow-sm shadow-red-500/5"
          : "border-border/70 bg-background/90";
        const iconClassName = extension.mayDisable
          ? "border-red-500/20 bg-red-500/10 text-red-500"
          : "border-border/70 bg-muted/60 text-muted-foreground";

        return (
          <div
            key={extension.id}
            className={`rounded-2xl border p-4 transition-colors ${compact ? "flex flex-col gap-3" : "flex flex-col gap-3.5"} ${itemClassName}`}
          >
            <div className="flex items-start gap-3">
              {extension.iconUrl ? (
                <img
                  alt={`${extension.name} icon`}
                  className="size-10 rounded-xl border border-white/10 bg-background object-cover shadow-xs"
                  height={40}
                  src={extension.iconUrl}
                  width={40}
                />
              ) : (
                <div
                  className={`flex size-10 items-center justify-center rounded-xl border ${iconClassName}`}
                >
                  <ShieldOffIcon className="size-4" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{extension.name}</p>
                  {!compact ? (
                    <Badge
                      className={
                        extension.mayDisable
                          ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300"
                          : "border-border/70 bg-muted/70 text-muted-foreground"
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
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {extension.mayDisable
                      ? "Matikan langsung dari Asset Manager untuk melepas conflict proxy."
                      : "Matikan manual dari chrome://extensions untuk membuka akses asset."}
                  </p>
                ) : !extension.mayDisable ? (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Manual via <span className="font-mono text-foreground">chrome://extensions</span>
                  </p>
                ) : null}
              </div>
            </div>

            {extension.mayDisable ? (
              <div className={compact ? "flex justify-end" : "flex justify-end"}>
                <Button
                  className={
                    compact
                      ? "border-red-500/18 bg-red-500/12 text-red-600 hover:bg-red-500/20 dark:text-red-300"
                      : "border-red-500/20 bg-red-500/12 text-red-600 hover:bg-red-500/18 dark:text-red-300"
                  }
                  disabled={Boolean(disablingExtensionId)}
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
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <WrenchIcon className="size-4 text-amber-500" />
                Buka <code className="font-mono text-foreground">chrome://extensions</code>
                untuk menonaktifkan extension ini.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
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
