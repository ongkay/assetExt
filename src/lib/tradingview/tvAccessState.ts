import type { BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";

export function getRestrictedTradingViewPublicId(bootstrapCacheRecord: BootstrapCacheRecord | null): string | null {
  const bootstrapSnapshot = bootstrapCacheRecord?.snapshot;

  if (!bootstrapSnapshot || bootstrapSnapshot.auth.status !== "authenticated") {
    return null;
  }

  const tradingViewAsset = bootstrapSnapshot.assets?.find((assetSummary) => assetSummary.platform === "tradingview");
  const publicId = bootstrapSnapshot.user?.publicId?.trim() ?? "";

  if (!publicId || tradingViewAsset?.mode !== "share") {
    return null;
  }

  return publicId;
}
