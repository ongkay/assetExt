import JavaScriptObfuscator from "javascript-obfuscator";
import type { BuildOptions, Plugin } from "vite";

import { buildOutputHtmlRenameMap } from "./buildOutputRename";

type BuildProtectionScope = "protected" | "unprotected";

type BuildProtectionChunk = {
  dynamicImports: string[];
  facadeModuleId?: string | null;
  fileName: string;
  imports: string[];
  isEntry: boolean;
  modules: Record<string, object>;
};

type BuildProtectionBundle = Record<string, BuildProtectionChunk>;

type BuildProtectionPluginOptions = {
  protectedEntryModuleIds: readonly string[];
};

type ExtensionManifestLike = {
  background?: {
    service_worker?: string;
  };
  content_scripts?: Array<{
    js?: string[];
  }>;
};

type ProtectedBuildOptionsInput = {
  input: Record<string, string>;
  outDir: string;
};

const buildProtectionObfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.15,
  deadCodeInjection: false,
  identifierNamesGenerator: "hexadecimal",
  numbersToExpressions: true,
  renameGlobals: false,
  reservedStrings: Object.keys(buildOutputHtmlRenameMap),
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 1,
} satisfies NonNullable<Parameters<typeof JavaScriptObfuscator.obfuscate>[1]>;

export const buildProtectionPluginName = "asset-manager-build-protection";

export const protectedBuildOutputFileNames = {
  assetFileNames: "assets/[hash][extname]",
  chunkFileNames: "assets/[hash].js",
  entryFileNames: "assets/[hash].js",
} as const;

export function createProtectedBuildOptions({ input, outDir }: ProtectedBuildOptionsInput): BuildOptions {
  return {
    minify: "terser",
    outDir,
    rollupOptions: {
      input,
      output: protectedBuildOutputFileNames,
    },
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      format: {
        comments: false,
      },
      mangle: {
        toplevel: true,
      },
    },
  };
}

export function createBuildProtectionPlugin({
  protectedEntryModuleIds,
}: BuildProtectionPluginOptions): Plugin {
  return {
    apply: "build",
    name: buildProtectionPluginName,
    renderChunk(code, outputChunk, _outputOptions, meta) {
      const protectedBundle = meta.chunks as unknown as BuildProtectionBundle;
      const obfuscatedChunkFileNames = new Set(
        resolveObfuscatedChunkFileNames(protectedBundle, protectedEntryModuleIds),
      );

      if (!obfuscatedChunkFileNames.has(outputChunk.fileName)) {
        return null;
      }

      return {
        code: JavaScriptObfuscator.obfuscate(code, buildProtectionObfuscatorOptions).getObfuscatedCode(),
        map: null,
      };
    },
  };
}

export function getBuildProtectionScopeFromFacadeModuleId(
  facadeModuleId: string | null | undefined,
  protectedEntryModuleSuffixes: readonly string[],
): BuildProtectionScope | null {
  if (!facadeModuleId) {
    return null;
  }

  const normalizedFacadeModuleId = normalizeModuleId(facadeModuleId);

  if (protectedEntryModuleSuffixes.some((moduleSuffix) => normalizedFacadeModuleId.endsWith(moduleSuffix))) {
    return "protected";
  }

  return null;
}

export function getProtectedEntryModuleIdsFromManifest(manifest: ExtensionManifestLike): string[] {
  const protectedEntryModuleIds = [manifest.background?.service_worker]
    .concat(...(manifest.content_scripts?.map((contentScript) => contentScript.js ?? []) ?? []))
    .filter((moduleId): moduleId is string => Boolean(moduleId));

  return [...new Set(protectedEntryModuleIds)];
}

export function resolveObfuscatedChunkFileNames(
  bundle: BuildProtectionBundle,
  protectedEntryModuleIds: readonly string[],
): string[] {
  const protectedEntryModuleSuffixes = normalizeProtectedEntryModuleSuffixes(protectedEntryModuleIds);
  const outputChunks = getOutputChunks(bundle);
  const outputChunkMap = new Map(outputChunks.map((outputChunk) => [outputChunk.fileName, outputChunk]));
  const chunkUsageMap = collectChunkUsageMap(outputChunks, outputChunkMap, protectedEntryModuleSuffixes);

  return outputChunks
    .filter((outputChunk) => shouldObfuscateChunk(outputChunk, chunkUsageMap))
    .map((outputChunk) => outputChunk.fileName)
    .sort();
}

