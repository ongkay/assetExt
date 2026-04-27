export function createPackageCheckoutUrl(apiBaseUrl: string, checkoutUrl: string): string {
  return new URL(checkoutUrl, apiBaseUrl).toString();
}
