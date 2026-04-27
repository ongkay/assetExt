export const renewalWarningThresholdSeconds = 259_200;

export type SubscriptionStatus = "active" | "processed" | "expired" | "canceled" | "none";

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
};

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

export function isRenewalWarningActive(countdownSeconds: number): boolean {
  return countdownSeconds > 0 && countdownSeconds <= renewalWarningThresholdSeconds;
}

export function formatCountdownParts(countdownSeconds: number): CountdownParts {
  const normalizedCountdownSeconds = Math.max(0, Math.floor(countdownSeconds));
  const days = Math.floor(normalizedCountdownSeconds / 86_400);
  const hours = Math.floor((normalizedCountdownSeconds % 86_400) / 3_600);
  const minutes = Math.floor((normalizedCountdownSeconds % 3_600) / 60);
  const seconds = normalizedCountdownSeconds % 60;
  const label = `${padCountdownPart(days)}d ${padCountdownPart(hours)}h ${padCountdownPart(
    minutes,
  )}m ${padCountdownPart(seconds)}s`;

  return {
    days,
    hours,
    minutes,
    seconds,
    label,
  };
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

function padCountdownPart(countdownPart: number): string {
  return countdownPart.toString().padStart(2, "0");
}
