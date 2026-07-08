import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadExtensionReleaseEnvFiles, readRequiredExtensionVersion } from "./extensionReleaseVersion.mjs";

const projectRoot = process.cwd();
const manifestPaths = [
  path.join(projectRoot, "manifest.json"),
  path.join(projectRoot, "manifest.ext-2.json"),
];

loadExtensionReleaseEnvFiles(projectRoot);

const extensionVersion = readRequiredExtensionVersion();

for (const manifestPath of manifestPaths) {
  await syncManifestVersion(manifestPath, extensionVersion);
}

async function syncManifestVersion(manifestPath, extensionVersion) {
  const manifestSource = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestSource);

  if (manifest.version === extensionVersion) {
    return;
  }

  const updatedManifestSource = manifestSource.replace(
    /^(\s*"version"\s*:\s*)"[^"]+"/m,
    `$1"${extensionVersion}"`,
  );

  if (updatedManifestSource === manifestSource) {
    throw new Error(`Could not update version in ${path.relative(projectRoot, manifestPath)}.`);
  }

  await writeFile(manifestPath, updatedManifestSource);
  console.log(`Synced ${path.relative(projectRoot, manifestPath)} to version ${extensionVersion}`);
}
