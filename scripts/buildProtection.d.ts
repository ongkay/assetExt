import type { BuildOptions, Plugin } from "vite";
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
export declare const buildProtectionPluginName = "asset-manager-build-protection";
export declare const protectedBuildOutputFileNames: {
    readonly assetFileNames: "assets/[hash][extname]";
    readonly chunkFileNames: "assets/[hash].js";
    readonly entryFileNames: "assets/[hash].js";
};
export declare function createProtectedBuildOptions({ input, outDir }: ProtectedBuildOptionsInput): BuildOptions;
export declare function createBuildProtectionPlugin({ protectedEntryModuleIds, }: BuildProtectionPluginOptions): Plugin;
export declare function getBuildProtectionScopeFromFacadeModuleId(facadeModuleId: string | null | undefined, protectedEntryModuleSuffixes: readonly string[]): BuildProtectionScope | null;
export declare function getProtectedEntryModuleIdsFromManifest(manifest: ExtensionManifestLike): string[];
export declare function resolveObfuscatedChunkFileNames(bundle: BuildProtectionBundle, protectedEntryModuleIds: readonly string[]): string[];
export {};
