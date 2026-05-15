export const peerGuardStateStorageKey = "assetManager.peerGuardState";
export const ext1PeerGuardWarningPagePath = "ext-1-blocked.html";
export const ext2PeerGuardWarningPagePath = "ext-2-blocked.html";
export const ext1ExtensionId = "bhfijllhcnbmngbehikmgaglokmgeojh";
export const ext2ExtensionId = "hkgilkleidfdggbpkmfnbbnbpledigcn";

export type PeerGuardRole = "ext-1" | "ext-2";

export type PeerGuardIdentity = {
  extensionId: string;
  peerExtensionId: string;
  peerLabel: PeerGuardRole;
  selfRole: PeerGuardRole;
  warningPagePath: string;
};

const peerGuardIdentities: Record<PeerGuardRole, PeerGuardIdentity> = {
  "ext-1": {
    extensionId: ext1ExtensionId,
    peerExtensionId: ext2ExtensionId,
    peerLabel: "ext-2",
    selfRole: "ext-1",
    warningPagePath: ext1PeerGuardWarningPagePath,
  },
  "ext-2": {
    extensionId: ext2ExtensionId,
    peerExtensionId: ext1ExtensionId,
    peerLabel: "ext-1",
    selfRole: "ext-2",
    warningPagePath: ext2PeerGuardWarningPagePath,
  },
};

export function getPeerGuardIdentity(role: PeerGuardRole): PeerGuardIdentity {
  return peerGuardIdentities[role];
}
