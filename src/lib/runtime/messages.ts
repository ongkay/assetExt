import type { AssetPlatform } from "@/lib/asset-access/platforms";
import type {
  ExtensionAssetResponse,
  ExtensionBootstrap,
  ExtensionMode,
} from "@/lib/api/extensionApiTypes";
import type { BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";

export const runtimeMessageType = {
  bootstrapRequested: "BOOTSTRAP_REQUESTED",
  bootstrapRefreshRequested: "BOOTSTRAP_REFRESH_REQUESTED",
  assetAccessRequested: "ASSET_ACCESS_REQUESTED",
  assetSessionEnsureRequested: "ASSET_SESSION_ENSURE_REQUESTED",
  assetModeSelected: "ASSET_MODE_SELECTED",
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
  mode?: ExtensionMode;
  platform: AssetPlatform;
  tabId?: number;
  type: (typeof runtimeMessageType)["assetAccessRequested"];
};

export type AssetSessionEnsureRequestedMessage = {
  platform: AssetPlatform;
  type: (typeof runtimeMessageType)["assetSessionEnsureRequested"];
};

export type AssetModeSelectedMessage = {
  mode: ExtensionMode;
  requestId: string;
  type: (typeof runtimeMessageType)["assetModeSelected"];
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
  requestId?: string;
  state: "idle" | "loading" | "chooser" | "success" | "error";
  type: (typeof runtimeMessageType)["overlayStateChanged"];
};

export type AssetSessionEnsureResult = {
  action: "none" | "reload_required";
  fallbackUsed: boolean;
  lastErrorMessage: string | null;
  status: "idle" | "running" | "success" | "failed" | "skipped";
};

export type RuntimeMessage =
  | BootstrapRequestedMessage
  | BootstrapRefreshRequestedMessage
  | AssetAccessRequestedMessage
  | AssetSessionEnsureRequestedMessage
  | AssetModeSelectedMessage
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
export type RedeemCdKeyRuntimeResponse = RuntimeResponse<ExtensionBootstrap>;
export type LogoutRuntimeResponse = RuntimeResponse<{ redirectTo: string }>;
