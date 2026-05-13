import type { AssetPlatform } from "@/lib/asset-access/platforms";

export const assetProxySchemes = ["http", "https", "socks5"] as const;
export const assetProxyConflictMessage =
  "Proxy lain terdeteksi. Nonaktifkan proxy lain untuk melanjutkan akses asset.";
export type AssetProxyLevelOfControl = chrome.types.ChromeSettingGetResultDetails["levelOfControl"];

export type AssetProxyScheme = (typeof assetProxySchemes)[number];

export type AssetProxyCredentials = {
  password: string;
  username: string;
};

export type AssetProxyConfig = {
  credentials: AssetProxyCredentials | null;
  host: string;
  port: number;
  scheme: AssetProxyScheme;
};

export type AssetProxyPlatformState = {
  proxy: AssetProxyConfig | null;
  updatedAt: string | null;
};

export type AssetProxyConflictExtensionCandidate = {
  iconUrl: string | null;
  id: string;
  installType: chrome.management.ExtensionInfo["installType"] | null;
  mayDisable: boolean;
  name: string;
};

export type AssetProxyConflictState = {
  detectedAt: number | null;
  extensions: AssetProxyConflictExtensionCandidate[];
  isActive: boolean;
  levelOfControl: AssetProxyLevelOfControl | null;
  message: string | null;
};

export type AssetProxyState = {
  conflict: AssetProxyConflictState;
  platforms: Record<AssetPlatform, AssetProxyPlatformState>;
};

export function parseAssetProxy(proxyValue: string | null | undefined): AssetProxyConfig | null {
  const normalizedProxyValue = proxyValue?.trim();

  if (!normalizedProxyValue) {
    return null;
  }

  const firstSeparatorIndex = normalizedProxyValue.indexOf(":");

  if (firstSeparatorIndex <= 0) {
    throw new Error("Format proxy asset tidak valid.");
  }

  const schemeValue = normalizedProxyValue.slice(0, firstSeparatorIndex);
  const proxyParts = normalizedProxyValue
    .slice(firstSeparatorIndex + 1)
    .replace(/^\/\//, "")
    .split(":");

  if (proxyParts.length !== 2 && proxyParts.length !== 4) {
    throw new Error("Format proxy asset tidak valid.");
  }

  const [hostValue, portValue, usernameValue, passwordValue] = proxyParts;
  const scheme = parseAssetProxyScheme(schemeValue);
  const host = hostValue.trim();

  if (!host) {
    throw new Error("Host proxy asset tidak valid.");
  }

  const port = Number.parseInt(portValue, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("Port proxy asset tidak valid.");
  }

  const credentials =
    proxyParts.length === 4 ? parseAssetProxyCredentials(usernameValue, passwordValue) : null;

  return {
    credentials,
    host,
    port,
    scheme,
  };
}

export function hasAssetProxyCredentials(proxyConfig: AssetProxyConfig | null): boolean {
  return Boolean(proxyConfig?.credentials);
}

function parseAssetProxyScheme(schemeValue: string): AssetProxyScheme {
  const normalizedScheme = schemeValue.trim().toLowerCase();

  if (normalizedScheme === "http" || normalizedScheme === "https" || normalizedScheme === "socks5") {
    return normalizedScheme;
  }

  throw new Error("Skema proxy asset tidak didukung.");
}

function parseAssetProxyCredentials(
  usernameValue: string | undefined,
  passwordValue: string | undefined,
): AssetProxyCredentials {
  const username = decodeAssetProxyComponent(usernameValue, "Username proxy asset tidak valid.");
  const password = decodeAssetProxyComponent(passwordValue, "Password proxy asset tidak valid.");

  if (!username || !password) {
    throw new Error("Credential proxy asset tidak lengkap.");
  }

  return {
    password,
    username,
  };
}

function decodeAssetProxyComponent(value: string | undefined, errorMessage: string): string {
  if (typeof value !== "string") {
    throw new Error(errorMessage);
  }

  try {
    return decodeURIComponent(value.trim());
  } catch {
    throw new Error(errorMessage);
  }
}
