// @vitest-environment node

import { describe, expect, it } from "vitest";

import manifest from "../../../manifest.json";

describe("extension manifest", () => {
  it("brands the main extension as ext-1 for the paired install flow", () => {
    expect(manifest.name).toBe("Asset Manager ext-1");
    expect(manifest.action.default_title).toBe("Asset Manager ext-1");
  });

  it("runs asset content script at document_start so manual reload can be intercepted", () => {
    expect(manifest.content_scripts[0].run_at).toBe("document_start");
  });

  it("declares proxy permissions and protected host coverage", () => {
    expect(manifest.permissions).toEqual(
      expect.arrayContaining(["management", "proxy", "webRequest", "webRequestAuthProvider"]),
    );
    expect(manifest.host_permissions).toEqual(
      expect.arrayContaining([
        "https://whoer.net/*",
        "https://*.whoer.net/*",
        "https://browserscan.net/*",
        "https://*.browserscan.net/*",
      ]),
    );
  });

  it("allows the proxy blocked page to be used as a redirect target", () => {
    expect(manifest.web_accessible_resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resources: expect.arrayContaining(["proxy-blocked.html", "ext-1-blocked.html"]),
        }),
      ]),
    );
  });
});
