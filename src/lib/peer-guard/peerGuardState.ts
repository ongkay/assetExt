import { getPeerGuardIdentity, type PeerGuardRole } from "@/lib/peer-guard/peerGuardConfig";

export type PeerGuardBlockReason = "peer_disabled" | "peer_missing";

export type PeerGuardState = {
  blockedAt: number | null;
  isBlocked: boolean;
  message: string | null;
  peerExtensionId: string;
  peerLabel: PeerGuardRole;
  reason: PeerGuardBlockReason | null;
  selfRole: PeerGuardRole;
  updatedAt: number;
};

export function createUnblockedPeerGuardState(role: PeerGuardRole, now = Date.now()): PeerGuardState {
  const identity = getPeerGuardIdentity(role);

  return {
    blockedAt: null,
    isBlocked: false,
    message: null,
    peerExtensionId: identity.peerExtensionId,
    peerLabel: identity.peerLabel,
    reason: null,
    selfRole: role,
    updatedAt: now,
  };
}

export function createBlockedPeerGuardState(
  role: PeerGuardRole,
  reason: PeerGuardBlockReason,
  now = Date.now(),
): PeerGuardState {
  const identity = getPeerGuardIdentity(role);

  return {
    blockedAt: now,
    isBlocked: true,
    message: createPeerGuardBlockedMessage(role, reason),
    peerExtensionId: identity.peerExtensionId,
    peerLabel: identity.peerLabel,
    reason,
    selfRole: role,
    updatedAt: now,
  };
}

export function createPeerGuardBlockedMessage(role: PeerGuardRole, reason: PeerGuardBlockReason): string {
  const identity = getPeerGuardIdentity(role);

  if (reason === "peer_disabled") {
    return `Dilarang menonaktifkan ${identity.peerLabel}. Session extension telah dibersihkan. Aktifkan kembali ${role} dan ${identity.peerLabel} untuk melanjutkan.`;
  }

  return `${identity.peerLabel} wajib terpasang dan aktif. Semua fitur dikunci sampai ${role} dan ${identity.peerLabel} aktif bersamaan.`;
}