function collectChunkUsageMap(
  outputChunks: readonly BuildProtectionChunk[],
  outputChunkMap: ReadonlyMap<string, BuildProtectionChunk>,
  protectedEntryModuleSuffixes: readonly string[],
): Map<string, Set<BuildProtectionScope>> {
  const chunkUsageMap = new Map<string, Set<BuildProtectionScope>>();

  for (const outputChunk of outputChunks) {
    const entryScope = getOutputChunkEntryScope(outputChunk, protectedEntryModuleSuffixes);

    if (!entryScope) {
      continue;
    }

    markChunkUsage(entryScope, outputChunk.fileName, outputChunkMap, chunkUsageMap);
  }

  return chunkUsageMap;
}

function getOutputChunkEntryScope(
  outputChunk: BuildProtectionChunk,
  protectedEntryModuleSuffixes: readonly string[],
): BuildProtectionScope | null {
  if (!outputChunk.isEntry) {
    return null;
  }

  return (
    getBuildProtectionScopeFromFacadeModuleId(outputChunk.facadeModuleId, protectedEntryModuleSuffixes) ??
    "unprotected"
  );
}

function markChunkUsage(
  scope: BuildProtectionScope,
  entryFileName: string,
  outputChunkMap: ReadonlyMap<string, BuildProtectionChunk>,
  chunkUsageMap: Map<string, Set<BuildProtectionScope>>,
): void {
  const pendingFileNames = [entryFileName];
  const visitedFileNames = new Set<string>();

  while (pendingFileNames.length > 0) {
    const currentFileName = pendingFileNames.pop();

    if (!currentFileName || visitedFileNames.has(currentFileName)) {
      continue;
    }

    visitedFileNames.add(currentFileName);

    const outputChunk = outputChunkMap.get(currentFileName);

    if (!outputChunk) {
      continue;
    }

    addChunkUsage(scope, outputChunk.fileName, chunkUsageMap);

    for (const importedFileName of [...outputChunk.imports, ...outputChunk.dynamicImports]) {
      if (outputChunkMap.has(importedFileName)) {
        pendingFileNames.push(importedFileName);
      }
    }
  }
}

function addChunkUsage(
  scope: BuildProtectionScope,
  chunkFileName: string,
  chunkUsageMap: Map<string, Set<BuildProtectionScope>>,
): void {
  const existingChunkScopes = chunkUsageMap.get(chunkFileName);

  if (existingChunkScopes) {
    existingChunkScopes.add(scope);
    return;
  }

  chunkUsageMap.set(chunkFileName, new Set([scope]));
}

function shouldObfuscateChunk(
  outputChunk: BuildProtectionChunk,
  chunkUsageMap: ReadonlyMap<string, Set<BuildProtectionScope>>,
): boolean {
  const chunkScopes = chunkUsageMap.get(outputChunk.fileName);

  if (!chunkScopes?.has("protected") || chunkScopes.has("unprotected")) {
    return false;
  }

  if (!hasProjectSourceModule(outputChunk)) {
    return false;
  }

  return true;
}

function hasProjectSourceModule(outputChunk: BuildProtectionChunk): boolean {
  const moduleIds = Object.keys(outputChunk.modules);

  if (moduleIds.length === 0) {
    return false;
  }

  return moduleIds.some((moduleId) => normalizeModuleId(moduleId).includes("/src/"));
}

function getOutputChunks(bundle: BuildProtectionBundle): BuildProtectionChunk[] {
  return Object.values(bundle);
}

function normalizeModuleId(moduleId: string): string {
  return moduleId.replace(/\\/g, "/");
}

function normalizeProtectedEntryModuleSuffixes(protectedEntryModuleIds: readonly string[]): string[] {
  return protectedEntryModuleIds.map((moduleId) => {
    const normalizedModuleId = normalizeModuleId(moduleId);

    return normalizedModuleId.startsWith("/") ? normalizedModuleId : `/${normalizedModuleId}`;
  });
}
