import { describe, expect, test, vi } from "vitest";

import {
  markRecentAutoAccessReload,
  shouldSkipRecentAutoAccessReload,
} from "@/content/autoAccessReloadGuard";
import { injectionCooldownMs } from "@/lib/storage/injectionCooldown";

describe("auto access reload guard", () => {
  test("does not skip before a reload is marked", () => {
    expect(shouldSkipRecentAutoAccessReload("tradingview", 1_000)).toBe(false);
  });

  test("skips after a reload is marked within the cooldown TTL", () => {
    markRecentAutoAccessReload("tradingview", 1_000);

    expect(shouldSkipRecentAutoAccessReload("tradingview", 1_000 + injectionCooldownMs)).toBe(
      true,
    );
  });

  test("does not skip after the cooldown TTL expires", () => {
    markRecentAutoAccessReload("tradingview", 1_000);

    expect(
      shouldSkipRecentAutoAccessReload("tradingview", 1_000 + injectionCooldownMs + 1),
    ).toBe(false);
  });

  test("uses separate storage keys per platform", () => {
    markRecentAutoAccessReload("tradingview", 1_000);

    expect(shouldSkipRecentAutoAccessReload("fxreplay", 1_000 + injectionCooldownMs)).toBe(
      false,
    );
  });

  test("does not throw when sessionStorage is unavailable", () => {
    const sessionStorageSpy = vi
      .spyOn(window, "sessionStorage", "get")
      .mockImplementation(() => {
        throw new Error("sessionStorage unavailable");
      });

    expect(() => markRecentAutoAccessReload("tradingview", 1_000)).not.toThrow();
    expect(shouldSkipRecentAutoAccessReload("tradingview", 1_000)).toBe(false);

    sessionStorageSpy.mockRestore();
  });
});
