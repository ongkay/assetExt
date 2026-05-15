// @vitest-environment node

import { describe, expect, it } from "vitest";

import { getManagedCookieDomains } from "../../../src/lib/peer-guard/managedCookieDomains";

describe("getManagedCookieDomains", () => {
  it("collects asset domains and server cookie domains without duplicates", () => {
    const managedCookieDomains = getManagedCookieDomains("https://app.assetnext.dev/api");

    expect(managedCookieDomains).toEqual(
      expect.arrayContaining([
        "tradingview.com",
        ".tradingview.com",
        "whoer.net",
        ".whoer.net",
        "forextester.com",
        ".forextester.com",
        "browserscan.net",
        ".browserscan.net",
        "app.assetnext.dev",
        ".app.assetnext.dev",
      ]),
    );
    expect(new Set(managedCookieDomains).size).toBe(managedCookieDomains.length);
  });

  it("keeps localhost as a plain cookie hostname", () => {
    expect(getManagedCookieDomains("http://localhost:3000")).toContain("localhost");
    expect(getManagedCookieDomains("http://localhost:3000")).not.toContain(".localhost");
  });
});
