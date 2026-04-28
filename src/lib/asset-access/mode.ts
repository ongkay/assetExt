import type { ExtensionAssetSummary, ExtensionMode } from "@/lib/api/extensionApiTypes";

export function getAutomaticAssetMode(
  asset: Pick<ExtensionAssetSummary, "hasPrivateAccess" | "hasShareAccess">,
): ExtensionMode | null {
  if (asset.hasPrivateAccess) {
    return "private";
  }

  if (asset.hasShareAccess) {
    return "share";
  }

  return null;
}
