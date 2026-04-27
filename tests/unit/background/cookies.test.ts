import { describe, expect, it } from "vitest";

import {
  buildCookieSetUrl,
  toChromeCookieDetails,
  toChromeSameSite,
} from "@/background/core/cookies";

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
        domain: "fxreplay.com",
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
      url: "https://fxreplay.com/app",
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
});
