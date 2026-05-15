// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createBlockedPeerGuardState,
  createUnblockedPeerGuardState,
} from "../../../src/lib/peer-guard/peerGuardState";

describe("peer guard state factories", () => {
  it("creates a blocked state with a hard warning message", () => {
    const peerGuardState = createBlockedPeerGuardState("ext-1", "peer_disabled", 123);

    expect(peerGuardState).toMatchObject({
      blockedAt: 123,
      isBlocked: true,
      peerExtensionId: "hkgilkleidfdggbpkmfnbbnbpledigcn",
      peerLabel: "ext-2",
      reason: "peer_disabled",
      selfRole: "ext-1",
      updatedAt: 123,
    });
    expect(peerGuardState.message).toContain("Dilarang menonaktifkan ext-2");
  });

  it("creates an unblocked state for a healthy pair", () => {
    const peerGuardState = createUnblockedPeerGuardState("ext-2", 456);

    expect(peerGuardState).toEqual({
      blockedAt: null,
      isBlocked: false,
      message: null,
      peerExtensionId: "bhfijllhcnbmngbehikmgaglokmgeojh",
      peerLabel: "ext-1",
      reason: null,
      selfRole: "ext-2",
      updatedAt: 456,
    });
  });
});
