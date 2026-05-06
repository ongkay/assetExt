import type { ExtensionAssetSummary, ExtensionMode } from "@/lib/api/extensionApiTypes";

export function getAutomaticAssetMode(asset: Pick<ExtensionAssetSummary, "mode">): ExtensionMode | null {
  return asset.mode;
}
