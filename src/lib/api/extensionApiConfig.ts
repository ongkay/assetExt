export const defaultExtensionApiBaseUrl = "http://localhost:3000";

export type ExtensionApiConfig = {
  apiBaseUrl: string;
  extensionId: string | null;
  extensionVersion: string;
};

export function getExtensionApiBaseUrl(): string {
  const configuredApiBaseUrl = import.meta.env.VITE_EXT_API_BASE_URL?.trim();

  if (!configuredApiBaseUrl) {
    return defaultExtensionApiBaseUrl;
  }

  return configuredApiBaseUrl.replace(/\/$/, "");
}
