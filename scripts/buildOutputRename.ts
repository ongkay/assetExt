import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

type BuildOutputRenameChunk = {
  fileName: string;
};

type BuildOutputRenameBundle = Record<string, BuildOutputRenameChunk>;

const buildOutputHtmlRenameEntries = [
  ["popup.html", "p.html"],
  ["options.html", "o.html"],
  ["ext-1-blocked.html", "w1.html"],
  ["proxy-blocked.html", "pb.html"],
  ["ext-2-blocked.html", "w2.html"],
] as const;

export const buildOutputRenamePluginName = "asset-manager-build-output-rename";

export const buildOutputHtmlRenameMap = Object.fromEntries(buildOutputHtmlRenameEntries) as Record<
  string,
  string
>;

export function createBuildOutputRenamePlugin(): Plugin {
  return {
    apply: "build",
    name: buildOutputRenamePluginName,
    async writeBundle(outputOptions, bundle) {
      const outputDirectory = outputOptions.dir ? resolve(process.cwd(), outputOptions.dir) : null;

      if (!outputDirectory) {
        return;
      }

      await rewriteManifestFile(outputDirectory);
      await rewriteEmittedChunkFiles(outputDirectory, bundle as unknown as BuildOutputRenameBundle);
      await renameEmittedHtmlFiles(outputDirectory, bundle as unknown as BuildOutputRenameBundle);
    },
  };
}

export function renameBuildOutputHtmlFileName(fileName: string): string {
  return buildOutputHtmlRenameMap[fileName] ?? fileName;
}

export function replaceBuildOutputHtmlReferences(source: string): string {
  let renamedSource = source;

  for (const [fileName, renamedFileName] of buildOutputHtmlRenameEntries) {
    renamedSource = renamedSource.replaceAll(fileName, renamedFileName);
  }

  return renamedSource;
}

async function rewriteManifestFile(outputDirectory: string): Promise<void> {
  const manifestPath = resolve(outputDirectory, "manifest.json");
  const manifestSource = await readFile(manifestPath, "utf8");
  const renamedManifestSource = replaceBuildOutputHtmlReferences(manifestSource);

  if (renamedManifestSource === manifestSource) {
    return;
  }

  await writeFile(manifestPath, renamedManifestSource);
}

async function renameEmittedHtmlFiles(
  outputDirectory: string,
  bundle: BuildOutputRenameBundle,
): Promise<void> {
  const emittedFileNames = new Set(Object.values(bundle).map((outputFile) => outputFile.fileName));

  for (const [htmlFileName, renamedHtmlFileName] of buildOutputHtmlRenameEntries) {
    if (!emittedFileNames.has(htmlFileName)) {
      continue;
    }

    await rename(resolve(outputDirectory, htmlFileName), resolve(outputDirectory, renamedHtmlFileName));
  }
}

async function rewriteEmittedChunkFiles(
  outputDirectory: string,
  bundle: BuildOutputRenameBundle,
): Promise<void> {
  const emittedChunkFileNames = Object.values(bundle)
    .map((outputFile) => outputFile.fileName)
    .filter((fileName) => fileName.endsWith(".js"));

  for (const chunkFileName of emittedChunkFileNames) {
    const chunkPath = resolve(outputDirectory, chunkFileName);
    const chunkSource = await readFile(chunkPath, "utf8");
    const renamedChunkSource = replaceBuildOutputHtmlReferences(chunkSource);

    if (renamedChunkSource === chunkSource) {
      continue;
    }

    await writeFile(chunkPath, renamedChunkSource);
  }
}
