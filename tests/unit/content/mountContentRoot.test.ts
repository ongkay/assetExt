import { describe, expect, it } from "vitest";

import { mountContentRoot } from "@/content/dom/mountContentRoot";

describe("content root mounting", () => {
  it("mounts into documentElement when document_start runs before body exists", () => {
    const originalBody = document.body;
    document.body.remove();

    const { host } = mountContentRoot(".asset-manager-test { color: red; }");

    expect(host.parentElement).toBe(document.documentElement);

    document.documentElement.appendChild(originalBody);
  });
});
