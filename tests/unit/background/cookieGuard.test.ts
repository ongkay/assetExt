import { beforeEach, describe, expect, it, vi } from "vitest";

const clearExtensionSessionArtifactsForSecurityBlockMock = vi.fn();
const redirectPeerGuardProtectedAssetTabsMock = vi.fn();
const openOrFocusPeerGuardWarningPageMock = vi.fn();
const readCookieGuardExtensionCandidatesMock = vi.fn();
const readCookieGuardStateMock = vi.fn();
const writeCookieGuardStateMock = vi.fn();

vi.mock("@/background/core/bootstrap", () => ({
  clearExtensionSessionArtifactsForSecurityBlock: clearExtensionSessionArtifactsForSecurityBlockMock,
}));

vi.mock("@/background/core/tabs", () => ({
  redirectPeerGuardProtectedAssetTabs: redirectPeerGuardProtectedAssetTabsMock,
}));

vi.mock("@/lib/peer-guard/peerGuardWarningPage", () => ({
  openOrFocusPeerGuardWarningPage: openOrFocusPeerGuardWarningPageMock,
}));

vi.mock("@/lib/cookie-guard/cookieExtensionManagement", () => ({
  readCookieGuardExtensionCandidates: readCookieGuardExtensionCandidatesMock,
}));

vi.mock("@/lib/cookie-guard/cookieGuardStorage", () => ({
  readCookieGuardState: readCookieGuardStateMock,
  writeCookieGuardState: writeCookieGuardStateMock,
}));

describe("cookie guard", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    clearExtensionSessionArtifactsForSecurityBlockMock.mockReset();
    redirectPeerGuardProtectedAssetTabsMock.mockReset();
    openOrFocusPeerGuardWarningPageMock.mockReset();
    readCookieGuardExtensionCandidatesMock.mockReset();
    readCookieGuardStateMock.mockReset();
    writeCookieGuardStateMock.mockReset();

    clearExtensionSessionArtifactsForSecurityBlockMock.mockResolvedValue(undefined);
    redirectPeerGuardProtectedAssetTabsMock.mockResolvedValue({
      redirectedTabCount: 2,
      warningTabId: 10,
    });
    openOrFocusPeerGuardWarningPageMock.mockResolvedValue(undefined);

    vi.stubGlobal("chrome", {
      management: {
        onDisabled: { addListener: vi.fn() },
        onEnabled: { addListener: vi.fn() },
        onInstalled: { addListener: vi.fn() },
        onUninstalled: { addListener: vi.fn() },
      },
      runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://runtime-id/${path}`),
      },
    });
  });

  it("persists the blocked state before clearing session artifacts", async () => {
    let storedCookieGuardState: unknown = null;

    readCookieGuardStateMock.mockImplementation(async () => storedCookieGuardState);
    writeCookieGuardStateMock.mockImplementation(async (nextCookieGuardState: unknown) => {
      storedCookieGuardState = nextCookieGuardState;
    });
    readCookieGuardExtensionCandidatesMock.mockResolvedValue([
      {
        iconUrl: null,
        id: "cookie-ext",
        installType: "normal",
        mayDisable: true,
        name: "Cookie Spy",
      },
    ]);

    const cookieGuard = await import("@/ext-1/background/core/cookieGuard");
    const nextCookieGuardState = await cookieGuard.refreshCookieGuardState();

    expect(nextCookieGuardState.isBlocked).toBe(true);
    expect(storedCookieGuardState).toMatchObject({
      extensions: [
        {
          id: "cookie-ext",
          name: "Cookie Spy",
        },
      ],
      isBlocked: true,
      reason: "cookies_permission_detected",
    });
    expect(writeCookieGuardStateMock).toHaveBeenCalledTimes(1);
    expect(clearExtensionSessionArtifactsForSecurityBlockMock).toHaveBeenCalledTimes(1);
    expect(writeCookieGuardStateMock.mock.invocationCallOrder[0]).toBeLessThan(
      clearExtensionSessionArtifactsForSecurityBlockMock.mock.invocationCallOrder[0],
    );
    expect(redirectPeerGuardProtectedAssetTabsMock).toHaveBeenCalledWith(
      "chrome-extension://runtime-id/cookies-blocked.html",
    );
    expect(openOrFocusPeerGuardWarningPageMock).not.toHaveBeenCalled();
  });

  it("opens the warning page when there is no protected asset tab to redirect", async () => {
    readCookieGuardStateMock.mockResolvedValue(null);
    writeCookieGuardStateMock.mockResolvedValue(undefined);
    readCookieGuardExtensionCandidatesMock.mockResolvedValue([
      {
        iconUrl: null,
        id: "cookie-ext",
        installType: "normal",
        mayDisable: true,
        name: "Cookie Spy",
      },
    ]);
    redirectPeerGuardProtectedAssetTabsMock.mockResolvedValue({
      redirectedTabCount: 0,
      warningTabId: null,
    });

    const cookieGuard = await import("@/ext-1/background/core/cookieGuard");

    await cookieGuard.refreshCookieGuardState();

    expect(openOrFocusPeerGuardWarningPageMock).toHaveBeenCalledWith("cookies-blocked.html");
  });
});
