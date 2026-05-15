import { beforeEach, describe, expect, it, vi } from "vitest";

type StoredPeerGuardState = {
  isBlocked: boolean;
  message: string;
  peerLabel: "ext-1" | "ext-2";
  reason: "peer_disabled" | "peer_missing" | null;
  selfRole: "ext-1" | "ext-2";
};

const readPeerExtensionStatusMock = vi.fn();
const readPeerGuardStateMock = vi.fn();
const writePeerGuardStateMock = vi.fn();
const openOrFocusPeerGuardWarningPageMock = vi.fn();

vi.mock("@/lib/peer-guard/peerExtensionStatus", () => ({
  readPeerExtensionStatus: readPeerExtensionStatusMock,
}));

vi.mock("@/lib/peer-guard/peerGuardStorage", () => ({
  readPeerGuardState: readPeerGuardStateMock,
  writePeerGuardState: writePeerGuardStateMock,
}));

vi.mock("@/lib/peer-guard/peerGuardWarningPage", () => ({
  openOrFocusPeerGuardWarningPage: openOrFocusPeerGuardWarningPageMock,
}));

describe("createPeerGuardController", () => {
  beforeEach(() => {
    vi.resetModules();
    readPeerExtensionStatusMock.mockReset();
    readPeerGuardStateMock.mockReset();
    writePeerGuardStateMock.mockReset();
    openOrFocusPeerGuardWarningPageMock.mockReset();
  });

  it("persists the blocked state before running the blocked handler", async () => {
    let storedPeerGuardState: StoredPeerGuardState | null = null;

    readPeerGuardStateMock.mockImplementation(async () => storedPeerGuardState);
    writePeerGuardStateMock.mockImplementation(async (nextPeerGuardState: StoredPeerGuardState) => {
      storedPeerGuardState = nextPeerGuardState;
    });
    readPeerExtensionStatusMock.mockResolvedValue({
      exists: true,
      isEnabled: false,
      reason: "peer_disabled",
    });

    const { createPeerGuardController } = await import("@/lib/peer-guard/createPeerGuardController");

    let observedStateDuringBlockedHandler: StoredPeerGuardState | null = null;

    const peerGuardController = createPeerGuardController({
      onBlocked: async () => {
        observedStateDuringBlockedHandler = (await peerGuardController.readCurrentState()) as StoredPeerGuardState;

        return { redirectedAssetTabCount: 1 };
      },
      selfRole: "ext-1",
    });

    const nextPeerGuardState = await peerGuardController.refreshState();

    expect(nextPeerGuardState.isBlocked).toBe(true);
    expect(observedStateDuringBlockedHandler).toMatchObject({
      isBlocked: true,
      peerLabel: "ext-2",
      reason: "peer_disabled",
      selfRole: "ext-1",
    });
    expect(writePeerGuardStateMock).toHaveBeenCalledTimes(1);
    expect(openOrFocusPeerGuardWarningPageMock).not.toHaveBeenCalled();
  });
});
