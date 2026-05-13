import { describe, expect, it } from "vitest";

import { parseAssetProxy } from "@/lib/proxy/assetProxy";

describe("asset proxy parser", () => {
  it("parses proxy without auth", () => {
    expect(parseAssetProxy("http:1.2.3.4:8080")).toEqual({
      credentials: null,
      host: "1.2.3.4",
      port: 8080,
      scheme: "http",
    });
  });

  it("parses proxy with scheme separator slash format", () => {
    expect(parseAssetProxy("http://192.168.0.100:60001")).toEqual({
      credentials: null,
      host: "192.168.0.100",
      port: 60001,
      scheme: "http",
    });
  });

  it("parses proxy with url-encoded credentials", () => {
    expect(parseAssetProxy("socks5:10.0.0.2:1080:user%40mail.com:pa%3Ass")).toEqual({
      credentials: {
        password: "pa:ss",
        username: "user@mail.com",
      },
      host: "10.0.0.2",
      port: 1080,
      scheme: "socks5",
    });
  });

  it("throws for unsupported scheme", () => {
    expect(() => parseAssetProxy("socks4:1.2.3.4:1080")).toThrow("Skema proxy asset tidak didukung.");
  });

  it("throws for invalid port", () => {
    expect(() => parseAssetProxy("https:1.2.3.4:0")).toThrow("Port proxy asset tidak valid.");
  });
});
