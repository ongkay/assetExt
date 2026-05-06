import { describe, expect, it } from "vitest";

import {
  formatDateForPopup,
  getSubscriptionStatusLabel,
  isRenewalWarningActive,
} from "@/lib/asset-access/subscription";

describe("subscription helpers", () => {
  it("detects active renewal warnings within the threshold", () => {
    expect(isRenewalWarningActive("2099-01-04T00:00:00.000Z", new Date("2099-01-01T00:00:00.000Z"))).toBe(
      true,
    );
    expect(isRenewalWarningActive("2099-01-05T00:00:01.000Z", new Date("2099-01-01T00:00:00.000Z"))).toBe(
      false,
    );
    expect(isRenewalWarningActive(null, new Date("2099-01-01T00:00:00.000Z"))).toBe(false);
  });

  it("returns status labels", () => {
    expect(getSubscriptionStatusLabel("active")).toBe("Active");
    expect(getSubscriptionStatusLabel("processed")).toBe("Processed");
    expect(getSubscriptionStatusLabel("expired")).toBe("Expired");
    expect(getSubscriptionStatusLabel("canceled")).toBe("Canceled");
    expect(getSubscriptionStatusLabel("none")).toBe("None");
  });

  it("formats subscription dates for the popup", () => {
    expect(formatDateForPopup("2026-05-01T09:45:22.805+00:00")).toBe("01 Mei 2026");
    expect(formatDateForPopup(null)).toBe("-");
  });
});
