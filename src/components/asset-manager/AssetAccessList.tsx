import { ExternalLinkIcon, CandlestickChartIcon, TrendingUpIcon, BarChart3Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
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

function getPlatformIcon(platform: string) {
  switch (platform) {
    case "fxtester":
      return <CandlestickChartIcon className="size-5 text-primary dark:text-blue-400" />;
    case "tradingview":
      return <TrendingUpIcon className="size-5 text-primary dark:text-blue-400" />;
    case "fxreplay":
      return <BarChart3Icon className="size-5 text-primary dark:text-blue-400" />;
    default:
      return <BarChart3Icon className="size-5 text-primary dark:text-blue-400" />;
  }
}

function getPlatformDescription(platform: string, defaultDesc: string) {
  switch (platform) {
    case "fxtester":
      return "Software simulasi trading forex profesional.";
    case "tradingview":
      return "Platform charting dan analisis pasar global.";
    case "fxreplay":
      return "Simulator trading dengan data historis akurat.";
    default:
      return defaultDesc;
  }
}

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
            className="group relative overflow-hidden border-border/60 bg-card shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-blue-500/20 text-primary dark:text-blue-400">
                {getPlatformIcon(asset.platform)}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 justify-center mt-0.5">
                <div className="text-sm font-bold text-foreground">
                  {platformConfig.label}
                </div>
                <div className="text-[12px] text-muted-foreground leading-snug pr-2">
                  {getPlatformDescription(asset.platform, platformConfig.targetUrl)}
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <Button
                className="w-full transition-transform active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                disabled={!hasAnyAccess || Boolean(isAccessingPlatform)}
                type="button"
                onClick={() => void onAccessAsset(asset)}
              >
                {isAccessingPlatform === asset.platform ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                Akses {platformConfig.label}
                {isAccessingPlatform !== asset.platform ? (
                  <ExternalLinkIcon data-icon="inline-end" className="ml-1 opacity-80" />
                ) : null}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
