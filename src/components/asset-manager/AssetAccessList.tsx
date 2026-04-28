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
          <Card key={asset.platform} size="sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <CardTitle>{platformConfig.label}</CardTitle>
                  <CardDescription>{platformConfig.targetUrl}</CardDescription>
                </div>
                <Badge variant={hasAnyAccess ? "secondary" : "outline"}>
                  {hasAnyAccess ? "Tersedia" : "Terkunci"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                disabled={!hasAnyAccess || Boolean(isAccessingPlatform)}
                type="button"
                onClick={() => void onAccessAsset(asset)}
              >
                <ExternalLinkIcon data-icon="inline-start" />
                Akses {platformConfig.label}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
