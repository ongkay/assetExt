import type { AssetPlatform } from "@/lib/asset-access/platforms";
import type { SubscriptionStatus } from "@/lib/asset-access/subscription";

export type ExtensionMode = "private" | "share";

export type ExtensionVersionStatus =
  | { status: "supported" }
  | {
      status: "update_available";
      downloadUrl: string;
      latestVersion: string;
      minimumVersion: string;
    }
  | {
      status: "update_required";
      downloadUrl: string;
      latestVersion: string;
      minimumVersion: string;
    };

export type ExtensionAuthState =
  | {
      status: "unauthenticated";
      loginUrl: string;
    }
  | {
      status: "authenticated";
    };

export type ExtensionUser = {
  avatarUrl: string | null;
  email: string;
  publicId: string;
  username: string;
};

export type ExtensionAssetSummary = {
  mode: ExtensionMode;
  nextMode?: "private";
  platform: AssetPlatform;
};

export type ExtensionPackage = {
  amountRp: number;
  checkoutUrl: string;
  id: string;
  name: string;
  summary: string;
};

export type ExtensionSubscription = {
  endAt: string | null;
  packageName: string | null;
  status: SubscriptionStatus;
};

export type ExtensionRedeemState = {
  enabled: boolean;
};

export type ExtensionBootstrap = {
  assets?: ExtensionAssetSummary[];
  auth: ExtensionAuthState;
  packages?: ExtensionPackage[];
  redeem?: ExtensionRedeemState;
  subscription?: ExtensionSubscription;
  user?: ExtensionUser;
  version: ExtensionVersionStatus;
};

export type ExtensionCookieSameSite = "no_restriction" | "lax" | "strict" | "unspecified";

export type ExtensionCookiePayload = {
  domain?: string;
  expirationDate?: number;
  hostOnly?: boolean;
  httpOnly?: boolean;
  name: string;
  path?: string;
  sameSite?: ExtensionCookieSameSite;
  secure?: boolean;
  session?: boolean;
  storeId?: string;
  value: string;
};

export type ExtensionAssetReadyResponse = {
  cookies: ExtensionCookiePayload[];
  mode: ExtensionMode;
  platform: AssetPlatform;
  proxy?: string;
  status: "ready";
};

export type ExtensionAssetForbiddenResponse = {
  reason: "subscription_required";
  status: "forbidden";
};

export type ExtensionAssetResponse = ExtensionAssetReadyResponse | ExtensionAssetForbiddenResponse;

export type ExtensionHeartbeatResponse = {
  ok: true;
  timestamp: string;
};

export type ExtensionRedeemSuccess = {
  bootstrap: ExtensionBootstrap;
  message: string;
  ok: true;
};

export type ExtensionLogoutResponse = {
  ok: true;
  redirectTo: string;
};

export type ExtensionApiErrorCode =
  | "EXT_HEADER_REQUIRED"
  | "EXT_REQUEST_INVALID"
  | "EXT_REDEEM_INVALID"
  | "EXT_UNAUTHENTICATED"
  | "EXT_ORIGIN_DENIED"
  | "EXT_USER_BANNED"
  | "EXT_UPDATE_REQUIRED"
  | "EXT_MODE_NOT_ALLOWED"
  | "EXT_REDEEM_USED"
  | "EXT_ASSET_UNAVAILABLE";

export type ExtensionApiError = {
  code: ExtensionApiErrorCode;
  message: string;
};

export type ExtensionApiResult<TValue> =
  | {
      ok: true;
      status: number;
      value: TValue;
    }
  | {
      ok: false;
      error: ExtensionApiError;
      status: number;
    };
