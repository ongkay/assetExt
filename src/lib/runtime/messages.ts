import type { AssetPlatform } from "@/lib/asset-access/platforms";
import type { ExtensionAssetResponse, ExtensionBootstrap } from "@/lib/api/extensionApiTypes";
import type { PeerGuardState } from "@/lib/peer-guard/peerGuardState";
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
  tvOwnedLayoutRememberRequested: "TV_OWNED_LAYOUT_REMEMBER_REQUESTED",
  tvOwnedLayoutPendingOperationSubmitted: "TV_OWNED_LAYOUT_PENDING_OPERATION_SUBMITTED",
  tvOwnedLayoutRenameRequested: "TV_OWNED_LAYOUT_RENAME_REQUESTED",
  tvOwnedLayoutDeleteCompleted: "TV_OWNED_LAYOUT_DELETE_COMPLETED",
  tvOwnedLayoutPageConfirmed: "TV_OWNED_LAYOUT_PAGE_CONFIRMED",
  tvOwnedLayoutPageInvalid: "TV_OWNED_LAYOUT_PAGE_INVALID",
  tvOwnedLayoutOpenTabRequested: "TV_OWNED_LAYOUT_OPEN_TAB_REQUESTED",
  tvOwnedLayoutRouteStatusRequested: "TV_OWNED_LAYOUT_ROUTE_STATUS_REQUESTED",
  tvOwnedLayoutOperationStatusRequested: "TV_OWNED_LAYOUT_OPERATION_STATUS_REQUESTED",
  tvOwnedLayoutPendingOperationCleared: "TV_OWNED_LAYOUT_PENDING_OPERATION_CLEARED",
  peerGuardStatusRequested: "PEER_GUARD_STATUS_REQUESTED",
  peerGuardRefreshRequested: "PEER_GUARD_REFRESH_REQUESTED",
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

export type TvOwnedLayoutRememberRequestedMessage = {
  chartId: string;
  publicId: string;
  shouldMarkAsOpened: boolean;
  title: string;
  type: (typeof runtimeMessageType)["tvOwnedLayoutRememberRequested"];
  updatedAt: number;
  url: string;
};

export type TvOwnedLayoutPendingOperationSubmittedMessage = {
  expectedTitle: string;
  kind: "copy" | "create";
  openInNewTab?: boolean;
  publicId: string;
  sourceChartId: string | null;
  type: (typeof runtimeMessageType)["tvOwnedLayoutPendingOperationSubmitted"];
};

export type TvOwnedLayoutRenameRequestedMessage = {
  chartId: string;
  publicId: string;
  title: string;
  type: (typeof runtimeMessageType)["tvOwnedLayoutRenameRequested"];
};

export type TvOwnedLayoutDeleteCompletedMessage = {
  chartId: string;
  publicId: string;
  type: (typeof runtimeMessageType)["tvOwnedLayoutDeleteCompleted"];
};

export type TvOwnedLayoutPageConfirmedMessage = {
  chartId: string;
  publicId: string;
  type: (typeof runtimeMessageType)["tvOwnedLayoutPageConfirmed"];
  url: string;
};

export type TvOwnedLayoutPageInvalidMessage = {
  chartId: string;
  publicId: string;
  type: (typeof runtimeMessageType)["tvOwnedLayoutPageInvalid"];
};

export type TvOwnedLayoutOpenTabRequestedMessage = {
  operationId: string;
  publicId: string;
  type: (typeof runtimeMessageType)["tvOwnedLayoutOpenTabRequested"];
  url: string;
};

export type TvOwnedLayoutRouteStatusRequestedMessage = {
  type: (typeof runtimeMessageType)["tvOwnedLayoutRouteStatusRequested"];
  url: string;
};

export type TvOwnedLayoutOperationStatusRequestedMessage = {
  operationId: string;
  publicId: string;
  type: (typeof runtimeMessageType)["tvOwnedLayoutOperationStatusRequested"];
};

export type TvOwnedLayoutPendingOperationClearedMessage = {
  operationId?: string;
  type: (typeof runtimeMessageType)["tvOwnedLayoutPendingOperationCleared"];
};

export type PeerGuardStatusRequestedMessage = {
  type: (typeof runtimeMessageType)["peerGuardStatusRequested"];
};

export type PeerGuardRefreshRequestedMessage = {
  type: (typeof runtimeMessageType)["peerGuardRefreshRequested"];
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
  action: "none" | "peer_required" | "proxy_blocked" | "reload_required" | "redirect_login";
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
  | TvOwnedLayoutRememberRequestedMessage
  | TvOwnedLayoutPendingOperationSubmittedMessage
  | TvOwnedLayoutRenameRequestedMessage
  | TvOwnedLayoutDeleteCompletedMessage
  | TvOwnedLayoutPageConfirmedMessage
  | TvOwnedLayoutPageInvalidMessage
  | TvOwnedLayoutOpenTabRequestedMessage
  | TvOwnedLayoutRouteStatusRequestedMessage
  | TvOwnedLayoutOperationStatusRequestedMessage
  | TvOwnedLayoutPendingOperationClearedMessage
  | PeerGuardStatusRequestedMessage
  | PeerGuardRefreshRequestedMessage
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
  peerGuardState: PeerGuardState;
};

export type BootstrapRuntimeResponse = RuntimeResponse<BootstrapRuntimeValue>;
export type BootstrapRefreshRuntimeResponse = RuntimeResponse<BootstrapCacheRecord>;
export type AssetAccessRuntimeResponse = RuntimeResponse<ExtensionAssetResponse>;
export type AssetSessionEnsureRuntimeResponse = RuntimeResponse<AssetSessionEnsureResult>;
export type ProxyConflictRefreshRuntimeResponse = RuntimeResponse<AssetProxyState>;
export type RedeemCdKeyRuntimeResponse = RuntimeResponse<ExtensionBootstrap>;
export type LogoutRuntimeResponse = RuntimeResponse<{ redirectTo: string }>;
export type PeerGuardRuntimeValue = PeerGuardState;
export type PeerGuardRuntimeResponse = RuntimeResponse<PeerGuardRuntimeValue>;
