import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";
import { loadExtensionReleaseEnvFiles, readRequiredExtensionVersion } from "./extensionReleaseVersion.mjs";

const projectRoot = process.cwd();
const releaseDirectory = path.join(projectRoot, "dist", "releases");
loadExtensionReleaseEnvFiles(projectRoot);

const releaseVersion = readRequiredExtensionVersion();

const extensionBuilds = [
  {
    artifactSlug: "tvlink-client",
    buildDirectory: path.join(projectRoot, "dist", "ext-1"),
  },
  {
    artifactSlug: "tvlink-server",
    buildDirectory: path.join(projectRoot, "dist", "ext-2"),
  },
];

await rm(releaseDirectory, { recursive: true, force: true });
await mkdir(releaseDirectory, { recursive: true });

for (const extensionBuild of extensionBuilds) {
  await assertBuildDirectoryReady(extensionBuild.buildDirectory);
  await assertBuiltManifestVersion(extensionBuild.buildDirectory, releaseVersion);

  const archiveFileName = `${extensionBuild.artifactSlug}-v${releaseVersion}.zip`;
  const archivePath = path.join(releaseDirectory, archiveFileName);

  await createArchive({
    sourceDirectory: extensionBuild.buildDirectory,
    archivePath,
  });

  console.log(`Created ${path.relative(projectRoot, archivePath)}`);
}
const bundleArchivePath = path.join(releaseDirectory, `tvlink-v${releaseVersion}.zip`);

await createBundleArchive({
  archivePath: bundleArchivePath,
  releaseVersion,
  sourceDirectories: extensionBuilds.map((extensionBuild) => ({
    buildDirectory: extensionBuild.buildDirectory,
    bundleDirectoryName: `${extensionBuild.artifactSlug}-v${releaseVersion}`,
  })),
});

console.log(`Created ${path.relative(projectRoot, bundleArchivePath)}`);

async function assertBuiltManifestVersion(buildDirectory, releaseVersion) {
  const manifestPath = path.join(buildDirectory, "manifest.json");
  const manifestContent = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestContent);

  if (manifest.version !== releaseVersion) {
    throw new Error(
      `Built manifest version mismatch in ${path.relative(projectRoot, manifestPath)}. Expected ${releaseVersion}, found ${manifest.version}.`,
    );
  }
}

async function assertBuildDirectoryReady(buildDirectory) {
  const buildStats = await stat(buildDirectory).catch(() => null);

  if (!buildStats?.isDirectory()) {
    throw new Error(`Build output directory not found: ${path.relative(projectRoot, buildDirectory)}`);
  }

  const builtManifestPath = path.join(buildDirectory, "manifest.json");
  const builtManifestStats = await stat(builtManifestPath).catch(() => null);

  if (!builtManifestStats?.isFile()) {
    throw new Error(`Built manifest not found: ${path.relative(projectRoot, builtManifestPath)}`);
  }
}
function createArchive({ sourceDirectory, archivePath }) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(archivePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDirectory, false);
    archive.finalize();
  });
}

function createBundleArchive({ archivePath, sourceDirectories }) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(archivePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);

    for (const sourceDirectory of sourceDirectories) {
      archive.directory(sourceDirectory.buildDirectory, sourceDirectory.bundleDirectoryName);
    }

    archive.finalize();
  });
}
