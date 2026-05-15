import { describe, expect, it } from "vitest";

import {
  assetPlatforms,
  detectAssetPlatformFromHostname,
  getAssetPlatformConfig,
  getPeerGuardProtectedAssetHostPatterns,
} from "@/lib/asset-access/platforms";

describe("asset platform mapping", () => {
  it("defines supported asset platforms", () => {
    expect(assetPlatforms).toEqual(["tradingview", "fxtester"]);
  });

  it("detects platforms from supported hostnames", () => {
    expect(detectAssetPlatformFromHostname("www.tradingview.com")).toBe("tradingview");
    expect(detectAssetPlatformFromHostname("id.tradingview.com")).toBe("tradingview");
    expect(detectAssetPlatformFromHostname("whoer.net")).toBe("tradingview");
    expect(detectAssetPlatformFromHostname("api.whoer.net")).toBe("tradingview");
    expect(detectAssetPlatformFromHostname("forextester.com")).toBe("fxtester");
    expect(detectAssetPlatformFromHostname("www.forextester.com")).toBe("fxtester");
    expect(detectAssetPlatformFromHostname("browserscan.net")).toBe("fxtester");
    expect(detectAssetPlatformFromHostname("app.browserscan.net")).toBe("fxtester");
  });

  it("returns null for unsupported hostnames", () => {
    expect(detectAssetPlatformFromHostname("example.com")).toBeNull();
  });

  it("returns the TradingView platform config", () => {
    expect(getAssetPlatformConfig("tradingview")).toMatchObject({
      label: "TradingView",
      targetUrl: "https://www.tradingview.com/chart/",
      cookieDomains: [".tradingview.com", "tradingview.com"],
      hostPatterns: ["tradingview.com", "whoer.net"],
      peerGuardProtectedHostPatterns: ["tradingview.com"],
    });
  });

  it("returns only production asset hosts for peer-guard redirects", () => {
    expect(getPeerGuardProtectedAssetHostPatterns()).toEqual([
      "tradingview.com",
      "forextester.com",
    ]);
  });
});
