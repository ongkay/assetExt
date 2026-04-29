import { ExternalLinkIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ExtensionAssetSummary } from "@/lib/api/extensionApiTypes";
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { getAssetPlatformConfig } from "@/lib/asset-access/platforms";

type AssetAccessListProps = {
  assets: ExtensionAssetSummary[];
  isAccessingPlatform?: AssetPlatform | null;
  onAccessAsset: (asset: ExtensionAssetSummary) => void | Promise<void>;
};

export function AssetAccessList({
  assets,
  isAccessingPlatform = null,
  onAccessAsset,
}: AssetAccessListProps) {
  if (assets.length === 0) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Asset belum tersedia</CardTitle>
          <CardDescription>Belum ada platform asset yang dapat diakses.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {assets.map((asset) => {
        const platformConfig = getAssetPlatformConfig(asset.platform);
        const hasAnyAccess = asset.hasPrivateAccess || asset.hasShareAccess;

        return (
          <Card
            key={asset.platform}
            size="sm"
            className="group relative overflow-hidden border-border/60 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <CardHeader className="relative z-10 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <CardTitle className="text-base font-semibold">
                    {platformConfig.label}
                  </CardTitle>
                  <CardDescription className="truncate text-xs">
                    {platformConfig.targetUrl}
                  </CardDescription>
                </div>
                <Badge
                  variant={hasAnyAccess ? "default" : "secondary"}
                  className={
                    hasAnyAccess
                      ? "shadow-[0_0_10px_rgba(var(--color-primary),0.2)] transition-transform duration-300 group-hover:scale-105"
                      : ""
                  }
                >
                  {hasAnyAccess ? "Tersedia" : "Terkunci"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <Button
                className="w-full transition-transform active:scale-[0.98]"
                disabled={!hasAnyAccess || Boolean(isAccessingPlatform)}
                type="button"
                onClick={() => void onAccessAsset(asset)}
              >
                {isAccessingPlatform === asset.platform ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <ExternalLinkIcon data-icon="inline-start" />
                )}
                Akses {platformConfig.label}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
