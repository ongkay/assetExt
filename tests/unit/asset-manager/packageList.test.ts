import { describe, expect, it } from "vitest";

import { createPackageCheckoutUrl } from "@/components/asset-manager/packageCheckoutUrl";

describe("package checkout URL", () => {
  it("resolves relative checkout URLs against the API base URL", () => {
    expect(
      createPackageCheckoutUrl("http://localhost:3000/api/extension", "/paymentdummy?packageId=abc"),
    ).toBe("http://localhost:3000/paymentdummy?packageId=abc");
  });

  it("keeps absolute checkout URLs absolute", () => {
    expect(
      createPackageCheckoutUrl(
        "http://localhost:3000/api/extension",
        "https://billing.example.com/checkout?packageId=abc",
      ),
    ).toBe("https://billing.example.com/checkout?packageId=abc");
  });
});
