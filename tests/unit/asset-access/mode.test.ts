import { describe, expect, it } from "vitest";

import { getAutomaticAssetMode } from "@/lib/asset-access/mode";

describe("automatic asset mode", () => {
  it("prefers private access when the asset has private and share access", () => {
    expect(
      getAutomaticAssetMode({
        hasPrivateAccess: true,
        hasShareAccess: true,
      }),
    ).toBe("private");
  });

  it("uses share access when private access is unavailable", () => {
    expect(
      getAutomaticAssetMode({
        hasPrivateAccess: false,
        hasShareAccess: true,
      }),
    ).toBe("share");
  });

  it("returns null when the asset has no usable access", () => {
    expect(
      getAutomaticAssetMode({
        hasPrivateAccess: false,
        hasShareAccess: false,
      }),
    ).toBeNull();
  });
});
