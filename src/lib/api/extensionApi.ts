import type { AssetPlatform } from "@/lib/asset-access/platforms";
import type { ExtensionApiConfig } from "@/lib/api/extensionApiConfig";
import type {
  ExtensionApiError,
  ExtensionApiErrorCode,
  ExtensionApiResult,
  ExtensionAssetResponse,
  ExtensionBootstrap,
  ExtensionHeartbeatResponse,
  ExtensionLogoutResponse,
  ExtensionMode,
  ExtensionRedeemSuccess,
} from "@/lib/api/extensionApiTypes";

const fallbackExtensionApiError: ExtensionApiError = {
  code: "EXT_REQUEST_INVALID",
  message: "Request extension gagal diproses.",
};

export function fetchExtensionBootstrap(
  config: ExtensionApiConfig,
): Promise<ExtensionApiResult<ExtensionBootstrap>> {
  return requestExtensionApi(
    config,
    `/api/ext/bootstrap?version=${encodeURIComponent(config.extensionVersion)}`,
    {
      method: "GET",
    },
  );
}

export function fetchExtensionAsset(
  config: ExtensionApiConfig,
  platform: AssetPlatform,
  mode?: ExtensionMode,
): Promise<ExtensionApiResult<ExtensionAssetResponse>> {
  const searchParams = new URLSearchParams({ platform });

  if (mode) {
    searchParams.set("mode", mode);
  }

  return requestExtensionApi(config, `/api/ext/asset?${searchParams.toString()}`, {
    method: "GET",
  });
}

export function postExtensionHeartbeat(
  config: ExtensionApiConfig,
  deviceId: string,
): Promise<ExtensionApiResult<ExtensionHeartbeatResponse>> {
  return requestExtensionApi(config, "/api/ext/heartbeat", {
    body: JSON.stringify({ deviceId, extensionVersion: config.extensionVersion }),
    method: "POST",
  });
}

export function redeemExtensionCdKey(
  config: ExtensionApiConfig,
  code: string,
): Promise<ExtensionApiResult<ExtensionRedeemSuccess>> {
  return requestExtensionApi(config, "/api/ext/redeem", {
    body: JSON.stringify({ code }),
    method: "POST",
  });
}

export function postExtensionLogout(
  config: ExtensionApiConfig,
): Promise<ExtensionApiResult<ExtensionLogoutResponse>> {
  return requestExtensionApi(config, "/api/ext/logout", { method: "POST" });
}

async function requestExtensionApi<TValue>(
  config: ExtensionApiConfig,
  path: string,
  init: Pick<RequestInit, "body" | "method">,
): Promise<ExtensionApiResult<TValue>> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: await getExtensionApiHeaders(config),
  });
  const responsePayload = await parseResponseJson(response);

  if (!response.ok) {
    return {
      ok: false,
      error: getExtensionApiError(responsePayload),
      status: response.status,
    };
  }

  return {
    ok: true,
    status: response.status,
    value: responsePayload as TValue,
  };
}

async function getExtensionApiHeaders(config: ExtensionApiConfig): Promise<HeadersInit> {
  const headers = new Headers({
    "content-type": "application/json",
    "x-extension-version": config.extensionVersion,
  });

  if (config.isDev) {
    if (config.extensionId) {
      headers.set("x-ext-dev-extension-id", config.extensionId);
      headers.set("x-ext-dev-origin", `chrome-extension://${config.extensionId}`);
    }

    const appSessionToken = await readLocalDevelopmentAppSession(config.apiBaseUrl);

    if (appSessionToken) {
      headers.set("x-ext-dev-app-session", appSessionToken);
    }

    return headers;
  }

  if (config.extensionId) {
    headers.set("x-extension-id", config.extensionId);
    headers.set("origin", `chrome-extension://${config.extensionId}`);
  }

  return headers;
}

async function readLocalDevelopmentAppSession(apiBaseUrl: string): Promise<string | null> {
  if (typeof chrome === "undefined" || !chrome.cookies?.get) {
    return null;
  }

  try {
    const appSessionCookie = await chrome.cookies.get({
      name: "app_session",
      url: apiBaseUrl,
    });

    return appSessionCookie?.value ?? null;
  } catch {
    return null;
  }
}

async function parseResponseJson(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return null;
  }
}

function getExtensionApiError(responsePayload: unknown): ExtensionApiError {
  if (!isExtensionApiErrorPayload(responsePayload)) {
    return fallbackExtensionApiError;
  }

  return responsePayload.error;
}

function isExtensionApiErrorPayload(
  responsePayload: unknown,
): responsePayload is { error: ExtensionApiError } {
  if (!isRecord(responsePayload) || !isRecord(responsePayload.error)) {
    return false;
  }

  return (
    isExtensionApiErrorCode(responsePayload.error.code) && typeof responsePayload.error.message === "string"
  );
}

function isExtensionApiErrorCode(errorCode: unknown): errorCode is ExtensionApiErrorCode {
  return (
    errorCode === "EXT_HEADER_REQUIRED" ||
    errorCode === "EXT_REQUEST_INVALID" ||
    errorCode === "EXT_REDEEM_INVALID" ||
    errorCode === "EXT_UNAUTHENTICATED" ||
    errorCode === "EXT_ORIGIN_DENIED" ||
    errorCode === "EXT_USER_BANNED" ||
    errorCode === "EXT_UPDATE_REQUIRED" ||
    errorCode === "EXT_MODE_NOT_ALLOWED" ||
    errorCode === "EXT_REDEEM_USED" ||
    errorCode === "EXT_ASSET_UNAVAILABLE"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
