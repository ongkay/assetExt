export const tradingViewOrigin = "https://www.tradingview.com";
export const defaultTradingViewChartId = "ceqTNBkY";
export const defaultTradingViewChartPath = `/chart/${defaultTradingViewChartId}/`;
export const defaultTradingViewChartUrl = `${tradingViewOrigin}${defaultTradingViewChartPath}`;

const tradingViewChartPathPattern = /^\/chart\/([^/]+)\/?$/i;

export function isTradingViewHostname(hostname: string): boolean {
  const normalizedHostname = hostname.trim().toLowerCase();

  return normalizedHostname === "tradingview.com" || normalizedHostname.endsWith(".tradingview.com");
}

export function isTradingViewChartPath(pathname: string): boolean {
  return tradingViewChartPathPattern.test(pathname.trim());
}

export function getTradingViewChartId(value: string): string | null {
  const pathname = readTradingViewPathname(value);

  if (!pathname) {
    return null;
  }

  const chartMatch = pathname.match(tradingViewChartPathPattern);

  return chartMatch?.[1] ?? null;
}

export function createTradingViewChartUrl(chartId: string): string {
  return `${tradingViewOrigin}/chart/${chartId.trim()}/`;
}

export function normalizeTradingViewChartUrl(value: string): string | null {
  try {
    const parsedUrl = new URL(value);

    if (!isTradingViewHostname(parsedUrl.hostname)) {
      return null;
    }

    const chartId = getTradingViewChartId(parsedUrl.pathname);

    if (!chartId) {
      return null;
    }

    return createTradingViewChartUrl(chartId);
  } catch {
    const chartId = getTradingViewChartId(value);

    return chartId ? createTradingViewChartUrl(chartId) : null;
  }
}

export function isTradingViewChartUrl(value: string): boolean {
  return normalizeTradingViewChartUrl(value) !== null;
}

export function isDefaultTradingViewChartUrl(value: string): boolean {
  return normalizeTradingViewChartUrl(value) === defaultTradingViewChartUrl;
}

function readTradingViewPathname(value: string): string | null {
  try {
    return new URL(value).pathname;
  } catch {
    return value.startsWith("/") ? value : null;
  }
}
