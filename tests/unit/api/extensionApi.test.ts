import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExtensionApiConfig } from "@/lib/api/extensionApiConfig";
import { fetchExtensionBootstrap, redeemExtensionCdKey } from "@/lib/api/extensionApi";
import type {
  ExtensionAssetResponse,
  ExtensionAssetSummary,
  ExtensionBootstrap,
  ExtensionCookiePayload,
  ExtensionCookieSameSite,
  ExtensionRedeemSuccess,
} from "@/lib/api/extensionApiTypes";

const originalFetch = globalThis.fetch;
const originalChrome = globalThis.chrome;

type FetchMock = ReturnType<
  typeof vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>
>;

const extensionApiConfig: ExtensionApiConfig = {
  apiBaseUrl: "http://localhost:3000",
  extensionId: "test-extension-id",
  extensionVersion: "2.0.0",
  isDev: true,
};

describe("extension API client", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.chrome = originalChrome;
    vi.restoreAllMocks();
  });

  it("sends bootstrap request with extension credentials and headers", async () => {
    const fetchMock: FetchMock = vi.fn(() =>
      Promise.resolve(
        Response.json({
          auth: { status: "unauthenticated" },
          version: { status: "supported" },
        }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    await fetchExtensionBootstrap(extensionApiConfig);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    const requestHeaders = new Headers(requestInit?.headers);

    expect(requestUrl).toBe("http://localhost:3000/api/ext/bootstrap?version=2.0.0");
    expect(requestInit).toMatchObject({
      credentials: "include",
      method: "GET",
    });
    expect(requestHeaders.get("x-extension-version")).toBe("2.0.0");
    expect(requestHeaders.get("x-ext-dev-extension-id")).toBe("test-extension-id");
    expect(requestHeaders.get("x-ext-dev-origin")).toBe("chrome-extension://test-extension-id");
    expect(requestHeaders.get("x-extension-id")).toBeNull();
  });

  it("sends production extension id header for non-local API hosts", async () => {
    const fetchMock: FetchMock = vi.fn(() =>
      Promise.resolve(
        Response.json({
          auth: { status: "unauthenticated" },
          version: { status: "supported" },
        }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    await fetchExtensionBootstrap({
      ...extensionApiConfig,
      apiBaseUrl: "https://app.assetnext.dev",
      isDev: false,
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    const requestHeaders = new Headers(requestInit?.headers);

    expect(requestHeaders.get("x-extension-id")).toBe("test-extension-id");
    expect(requestHeaders.get("origin")).toBe("chrome-extension://test-extension-id");
    expect(requestHeaders.get("x-extension-version")).toBe("2.0.0");
    expect(requestHeaders.get("x-ext-dev-extension-id")).toBeNull();
    expect(requestHeaders.get("x-ext-dev-origin")).toBeNull();
  });

  it("uses production headers for local API hosts when isDev is false", async () => {
    const fetchMock: FetchMock = vi.fn(() =>
      Promise.resolve(
        Response.json({
          auth: { status: "unauthenticated" },
          version: { status: "supported" },
        }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    await fetchExtensionBootstrap({
      ...extensionApiConfig,
      isDev: false,
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    const requestHeaders = new Headers(requestInit?.headers);

    expect(requestHeaders.get("x-extension-id")).toBe("test-extension-id");
    expect(requestHeaders.get("origin")).toBe("chrome-extension://test-extension-id");
    expect(requestHeaders.get("x-ext-dev-extension-id")).toBeNull();
    expect(requestHeaders.get("x-ext-dev-origin")).toBeNull();
    expect(requestHeaders.get("x-ext-dev-app-session")).toBeNull();
  });

  it("adds local dev app session header when Chrome cookie is available", async () => {
    const fetchMock: FetchMock = vi.fn(() =>
      Promise.resolve(Response.json({ ok: true, redirectTo: "/login" })),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    globalThis.chrome = {
      cookies: {
        get: vi.fn(() => Promise.resolve({ value: "local-app-session" })),
      },
    } as unknown as typeof chrome;

    await redeemExtensionCdKey(extensionApiConfig, "ACTIVE-CODE");

    const [, requestInit] = fetchMock.mock.calls[0];
    const requestHeaders = new Headers(requestInit?.headers);

    expect(requestHeaders.get("x-ext-dev-app-session")).toBe("local-app-session");
  });

  it("returns redeem error contract for invalid CD-Key response", async () => {
    const redeemError = {
      code: "EXT_REDEEM_INVALID" as const,
      message: "CD-Key tidak valid atau sudah terpakai.",
    };
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(Response.json({ error: redeemError }, { status: 400 })),
    ) as typeof fetch;

    await expect(redeemExtensionCdKey(extensionApiConfig, "INVALID-CODE")).resolves.toEqual({
      ok: false,
      error: redeemError,
      status: 400,
    });
  });

  it("exports plan-aligned API response type names and shapes", () => {
    const assetSummary: ExtensionAssetSummary = {
      hasPrivateAccess: false,
      hasShareAccess: true,
      platform: "tradingview",
    };
    const bootstrap: ExtensionBootstrap = {
      assets: [assetSummary],
      auth: { status: "authenticated" },
      subscription: {
        countdownSeconds: 100,
        endAt: null,
        packageName: null,
        status: "active",
      },
      user: {
        avatarUrl: null,
        email: "user@example.com",
        id: "user-id",
        publicId: "MEM-001",
        username: "user-name",
      },
      version: { status: "supported" },
    };
    const sameSite: ExtensionCookieSameSite = "no_restriction";
    const cookiePayload: ExtensionCookiePayload = {
      name: "session",
      sameSite,
      value: "cookie-value",
    };
    const assetResponseWithoutProxy: ExtensionAssetResponse = {
      cookies: [cookiePayload],
      mode: "share",
      platform: "tradingview",
      status: "ready",
    };
    const redeemSuccess: ExtensionRedeemSuccess = {
      bootstrap,
      message: "CD-Key berhasil diredeem.",
      ok: true,
    };

    expect(assetResponseWithoutProxy.status).toBe("ready");
    expect(redeemSuccess.bootstrap).toBe(bootstrap);
  });
});
