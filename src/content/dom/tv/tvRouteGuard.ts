import * as tvDomUtils from "./tvDomUtils";
import {
  restrictedTvChartPathPrefix,
  restrictedTvDefaultChartPath,
  restrictedTvDefaultChartUrl,
  restrictedTvLayoutOwnerTextSelector,
  restrictedTvRouteGuardPendingTimeoutMs,
} from "./tvSelectors";
import type { TvOverrideState } from "./tvTypes";

export type TvRouteGuardState = {
  chartOwnershipPendingSinceMs: number | null;
  isRedirecting: boolean;
  lastEvaluatedHref: string | null;
};

export type TvRouteGuardStatus = "allowed" | "pending" | "redirected";

export function createTvRouteGuardState(): TvRouteGuardState {
  return {
    chartOwnershipPendingSinceMs: null,
    isRedirecting: false,
    lastEvaluatedHref: null,
  };
}

export function syncRestrictedTvRouteGuard(
  routeGuardState: TvRouteGuardState,
  overrideState: TvOverrideState | null,
): TvRouteGuardStatus {
  syncTvRouteGuardHref(routeGuardState);

  if (!overrideState || overrideState.menuMode !== "restricted") {
    resetTvRouteGuardState(routeGuardState);
    return "allowed";
  }

  const currentPathname = getCurrentPathname();

  if (!currentPathname.startsWith(restrictedTvChartPathPrefix)) {
    return redirectToRestrictedTvDefaultChart(routeGuardState);
  }

  if (currentPathname === restrictedTvDefaultChartPath) {
    routeGuardState.chartOwnershipPendingSinceMs = null;
    return "allowed";
  }

  const requiredPublicId = overrideState.publicId?.trim() ?? "";

  if (requiredPublicId.length === 0) {
    return redirectToRestrictedTvDefaultChart(routeGuardState);
  }

  const layoutOwnerLabels = getTvLayoutOwnerLabels();

  if (layoutOwnerLabels.some((layoutOwnerLabel) => hasTvLayoutOwnership(layoutOwnerLabel, requiredPublicId))) {
    routeGuardState.chartOwnershipPendingSinceMs = null;
    return "allowed";
  }

  if (layoutOwnerLabels.length > 0) {
    return redirectToRestrictedTvDefaultChart(routeGuardState);
  }

  if (routeGuardState.chartOwnershipPendingSinceMs === null) {
    routeGuardState.chartOwnershipPendingSinceMs = Date.now();
    return "pending";
  }

  if (Date.now() - routeGuardState.chartOwnershipPendingSinceMs < restrictedTvRouteGuardPendingTimeoutMs) {
    return "pending";
  }

  return redirectToRestrictedTvDefaultChart(routeGuardState);
}

function redirectToRestrictedTvDefaultChart(routeGuardState: TvRouteGuardState): TvRouteGuardStatus {
  if (routeGuardState.isRedirecting) {
    return "redirected";
  }

  routeGuardState.isRedirecting = true;
  tvDomUtils.replaceLocation(restrictedTvDefaultChartUrl);
  return "redirected";
}

function syncTvRouteGuardHref(routeGuardState: TvRouteGuardState) {
  const currentHref = window.location.href;

  if (routeGuardState.lastEvaluatedHref === currentHref) {
    return;
  }

  routeGuardState.lastEvaluatedHref = currentHref;
  routeGuardState.chartOwnershipPendingSinceMs = null;
  routeGuardState.isRedirecting = false;
}

function resetTvRouteGuardState(routeGuardState: TvRouteGuardState) {
  routeGuardState.chartOwnershipPendingSinceMs = null;
  routeGuardState.isRedirecting = false;
}

function getCurrentPathname() {
  try {
    return new URL(window.location.href).pathname;
  } catch {
    return window.location.pathname;
  }
}

function getTvLayoutOwnerLabels() {
  return [...document.querySelectorAll(restrictedTvLayoutOwnerTextSelector)]
    .map((layoutOwnerNode) => tvDomUtils.normalizeText(layoutOwnerNode.textContent))
    .filter((layoutOwnerLabel) => layoutOwnerLabel.length > 0);
}

function hasTvLayoutOwnership(layoutOwnerLabel: string, requiredPublicId: string) {
  const escapedPublicId = tvDomUtils.escapeRegExp(requiredPublicId);
  const publicIdMatcher = new RegExp(`(^|[^A-Za-z0-9])${escapedPublicId}($|[^A-Za-z0-9])`);

  return publicIdMatcher.test(layoutOwnerLabel);
}
