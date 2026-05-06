import { describe, expect, it } from "vitest";

import { getAutomaticAssetMode } from "@/lib/asset-access/mode";

describe("automatic asset mode", () => {
  it("returns the effective private mode from bootstrap", () => {
    expect(
      getAutomaticAssetMode({
        mode: "private",
      }),
    ).toBe("private");
  });

  it("returns the effective share mode from bootstrap", () => {
    expect(
      getAutomaticAssetMode({
        mode: "share",
      }),
    ).toBe("share");
  });

  it("does not alter the share mode when a private upgrade is pending", () => {
    expect(getAutomaticAssetMode({ mode: "share" })).toBe("share");
  });
});
