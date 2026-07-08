export const extensionVersionEnvKey = "TVLINK_EXTENSION_VERSION";

const chromeExtensionVersionPattern = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}$/;

export function resolveExtensionManifestVersion(
  envVersion: string | undefined,
  fallbackVersion: string,
): string {
  const trimmedEnvVersion = envVersion?.trim();
  const version = trimmedEnvVersion || fallbackVersion.trim();

  assertChromeExtensionVersion(version);

  return version;
}

function assertChromeExtensionVersion(version: string): void {
  if (!chromeExtensionVersionPattern.test(version)) {
    throw new Error(
      `${extensionVersionEnvKey} must be a Chrome extension version like 2.0.7. Received: ${version}`,
    );
  }

  const versionSegments = version.split(".").map(Number);
  const invalidSegment = versionSegments.find((versionSegment) => versionSegment > 65535);

  if (invalidSegment !== undefined) {
    throw new Error(`${extensionVersionEnvKey} segments must be between 0 and 65535. Received: ${version}`);
  }
}
