export const renewalWarningThresholdSeconds = 259_200;
const renewalWarningThresholdMs = renewalWarningThresholdSeconds * 1_000;

export type SubscriptionStatus = "active" | "processed" | "expired" | "canceled" | "none";

const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  active: "Active",
  processed: "Processed",
  expired: "Expired",
  canceled: "Canceled",
  none: "None",
};

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  return subscriptionStatusLabels[status];
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === "active" || status === "processed";
}

export function isRenewalWarningActive(endAt: string | null, now = new Date()): boolean {
  if (!endAt) {
    return false;
  }

  const endAtTime = new Date(endAt).getTime();

  return endAtTime > now.getTime() && endAtTime - now.getTime() <= renewalWarningThresholdMs;
}

export function formatDateForPopup(dateIso: string | null): string {
  if (dateIso === null) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateIso));
}
