import {
  getChromeStorageValue,
  removeChromeStorageValue,
  setChromeStorageValue,
} from "@/lib/storage/chromeStorage";
import type { PeerGuardState } from "@/lib/peer-guard/peerGuardState";
import { peerGuardStateStorageKey } from "@/lib/peer-guard/peerGuardConfig";

export function readPeerGuardState(): Promise<PeerGuardState | null> {
  return getChromeStorageValue<PeerGuardState>(peerGuardStateStorageKey);
}

export function writePeerGuardState(peerGuardState: PeerGuardState): Promise<void> {
  return setChromeStorageValue(peerGuardStateStorageKey, peerGuardState);
}

export function clearPeerGuardState(): Promise<void> {
  return removeChromeStorageValue(peerGuardStateStorageKey);
}
