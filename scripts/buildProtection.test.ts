// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  getBuildProtectionScopeFromFacadeModuleId,
  getProtectedEntryModuleIdsFromManifest,
  resolveObfuscatedChunkFileNames,
} from "./buildProtection";

describe("build protection", () => {
  it("derives protected entry modules from manifest fields", () => {
    expect(
      getProtectedEntryModuleIdsFromManifest({
        background: {
          service_worker: "src/background/index.ts",
        },
        content_scripts: [
          {
            js: ["src/content/index.tsx"],
          },
          {
            js: ["src/content/index.tsx", "src/extra/index.ts"],
          },
        ],
      }),
    ).toEqual(["src/background/index.ts", "src/content/index.tsx", "src/extra/index.ts"]);
  });

  it("normalizes Windows paths when matching protected entries", () => {
    expect(
      getBuildProtectionScopeFromFacadeModuleId("C:\\workspace\\src\\content\\index.tsx", [
        "src/background/index.ts",
        "src/content/index.tsx",
      ]),
    ).toBe("protected");
  });

  it("obfuscates only protected-only source chunks", () => {
    const protectedEntryModuleIds = ["src/background/index.ts", "src/content/index.tsx"];
    const bundle = {
      "assets/background.js": createOutputChunk({
        facadeModuleId: "/workspace/src/background/index.ts",
        fileName: "assets/background.js",
        imports: [
          "assets/protected-shared.js",
          "assets/mixed-shared.js",
          "assets/vendor.js",
          "assets/runtime.js",
        ],
        isEntry: true,
        modules: {
          "/workspace/src/background/index.ts": {},
        },
      }),
      "assets/content.js": createOutputChunk({
        facadeModuleId: "/workspace/src/content/index.tsx",
        fileName: "assets/content.js",
        imports: ["assets/protected-shared.js", "assets/mixed-shared.js"],
        isEntry: true,
        modules: {
          "/workspace/src/content/index.tsx": {},
        },
      }),
      "assets/popup.js": createOutputChunk({
        facadeModuleId: "/workspace/src/popup/index.tsx",
        fileName: "assets/popup.js",
        imports: ["assets/popup-shared.js", "assets/mixed-shared.js"],
        isEntry: true,
        modules: {
          "/workspace/src/popup/index.tsx": {},
        },
      }),
      "assets/protected-shared.js": createOutputChunk({
        fileName: "assets/protected-shared.js",
        modules: {
          "/workspace/src/lib/runtime/messages.ts": {},
        },
      }),
      "assets/mixed-shared.js": createOutputChunk({
        fileName: "assets/mixed-shared.js",
        modules: {
          "/workspace/src/lib/shared/panelState.ts": {},
        },
      }),
      "assets/popup-shared.js": createOutputChunk({
        fileName: "assets/popup-shared.js",
        modules: {
          "/workspace/src/popup/PopupApp.tsx": {},
        },
      }),
      "assets/runtime.js": createOutputChunk({
        fileName: "assets/runtime.js",
        modules: {
          "\u0000vite/preload-helper": {},
        },
      }),
      "assets/vendor.js": createOutputChunk({
        fileName: "assets/vendor.js",
        modules: {
          "/workspace/node_modules/react/index.js": {},
        },
      }),
    };

    expect(resolveObfuscatedChunkFileNames(bundle, protectedEntryModuleIds)).toEqual([
      "assets/background.js",
      "assets/content.js",
      "assets/protected-shared.js",
    ]);
  });
});

type OutputChunkInput = {
  facadeModuleId?: string | null;
  fileName: string;
  imports?: string[];
  isEntry?: boolean;
  modules: Record<string, object>;
};

function createOutputChunk({
  facadeModuleId = null,
  fileName,
  imports = [],
  isEntry = false,
  modules,
}: OutputChunkInput) {
  return {
    dynamicImports: [],
    facadeModuleId,
    fileName,
    imports,
    isEntry,
    modules,
  };
}
