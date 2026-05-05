export const defaultExtensionApiBaseUrl = "http://localhost:3000";
// export const isDev = import.meta.env.DEV;
export const isDev = false;

export type ExtensionApiConfig = {
  apiBaseUrl: string;
  extensionId: string | null;
  extensionVersion: string;
  isDev: boolean;
};

export function getExtensionApiBaseUrl(): string {
  const configuredApiBaseUrl = import.meta.env.VITE_EXT_API_BASE_URL?.trim();

  if (!configuredApiBaseUrl) {
    return defaultExtensionApiBaseUrl;
  }

  return configuredApiBaseUrl.replace(/\/$/, "");
}
