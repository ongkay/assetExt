// @vitest-environment node

import { describe, expect, it } from "vitest";

import manifest from "../../../manifest.ext-2.json";

describe("ext-2 manifest", () => {
  it("keeps ext-2 background-only with the watchdog service worker", () => {
    expect(manifest.background).toEqual({
      service_worker: "src/ext-2/background/index.ts",
      type: "module",
    });
    expect("action" in manifest).toBe(false);
    expect("content_scripts" in manifest).toBe(false);
  });

  it("declares the permissions required to monitor and revoke access", () => {
    expect(manifest.permissions).toEqual(expect.arrayContaining(["cookies", "management", "storage", "tabs"]));
    expect(manifest.host_permissions).toEqual(
      expect.arrayContaining([
        "https://whoer.net/*",
        "https://*.whoer.net/*",
        "https://browserscan.net/*",
        "https://*.browserscan.net/*",
      ]),
    );
  });
});
