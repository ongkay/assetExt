// @vitest-environment node

import { describe, expect, it } from "vitest";

import manifest from "../../../manifest.json";

describe("extension manifest", () => {
  it("runs asset content script at document_start so manual reload can be intercepted", () => {
    expect(manifest.content_scripts[0].run_at).toBe("document_start");
  });
});
