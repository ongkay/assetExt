import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

import type { ExtensionSubscription } from "@/lib/api/extensionApiTypes";
import {
  formatDateForPopup,
  getSubscriptionStatusLabel,
  isRenewalWarningActive,
  isSubscriptionActive,
} from "@/lib/asset-access/subscription";

type SubscriptionSummaryProps = {
  subscription: ExtensionSubscription;
};

export function SubscriptionSummary({ subscription }: SubscriptionSummaryProps) {
  const statusLabel = getSubscriptionStatusLabel(subscription.status);
  const isActive = isSubscriptionActive(subscription.status);
  const isRenewalWarning = isRenewalWarningActive(subscription.endAt);

  return (
    <div className="flex flex-col gap-2">
      <section className="mb-4 rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg p-4 shadow-tvlink-soft">
        <div className="mb-3 flex items-center justify-between border-b border-tvlink-app-border pb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-tvlink-muted-strong">
            Subscription
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${
              isActive
                ? "border-tvlink-success-border bg-tvlink-success-bg text-tvlink-success"
                : "border-tvlink-app-border bg-tvlink-surface-soft text-tvlink-muted-strong"
            }`}
          >
            {isActive ? (
              <span className="h-2 w-2 rounded-full bg-tvlink-success" />
            ) : (
              <CheckCircle2Icon className="h-3 w-3" />
            )}
            <span>{statusLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1 text-xs text-tvlink-muted">Package</div>
            <div className="truncate text-sm font-semibold text-tvlink-text-strong">
              {subscription.packageName ?? "None"}
            </div>
          </div>

          <div className="text-right">
            <div className="mb-1 text-xs text-tvlink-muted">Expiry Date</div>
            <div className="text-sm font-semibold text-tvlink-text-strong">
              {formatDateForPopup(subscription.endAt)}
            </div>
          </div>
        </div>
      </section>

      {isRenewalWarning ? (
        <div className="mt-1 flex items-center gap-2.5 rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-danger-bg px-3 py-2 text-xs font-medium text-tvlink-danger shadow-tvlink-soft">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>Masa aktif hampir habis. Segera perpanjang.</span>
        </div>
      ) : null}
    </div>
  );
}
