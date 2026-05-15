import type { Plugin } from "vite";
export declare const buildOutputRenamePluginName = "asset-manager-build-output-rename";
export declare const buildOutputHtmlRenameMap: Record<string, string>;
export declare function createBuildOutputRenamePlugin(): Plugin;
export declare function renameBuildOutputHtmlFileName(fileName: string): string;
export declare function replaceBuildOutputHtmlReferences(source: string): string;
