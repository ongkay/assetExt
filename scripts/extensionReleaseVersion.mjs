import { readFileSync } from "node:fs";
import path from "node:path";

export const extensionVersionEnvKey = "TVLINK_EXTENSION_VERSION";

const chromeExtensionVersionPattern = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}$/;

export function loadExtensionReleaseEnvFiles(extensionProjectRoot) {
  const workspaceRoot = path.resolve(extensionProjectRoot, "..");

  loadEnvFile(path.join(workspaceRoot, ".env"));
  loadEnvFile(path.join(workspaceRoot, ".env.local"));
  loadEnvFile(path.join(extensionProjectRoot, ".env"));
  loadEnvFile(path.join(extensionProjectRoot, ".env.local"));
}

export function readRequiredExtensionVersion() {
  const version = process.env[extensionVersionEnvKey]?.trim();

  if (!version) {
    throw new Error(`Missing required env ${extensionVersionEnvKey}.`);
  }

  assertChromeExtensionVersion(version);

  return version;
}

function assertChromeExtensionVersion(version) {
  if (!chromeExtensionVersionPattern.test(version)) {
    throw new Error(
      `${extensionVersionEnvKey} must be a Chrome extension version like 2.0.7. Received: ${version}`,
    );
  }

  const invalidSegment = version
    .split(".")
    .map(Number)
    .find((versionSegment) => versionSegment > 65535);

  if (invalidSegment !== undefined) {
    throw new Error(`${extensionVersionEnvKey} segments must be between 0 and 65535. Received: ${version}`);
  }
}

function loadEnvFile(filePath) {
  const envFile = tryReadEnvFile(filePath);

  if (!envFile) {
    return;
  }

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();

    if (!key || process.env[key]) {
      continue;
    }

    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function tryReadEnvFile(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}
