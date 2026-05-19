import {
  getChromeStorageValue,
  removeChromeStorageValue,
  setChromeStorageValue,
} from "@/lib/storage/chromeStorage";
import { cookieGuardStateStorageKey } from "@/lib/cookie-guard/cookieGuardConfig";
import type { CookieGuardState } from "@/lib/cookie-guard/cookieGuardState";

export function readCookieGuardState(): Promise<CookieGuardState | null> {
  return getChromeStorageValue<CookieGuardState>(cookieGuardStateStorageKey);
}

export function writeCookieGuardState(cookieGuardState: CookieGuardState): Promise<void> {
  return setChromeStorageValue(cookieGuardStateStorageKey, cookieGuardState);
}

export function clearCookieGuardState(): Promise<void> {
  return removeChromeStorageValue(cookieGuardStateStorageKey);
}
