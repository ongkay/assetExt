import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
      <Card className="overflow-hidden border border-border/50 bg-card shadow-sm p-3 gap-0">
        <div className="flex items-center justify-between pb-2.5 border-b border-border">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Subscription</span>
          <Badge
            variant="secondary"
            className={`gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border-0 ${
              isActive
                ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isActive && <CheckCircle2Icon className="size-3" />}
            {statusLabel}
          </Badge>
        </div>
        <div className="flex justify-between pt-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground font-medium">Package</span>
            <span className="text-[13px] font-bold text-foreground">
              {subscription.packageName ?? "None"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-[11px] text-muted-foreground font-medium">Expiry Date</span>
            <span className="text-[13px] font-bold text-foreground">
              {formatDateForPopup(subscription.endAt)}
            </span>
          </div>
        </div>
      </Card>

      {isRenewalWarning ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive shadow-sm mt-1">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>Masa aktif hampir habis. Segera perpanjang.</span>
        </div>
      ) : null}
    </div>
  );
}
