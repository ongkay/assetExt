import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { createClient } from "@insforge/sdk";

const extensionProjectRoot = process.cwd();
const workspaceRoot = path.resolve(extensionProjectRoot, "..");
const releaseDirectory = path.join(extensionProjectRoot, "dist", "releases");
const extensionKey = "asset-extension-v2";
const defaultBucketName = "extension-downloads";
const artifactDefinitions = [
  {
    artifactSlug: "tvlink",
    label: "TvLink Bundle",
    manifestPath: path.join(extensionProjectRoot, "manifest.json"),
  },
  {
    artifactSlug: "tvlink-client",
    label: "TvLink Client",
    manifestPath: path.join(extensionProjectRoot, "manifest.json"),
  },
  {
    artifactSlug: "tvlink-server",
    label: "TvLink Server",
    manifestPath: path.join(extensionProjectRoot, "manifest.ext-2.json"),
  },
];

loadEnvFile(path.join(workspaceRoot, ".env"));
loadEnvFile(path.join(workspaceRoot, ".env.local"));
loadEnvFile(path.join(extensionProjectRoot, ".env"));
loadEnvFile(path.join(extensionProjectRoot, ".env.local"));

const releaseMinimumVersion = readRequiredEnv("TVLINK_RELEASE_MINIMUM_VERSION");
const releaseBucketName = process.env.TVLINK_RELEASE_STORAGE_BUCKET?.trim() || defaultBucketName;
const insforgeBaseUrl = normalizeUrl(readRequiredEnv("NEXT_PUBLIC_INSFORGE_URL"));
const insforgeServiceKey = readRequiredEnv("INSFORGE_SERVICE_KEY");
const insforgeClient = createClient({
  baseUrl: insforgeBaseUrl,
  headers: {
    Authorization: `Bearer ${insforgeServiceKey}`,
  },
  isServerMode: true,
});

const currentExtensionConfig = await readCurrentExtensionConfig();

const manifests = await Promise.all(
  artifactDefinitions.map((artifact) => readManifest(artifact.manifestPath)),
);
const releaseVersion = manifests[0]?.version;

if (!releaseVersion) {
  throw new Error("Could not resolve the extension release version.");
}

for (const manifest of manifests) {
  if (manifest.version !== releaseVersion) {
    throw new Error(
      `All extension manifests must share the same version. Found ${releaseVersion} and ${manifest.version}.`,
    );
  }
}

console.log(`Building TvLink extension release ${releaseVersion}...`);
await runCommand("pnpm", ["build:zip"], { cwd: extensionProjectRoot });

const uploadedArtifacts = [];
const currentVersionObjectKeys = currentExtensionConfig?.latestVersion
  ? artifactDefinitions.map((artifactDefinition) =>
      buildObjectKey({
        artifactSlug: artifactDefinition.artifactSlug,
        version: currentExtensionConfig.latestVersion,
      }),
    )
  : [];

if (currentExtensionConfig?.latestVersion === releaseVersion) {
  for (const objectKey of currentVersionObjectKeys) {
    await deleteStorageObjectIfPresent({ bucketName: releaseBucketName, objectKey });
  }
}

for (const artifactDefinition of artifactDefinitions) {
  const archiveFileName = buildArchiveFileName({
    artifactSlug: artifactDefinition.artifactSlug,
    version: releaseVersion,
  });
  const archivePath = path.join(releaseDirectory, archiveFileName);
  const archiveBuffer = await readFile(archivePath);
  const objectKey = buildObjectKey({
    artifactSlug: artifactDefinition.artifactSlug,
    version: releaseVersion,
  });
  const archiveFile = new File([archiveBuffer], archiveFileName, { type: "application/zip" });

  const uploadResult = await insforgeClient.storage.from(releaseBucketName).upload(objectKey, archiveFile);

  if (uploadResult.error || !uploadResult.data) {
    throw new Error(uploadResult.error?.message || `Failed to upload ${archiveFileName}.`);
  }

  uploadedArtifacts.push({
    archiveFileName,
    label: artifactDefinition.label,
    objectKey: uploadResult.data.key,
    url: buildStorageObjectUrl({
      baseUrl: insforgeBaseUrl,
      bucketName: releaseBucketName,
      objectKey: uploadResult.data.key,
    }),
  });
}

