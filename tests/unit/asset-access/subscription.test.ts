import { describe, expect, it } from "vitest";

import {
  formatCountdownParts,
  formatDateForPopup,
  getSubscriptionStatusLabel,
  isRenewalWarningActive,
} from "@/lib/asset-access/subscription";

describe("subscription helpers", () => {
  it("detects active renewal warnings within the threshold", () => {
    expect(isRenewalWarningActive(259_200)).toBe(true);
    expect(isRenewalWarningActive(259_201)).toBe(false);
    expect(isRenewalWarningActive(0)).toBe(false);
  });

  it("formats countdown seconds into padded parts and label", () => {
    expect(formatCountdownParts(176_461)).toEqual({
      days: 2,
      hours: 1,
      minutes: 1,
      seconds: 1,
      label: "02d 01h 01m 01s",
    });
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
