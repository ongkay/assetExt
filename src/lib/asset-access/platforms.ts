export const assetPlatforms = ["tradingview", "fxreplay", "fxtester"] as const;

export type AssetPlatform = (typeof assetPlatforms)[number];

export type AssetPlatformConfig = {
  platform: AssetPlatform;
  label: string;
  targetUrl: string;
  hostPatterns: readonly string[];
  cookieDomains: readonly string[];
};

export const assetPlatformConfigs: Record<AssetPlatform, AssetPlatformConfig> = {
  tradingview: {
    platform: "tradingview",
    label: "TradingView",
    targetUrl: "https://www.tradingview.com/chart/",
    hostPatterns: ["tradingview.com"],
    cookieDomains: [".tradingview.com", "tradingview.com"],
  },
  fxreplay: {
    platform: "fxreplay",
    label: "FXReplay",
    targetUrl: "https://fxreplay.com/",
    hostPatterns: ["fxreplay.com"],
    cookieDomains: [".fxreplay.com", "fxreplay.com"],
  },
  fxtester: {
    platform: "fxtester",
    label: "FXTester",
    targetUrl: "https://forextester.com/",
    hostPatterns: ["forextester.com"],
    cookieDomains: [".forextester.com", "forextester.com"],
  },
};

export function getAssetPlatformConfig(platform: AssetPlatform): AssetPlatformConfig {
  return assetPlatformConfigs[platform];
}

export function isAssetPlatform(platform: string): platform is AssetPlatform {
  return assetPlatforms.includes(platform as AssetPlatform);
}

export function detectAssetPlatformFromHostname(hostname: string): AssetPlatform | null {
  const normalizedHostname = hostname.toLowerCase();

  for (const platform of assetPlatforms) {
    const platformConfig = getAssetPlatformConfig(platform);
    const matchesHostPattern = platformConfig.hostPatterns.some(
      (hostPattern) => normalizedHostname === hostPattern || normalizedHostname.endsWith(`.${hostPattern}`),
    );

    if (matchesHostPattern) {
      return platform;
    }
  }

  return null;
}
