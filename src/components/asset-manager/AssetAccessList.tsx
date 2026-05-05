import {
  ExternalLinkIcon,
  CandlestickChartIcon,
  TrendingUpIcon,
  BarChart3Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const sortedAssets = [...assets].sort((a, b) => {
    if (a.platform === "tradingview") return -1;
    if (b.platform === "tradingview") return 1;
    return a.platform.localeCompare(b.platform);
  });

  return (
    <div className="flex flex-col gap-3">
      {sortedAssets.map((asset) => {
        const platformConfig = getAssetPlatformConfig(asset.platform);
        const hasAnyAccess = asset.hasPrivateAccess || asset.hasShareAccess;

        return (
          <Card
            key={asset.platform}
            size="sm"
            className="group relative overflow-hidden border-border/60 bg-card shadow-sm p-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/40"
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-blue-500/20 text-primary dark:text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary/20">
                {getPlatformIcon(asset.platform)}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 justify-center mt-0.5">
                <div className="text-sm font-bold text-foreground">{platformConfig.label}</div>
                <div className="text-[12px] text-muted-foreground leading-snug pr-2">
                  {getPlatformDescription(asset.platform, platformConfig.targetUrl)}
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <Button
                className="w-full relative overflow-hidden bg-linear-to-r! from-blue-600! to-indigo-600! hover:from-blue-500! hover:to-indigo-500! text-white! font-medium shadow-md shadow-blue-500/20 border-0! transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/40 active:scale-[0.98] active:translate-y-0 group/btn"
                disabled={!hasAnyAccess || Boolean(isAccessingPlatform)}
                type="button"
                onClick={() => void onAccessAsset(asset)}
              >
                {isAccessingPlatform === asset.platform ? (
                  <Spinner data-icon="inline-start" className="mr-2" />
                ) : null}
                <span className="relative z-10 flex items-center">
                  Akses {platformConfig.label}
                  {isAccessingPlatform !== asset.platform ? (
                    <ExternalLinkIcon className="ml-2 size-4 opacity-90 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                  ) : null}
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
