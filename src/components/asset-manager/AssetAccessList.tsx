import { BarChart3Icon, ExternalLinkIcon, TrendingUpIcon } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import type { ExtensionAssetSummary } from "@/lib/api/extensionApiTypes";
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { getAssetPlatformConfig } from "@/lib/asset-access/platforms";

type AssetAccessListProps = {
  assets: ExtensionAssetSummary[];
  isAccessBlocked?: boolean;
  isAccessingPlatform?: AssetPlatform | null;
  onAccessAsset: (asset: ExtensionAssetSummary) => void | Promise<void>;
};

function getPlatformIcon(platform: string) {
  switch (platform) {
    case "fxtester":
      return <BarChart3Icon className="h-5 w-5" strokeWidth={2} />;
    case "tradingview":
      return <TrendingUpIcon className="h-5 w-5" strokeWidth={2} />;
    default:
      return <TrendingUpIcon className="h-5 w-5" strokeWidth={2} />;
  }
}

function getPlatformDescription(platform: string, defaultDescription: string) {
  switch (platform) {
    case "fxtester":
      return "Access backtesting tools";
    case "tradingview":
      return "Access TradingView Premium";
    default:
      return defaultDescription;
  }
}

export function AssetAccessList({
  assets,
  isAccessBlocked = false,
  isAccessingPlatform = null,
  onAccessAsset,
}: AssetAccessListProps) {
  if (assets.length === 0) {
    return (
      <article className="rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg p-4 shadow-tvlink-soft">
        <div className="text-sm font-bold text-tvlink-text-strong">Asset belum tersedia</div>
        <div className="mt-1 text-xs text-tvlink-muted">Belum ada platform asset yang dapat diakses.</div>
      </article>
    );
  }

  const sortedAssets = [...assets].sort((a, b) => {
    if (a.platform === "tradingview") return -1;
    if (b.platform === "tradingview") return 1;
    return a.platform.localeCompare(b.platform);
  });

  return (
    <section className="grid gap-3">
      {sortedAssets.map((asset) => {
        const platformConfig = getAssetPlatformConfig(asset.platform);

        return (
          <article
            key={asset.platform}
            className="rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg p-4 shadow-tvlink-soft"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-tvlink-card bg-tvlink-icon-tile-bg text-tvlink-primary">
                {getPlatformIcon(asset.platform)}
              </div>

              <div>
                <div className="mb-0.5 text-sm font-bold text-tvlink-text-strong">{platformConfig.label}</div>
                <div className="text-xs text-tvlink-muted">
                  {getPlatformDescription(asset.platform, platformConfig.targetUrl)}
                </div>
              </div>
            </div>

            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-tvlink-button bg-[linear-gradient(135deg,var(--tvlink-button-gradient-start)_0%,var(--tvlink-button-gradient-end)_100%)] text-sm font-semibold text-white shadow-tvlink-button transition duration-150 hover:-translate-y-0.5 hover:shadow-tvlink-button-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isAccessBlocked || Boolean(isAccessingPlatform)}
              type="button"
              onClick={() => void onAccessAsset(asset)}
            >
              <span>Open Now</span>
              {isAccessingPlatform === asset.platform ? (
                <Spinner data-icon="inline-end" />
              ) : (
                <ExternalLinkIcon className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </article>
        );
      })}
    </section>
  );
}
