import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildCookieSetUrl,
  clearAllAssetPlatformCookies,
  toChromeCookieDetails,
  toChromeSameSite,
} from "@/background/core/cookies";

const originalChrome = globalThis.chrome;

describe("background cookie helpers", () => {
  it("builds secure cookie set details for domain cookies", () => {
    expect(
      toChromeCookieDetails({
        domain: ".tradingview.com",
        expirationDate: 1_234,
        hostOnly: false,
        httpOnly: true,
        name: "sessionid",
        sameSite: "lax",
        secure: true,
        storeId: "0",
        value: "abc",
      }),
    ).toEqual({
      domain: ".tradingview.com",
      expirationDate: 1_234,
      httpOnly: true,
      name: "sessionid",
      path: "/",
      sameSite: "lax",
      secure: true,
      storeId: "0",
      url: "https://tradingview.com/",
      value: "abc",
    });
  });

  it("uses https cookie API URLs while preserving insecure cookie attributes", () => {
    expect(
      toChromeCookieDetails({
        domain: "forextester.com",
        hostOnly: true,
        name: "token",
        path: "/app",
        secure: false,
        value: "def",
      }),
    ).toEqual({
      domain: undefined,
      expirationDate: undefined,
      httpOnly: undefined,
      name: "token",
      path: "/app",
      sameSite: undefined,
      secure: false,
      storeId: undefined,
      url: "https://forextester.com/app",
      value: "def",
    });
  });

  it("rejects cookies without a domain before setting them", () => {
    expect(() => buildCookieSetUrl({ name: "missing", value: "" })).toThrow(
      "Cookie missing tidak memiliki domain.",
    );
  });

  it("maps unspecified sameSite to chrome default handling", () => {
    expect(toChromeSameSite(undefined)).toBeUndefined();
    expect(toChromeSameSite("unspecified")).toBeUndefined();
    expect(toChromeSameSite("no_restriction")).toBe("no_restriction");
  });

  it("clears cookies for all configured asset platforms", async () => {
    const getAll = vi
      .fn()
      .mockResolvedValueOnce([{ domain: ".tradingview.com", name: "tv", path: "/", storeId: "0" }])
      .mockResolvedValueOnce([{ domain: "tradingview.com", name: "tv2", path: "/", storeId: "0" }])
      .mockResolvedValueOnce([{ domain: ".forextester.com", name: "ft", path: "/", storeId: "0" }])
      .mockResolvedValueOnce([{ domain: "forextester.com", name: "ft2", path: "/", storeId: "0" }]);
    const remove = vi.fn(() => Promise.resolve(null));

    globalThis.chrome = {
      cookies: {
        getAll,
        remove,
      },
    } as unknown as typeof chrome;

    await clearAllAssetPlatformCookies();

    expect(getAll).toHaveBeenCalledTimes(4);
    expect(remove).toHaveBeenCalledTimes(4);
    expect(getAll.mock.calls.map(([details]) => details.domain)).toEqual([
      ".tradingview.com",
      "tradingview.com",
      ".forextester.com",
      "forextester.com",
    ]);
  });
});

afterEach(() => {
  globalThis.chrome = originalChrome;
});
