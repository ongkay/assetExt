import { beforeEach, describe, expect, it, vi } from "vitest";

const clearPeerGuardManagedCookiesMock = vi.fn();
const clearPeerGuardStateMock = vi.fn();
const createPeerGuardControllerMock = vi.fn();
const getPeerGuardIdentityMock = vi.fn();
const redirectPeerGuardProtectedAssetTabsMock = vi.fn();

vi.mock("@/background/core/tabs", () => ({
  redirectPeerGuardProtectedAssetTabs: redirectPeerGuardProtectedAssetTabsMock,
}));

vi.mock("@/lib/peer-guard/createPeerGuardController", () => ({
  createPeerGuardController: createPeerGuardControllerMock,
}));

vi.mock("@/lib/peer-guard/managedCookies", () => ({
  clearPeerGuardManagedCookies: clearPeerGuardManagedCookiesMock,
}));

vi.mock("@/lib/peer-guard/peerGuardStorage", () => ({
  clearPeerGuardState: clearPeerGuardStateMock,
}));

vi.mock("@/lib/peer-guard/peerGuardConfig", () => ({
  getPeerGuardIdentity: getPeerGuardIdentityMock,
  peerGuardStateStorageKey: "assetManager.peerGuardState",
}));

describe("ext-2 background peer guard", () => {
  beforeEach(() => {
    vi.resetModules();
    clearPeerGuardManagedCookiesMock.mockReset();
    clearPeerGuardStateMock.mockReset();
    createPeerGuardControllerMock.mockReset();
    getPeerGuardIdentityMock.mockReset();
    redirectPeerGuardProtectedAssetTabsMock.mockReset();

    getPeerGuardIdentityMock.mockReturnValue({
      warningPagePath: "ext-2-blocked.html",
    });
    redirectPeerGuardProtectedAssetTabsMock.mockResolvedValue({
      redirectedTabCount: 0,
    });
    createPeerGuardControllerMock.mockReturnValue({
      initialize: vi.fn().mockResolvedValue(undefined),
      readCurrentState: vi.fn(),
      refreshState: vi.fn(),
    });

    vi.stubGlobal("chrome", {
      runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://runtime-id/${path}`),
        onMessage: {
          addListener: vi.fn(),
        },
      },
      storage: {
        session: {
          remove: vi.fn().mockResolvedValue(undefined),
        },
      },
    });
  });

  it("preserves blocked state storage while clearing session storage on peer block", async () => {
    await import("../../../src/ext-2/background/index");

    const createPeerGuardControllerCall = createPeerGuardControllerMock.mock.calls[0]?.[0] as {
      onBlocked: () => Promise<{ redirectedAssetTabCount?: number }>;
    };

    expect(createPeerGuardControllerCall).toBeDefined();

    const blockedResult = await createPeerGuardControllerCall.onBlocked();
    const sessionRemoveMock = chrome.storage.session?.remove as ReturnType<typeof vi.fn>;

    expect(clearPeerGuardManagedCookiesMock).toHaveBeenCalledTimes(1);
    expect(clearPeerGuardStateMock).not.toHaveBeenCalled();
    expect(sessionRemoveMock).toHaveBeenCalledWith(["assetManager.peerGuardState"]);
    expect(redirectPeerGuardProtectedAssetTabsMock).toHaveBeenCalledWith(
      "chrome-extension://runtime-id/ext-2-blocked.html",
    );
    expect(blockedResult).toEqual({
      redirectedAssetTabCount: 0,
    });
  });
});
