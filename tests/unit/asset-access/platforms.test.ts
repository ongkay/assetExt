import { describe, expect, it } from "vitest";

import {
  assetPlatforms,
  detectAssetPlatformFromHostname,
  getAssetPlatformConfig,
} from "@/lib/asset-access/platforms";

describe("asset platform mapping", () => {
  it("defines supported asset platforms", () => {
    expect(assetPlatforms).toEqual(["tradingview", "fxreplay", "fxtester"]);
  });

  it("detects platforms from supported hostnames", () => {
    expect(detectAssetPlatformFromHostname("www.tradingview.com")).toBe("tradingview");
    expect(detectAssetPlatformFromHostname("id.tradingview.com")).toBe("tradingview");
    expect(detectAssetPlatformFromHostname("fxreplay.com")).toBe("fxreplay");
    expect(detectAssetPlatformFromHostname("app.fxreplay.com")).toBe("fxreplay");
    expect(detectAssetPlatformFromHostname("forextester.com")).toBe("fxtester");
    expect(detectAssetPlatformFromHostname("www.forextester.com")).toBe("fxtester");
  });

  it("returns null for unsupported hostnames", () => {
    expect(detectAssetPlatformFromHostname("example.com")).toBeNull();
  });

  it("returns the TradingView platform config", () => {
    expect(getAssetPlatformConfig("tradingview")).toMatchObject({
      label: "TradingView",
      targetUrl: "https://www.tradingview.com/chart/",
      cookieDomains: [".tradingview.com", "tradingview.com"],
    });
  });
});
