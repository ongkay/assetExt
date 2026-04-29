import {
  AlertCircleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  // ClockIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ExtensionSubscription } from "@/lib/api/extensionApiTypes";
import {
  // formatCountdownParts,
  formatDateForPopup,
  getSubscriptionStatusLabel,
  isRenewalWarningActive,
  isSubscriptionActive,
} from "@/lib/asset-access/subscription";

type SubscriptionSummaryProps = {
  subscription: ExtensionSubscription;
};

export function SubscriptionSummary({ subscription }: SubscriptionSummaryProps) {
  // const countdownParts = formatCountdownParts(subscription.countdownSeconds);
  const statusLabel = getSubscriptionStatusLabel(subscription.status);
  const isActive = isSubscriptionActive(subscription.status);
  const isRenewalWarning = isRenewalWarningActive(subscription.countdownSeconds);

  return (
    <div className="flex flex-col ">
      <Card className="overflow-hidden border border-border/50 bg-card shadow-sm p-0">
        <div className="flex flex-col gap-0">
          <Row
            icon={CheckCircle2Icon}
            iconColor="text-emerald-500"
            label="Status"
            valueNode={
              <Badge
                variant="secondary"
                className={`gap-1 rounded-full px-1.5 py-0.5 font-medium border-0 ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isActive && <CheckCircle2Icon className="size-3.5" />}
                {statusLabel}
              </Badge>
            }
          />

          <Row
            icon={ShieldCheckIcon}
            iconColor="text-blue-500"
            label="Package"
            value={subscription.packageName ?? "None"}
          />

          {/* <Row
            icon={ClockIcon}
            iconColor="text-amber-500"
            label="Remaining time"
            value={countdownParts.label}
          /> */}

          <Row
            icon={CalendarDaysIcon}
            iconColor="text-purple-500"
            label="Expiry date"
            value={formatDateForPopup(subscription.endAt)}
            isLast
          />
        </div>
      </Card>

      {isRenewalWarning ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive shadow-sm">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>Masa aktif hampir habis. Segera perpanjang.</span>
        </div>
      ) : null}
    </div>
  );
}

type RowProps = {
  icon: React.ElementType;
  iconColor: string;
  isLast?: boolean;
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
};

function Row({ icon: Icon, iconColor, isLast, label, value, valueNode }: RowProps) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${isLast ? "" : "border-b border-border/40"}`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`size-[18px] ${iconColor}`} />
        <span className="text-[13px] text-muted-foreground">{label}:</span>
      </div>
      <div className="text-[13px] text-foreground">{valueNode || value}</div>
    </div>
  );
}
