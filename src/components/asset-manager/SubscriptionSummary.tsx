import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ExtensionSubscription } from "@/lib/api/extensionApiTypes";
import {
  formatCountdownParts,
  formatDateForPopup,
  getSubscriptionStatusLabel,
  isRenewalWarningActive,
  isSubscriptionActive,
} from "@/lib/asset-access/subscription";

type SubscriptionSummaryProps = {
  subscription: ExtensionSubscription;
};

export function SubscriptionSummary({ subscription }: SubscriptionSummaryProps) {
  const countdownParts = formatCountdownParts(subscription.countdownSeconds);
  const statusLabel = getSubscriptionStatusLabel(subscription.status);
  const isActive = isSubscriptionActive(subscription.status);
  const isRenewalWarning = isRenewalWarningActive(subscription.countdownSeconds);

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              {subscription.packageName ?? "Belum ada paket aktif"}
            </CardDescription>
          </div>
          <Badge variant={isActive ? "secondary" : "outline"}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <SummaryMetric label="Sisa waktu" value={countdownParts.label} />
        <SummaryMetric label="Berakhir" value={formatDateForPopup(subscription.endAt)} />
        {isRenewalWarning ? (
          <p className="col-span-2 rounded-md bg-muted px-3 py-2 text-muted-foreground">
            Masa aktif hampir habis. Perpanjang akses agar asset tetap tersedia.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border/70 bg-background px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
