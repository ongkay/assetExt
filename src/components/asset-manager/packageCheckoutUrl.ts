export function createPackageCheckoutUrl(apiBaseUrl: string, checkoutUrl: string): string {
  return new URL(checkoutUrl, apiBaseUrl).toString();
}

export function createCheckoutPageUrl(apiBaseUrl: string): string {
  return new URL("/checkout/", apiBaseUrl).toString();
}
