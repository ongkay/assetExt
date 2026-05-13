import type { AssetPlatform } from "@/lib/asset-access/platforms";
import type { ExtensionAssetResponse, ExtensionBootstrap } from "@/lib/api/extensionApiTypes";
import type { AssetProxyState } from "@/lib/proxy/assetProxy";
import type { BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";

export const runtimeMessageType = {
  bootstrapRequested: "BOOTSTRAP_REQUESTED",
  bootstrapRefreshRequested: "BOOTSTRAP_REFRESH_REQUESTED",
  assetAccessRequested: "ASSET_ACCESS_REQUESTED",
  assetSessionEnsureRequested: "ASSET_SESSION_ENSURE_REQUESTED",
  proxyConflictRefreshRequested: "PROXY_CONFLICT_REFRESH_REQUESTED",
  redeemCdKeyRequested: "REDEEM_CD_KEY_REQUESTED",
  logoutRequested: "LOGOUT_REQUESTED",
  heartbeatStarted: "HEARTBEAT_STARTED",
  heartbeatStopped: "HEARTBEAT_STOPPED",
  overlayStateChanged: "OVERLAY_STATE_CHANGED",
} as const;

export type BootstrapRequestedMessage = {
  type: (typeof runtimeMessageType)["bootstrapRequested"];
};

export type BootstrapRefreshRequestedMessage = {
  type: (typeof runtimeMessageType)["bootstrapRefreshRequested"];
};

export type AssetAccessRequestedMessage = {
  platform: AssetPlatform;
  tabId?: number;
  type: (typeof runtimeMessageType)["assetAccessRequested"];
};

export type AssetSessionEnsureRequestedMessage = {
  platform: AssetPlatform;
  type: (typeof runtimeMessageType)["assetSessionEnsureRequested"];
};

export type ProxyConflictRefreshRequestedMessage = {
  type: (typeof runtimeMessageType)["proxyConflictRefreshRequested"];
};

export type RedeemCdKeyRequestedMessage = {
  code: string;
  type: (typeof runtimeMessageType)["redeemCdKeyRequested"];
};

export type LogoutRequestedMessage = {
  type: (typeof runtimeMessageType)["logoutRequested"];
};

export type HeartbeatStartedMessage = {
  platform: AssetPlatform;
  tabId?: number;
  type: (typeof runtimeMessageType)["heartbeatStarted"];
};

export type HeartbeatStoppedMessage = {
  tabId?: number;
  type: (typeof runtimeMessageType)["heartbeatStopped"];
};

export type OverlayStateChangedMessage = {
  assetResponse?: ExtensionAssetResponse;
  message: string;
  redirectTo?: string;
  requestId?: string;
  state: "idle" | "loading" | "chooser" | "success" | "error";
  type: (typeof runtimeMessageType)["overlayStateChanged"];
};

export type AssetSessionEnsureResult = {
  action: "none" | "proxy_blocked" | "reload_required" | "redirect_login";
  message: string | null;
  redirectTo: string | null;
  shouldStartHeartbeat: boolean;
};

export type RuntimeMessage =
  | BootstrapRequestedMessage
  | BootstrapRefreshRequestedMessage
  | AssetAccessRequestedMessage
  | AssetSessionEnsureRequestedMessage
  | ProxyConflictRefreshRequestedMessage
  | RedeemCdKeyRequestedMessage
  | LogoutRequestedMessage
  | HeartbeatStartedMessage
  | HeartbeatStoppedMessage
  | OverlayStateChangedMessage;

export type RuntimeSuccessResponse<TValue> = {
  ok: true;
  value: TValue;
};

export type RuntimeErrorResponse = {
  errorMessage: string;
  ok: false;
};

export type RuntimeResponse<TValue> = RuntimeSuccessResponse<TValue> | RuntimeErrorResponse;

export type BootstrapRuntimeValue = {
  cache: BootstrapCacheRecord | null;
  isSyncing: boolean;
};

export type BootstrapRuntimeResponse = RuntimeResponse<BootstrapRuntimeValue>;
export type BootstrapRefreshRuntimeResponse = RuntimeResponse<BootstrapCacheRecord>;
export type AssetAccessRuntimeResponse = RuntimeResponse<ExtensionAssetResponse>;
export type AssetSessionEnsureRuntimeResponse = RuntimeResponse<AssetSessionEnsureResult>;
export type ProxyConflictRefreshRuntimeResponse = RuntimeResponse<AssetProxyState>;
export type RedeemCdKeyRuntimeResponse = RuntimeResponse<ExtensionBootstrap>;
export type LogoutRuntimeResponse = RuntimeResponse<{ redirectTo: string }>;