const bundleArtifact = uploadedArtifacts.find(
  (artifact) =>
    artifact.archiveFileName === buildArchiveFileName({ artifactSlug: "tvlink", version: releaseVersion }),
);

if (!bundleArtifact) {
  throw new Error("Bundle release artifact could not be resolved after upload.");
}

await upsertExtensionConfig({
  downloadUrl: bundleArtifact.url,
  latestVersion: releaseVersion,
  minimumVersion: releaseMinimumVersion,
});

if (currentExtensionConfig?.latestVersion && currentExtensionConfig.latestVersion !== releaseVersion) {
  for (const objectKey of currentVersionObjectKeys) {
    await deleteStorageObjectIfPresent({ bucketName: releaseBucketName, objectKey });
  }
}

console.log(`Release ${releaseVersion} completed.`);
console.log(`Minimum version: ${releaseMinimumVersion}`);
console.log(`Bundle download URL: ${bundleArtifact.url}`);

for (const artifact of uploadedArtifacts) {
  console.log(`Uploaded ${artifact.label}`);
  console.log(`  file: ${artifact.archiveFileName}`);
  console.log(`  key: ${artifact.objectKey}`);
  console.log(`  url: ${artifact.url}`);
}

async function readCurrentExtensionConfig() {
  const { data, error } = await insforgeClient.database
    .from("extension_app_configs")
    .select("latest_version")
    .eq("extension_key", extensionKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read current extension_app_configs row: ${error.message}`);
  }

  if (!data || typeof data.latest_version !== "string" || data.latest_version.trim().length === 0) {
    return null;
  }

  return {
    latestVersion: data.latest_version.trim(),
  };
}

async function deleteStorageObjectIfPresent(input) {
  const { error } = await insforgeClient.storage.from(input.bucketName).remove(input.objectKey);

  if (!error) {
    return;
  }

  const errorMessage = error.message.toLowerCase();

  if (
    errorMessage.includes("not found") ||
    errorMessage.includes("no rows") ||
    errorMessage.includes("does not exist") ||
    errorMessage.includes("404")
  ) {
    return;
  }

  throw new Error(`Failed to prepare storage object ${input.objectKey}: ${error.message}`);
}

async function upsertExtensionConfig(input) {
  const updateResult = await insforgeClient.database
    .from("extension_app_configs")
    .update({
      download_url: input.downloadUrl,
      is_active: true,
      latest_version: input.latestVersion,
      minimum_version: input.minimumVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("extension_key", extensionKey)
    .select("id")
    .maybeSingle();

  if (updateResult.error) {
    throw new Error(`Failed to update extension_app_configs: ${updateResult.error.message}`);
  }

  if (updateResult.data) {
    return;
  }

  const insertResult = await insforgeClient.database.from("extension_app_configs").insert([
    {
      download_url: input.downloadUrl,
      extension_key: extensionKey,
      is_active: true,
      latest_version: input.latestVersion,
      minimum_version: input.minimumVersion,
    },
  ]);

  if (insertResult.error) {
    throw new Error(`Failed to create extension_app_configs row: ${insertResult.error.message}`);
  }
}

function buildArchiveFileName(input) {
  return `${input.artifactSlug}-v${input.version}.zip`;
}

function buildObjectKey(input) {
  return `extensions/${extensionKey}/${input.version}/${buildArchiveFileName(input)}`;
}

function buildStorageObjectUrl(input) {
  return `${input.baseUrl}/api/storage/buckets/${input.bucketName}/objects/${encodeURIComponent(input.objectKey)}`;
}

function normalizeUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function readRequiredEnv(key) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required env ${key}.`);
  }

  return value;
}

async function readManifest(manifestPath) {
  const manifestContent = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestContent);

  if (typeof manifest.version !== "string" || manifest.version.trim().length === 0) {
    throw new Error(`Invalid manifest version in ${path.relative(extensionProjectRoot, manifestPath)}.`);
  }

  return {
    version: manifest.version.trim(),
  };
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
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function tryReadEnvFile(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

async function runCommand(command, args, options) {
  await new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: "inherit",
    });

    childProcess.on("error", reject);
    childProcess.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? "unknown"}.`));
    });
  });
}
