import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";

const projectRoot = process.cwd();
const releaseDirectory = path.join(projectRoot, "dist", "releases");

const extensionBuilds = [
  {
    artifactSlug: "tvlink-client",
    manifestPath: path.join(projectRoot, "manifest.json"),
    buildDirectory: path.join(projectRoot, "dist", "ext-1"),
  },
  {
    artifactSlug: "tvlink-server",
    manifestPath: path.join(projectRoot, "manifest.ext-2.json"),
    buildDirectory: path.join(projectRoot, "dist", "ext-2"),
  },
];

await rm(releaseDirectory, { recursive: true, force: true });
await mkdir(releaseDirectory, { recursive: true });

const manifests = await Promise.all(
  extensionBuilds.map((extensionBuild) => readManifest(extensionBuild.manifestPath)),
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

for (const extensionBuild of extensionBuilds) {
  await assertBuildDirectoryReady(extensionBuild.buildDirectory);

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

async function readManifest(manifestPath) {
  const manifestContent = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestContent);

  if (typeof manifest.name !== "string" || typeof manifest.version !== "string") {
    throw new Error(`Invalid manifest metadata in ${path.relative(projectRoot, manifestPath)}`);
  }

  return {
    name: manifest.name,
    version: manifest.version,
  };
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
