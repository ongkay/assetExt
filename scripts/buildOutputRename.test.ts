// @vitest-environment node

import { describe, expect, it } from "vitest";

import { renameBuildOutputHtmlFileName, replaceBuildOutputHtmlReferences } from "./buildOutputRename";

describe("build output rename", () => {
  it("renames only supported html outputs", () => {
    expect(renameBuildOutputHtmlFileName("popup.html")).toBe("p.html");
    expect(renameBuildOutputHtmlFileName("options.html")).toBe("o.html");
    expect(renameBuildOutputHtmlFileName("ext-1-blocked.html")).toBe("w1.html");
    expect(renameBuildOutputHtmlFileName("proxy-blocked.html")).toBe("pb.html");
    expect(renameBuildOutputHtmlFileName("ext-2-blocked.html")).toBe("w2.html");
    expect(renameBuildOutputHtmlFileName("manifest.json")).toBe("manifest.json");
  });

  it("rewrites manifest and runtime html references", () => {
    const source = JSON.stringify({
      action: {
        default_popup: "popup.html",
      },
      options_ui: {
        page: "options.html",
      },
      web_accessible_resources: [
        {
          resources: ["proxy-blocked.html", "ext-1-blocked.html"],
        },
      ],
      runtime: {
        ext1: "chrome-extension://runtime-id/ext-1-blocked.html",
        ext2: "chrome-extension://runtime-id/ext-2-blocked.html",
        proxy: "chrome-extension://runtime-id/proxy-blocked.html",
      },
    });

    expect(replaceBuildOutputHtmlReferences(source)).toContain('"default_popup":"p.html"');
    expect(replaceBuildOutputHtmlReferences(source)).toContain('"page":"o.html"');
    expect(replaceBuildOutputHtmlReferences(source)).toContain('"resources":["pb.html","w1.html"]');
    expect(replaceBuildOutputHtmlReferences(source)).toContain("chrome-extension://runtime-id/w1.html");
    expect(replaceBuildOutputHtmlReferences(source)).toContain("chrome-extension://runtime-id/w2.html");
    expect(replaceBuildOutputHtmlReferences(source)).toContain("chrome-extension://runtime-id/pb.html");
  });
});
