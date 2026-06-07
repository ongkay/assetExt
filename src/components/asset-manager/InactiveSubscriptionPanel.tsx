import { useState } from "react";
import { CreditCardIcon, KeyRoundIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ExtensionRedeemState, ExtensionSubscription } from "@/lib/api/extensionApiTypes";

import { createCheckoutPageUrl } from "./packageCheckoutUrl";
import { RedeemCdKeyForm } from "./RedeemCdKeyForm";

type InactiveSubscriptionPanelProps = {
  apiBaseUrl: string;
  errorMessage?: string;
  isRedeeming?: boolean;
  redeem?: ExtensionRedeemState;
  subscription: ExtensionSubscription;
  onRedeemCdKey: (cdKeyCode: string) => void | Promise<void>;
};

type InactiveSubscriptionCopy = {
  message: string;
  title: string;
};

const inactiveSubscriptionCopy = {
  canceled: {
    message: "Silahkan beli paket baru atau redeem code.",
    title: "Subscription canceled",
  },
  expired: {
    message: "Silahkan beli paket baru atau redeem code.",
    title: "Subscription expired",
  },
  none: {
    message: "Beli paket atau redeem code untuk memulai.",
    title: "Subscription belum aktif",
  },
} satisfies Record<"canceled" | "expired" | "none", InactiveSubscriptionCopy>;

export function InactiveSubscriptionPanel({
  apiBaseUrl,
  errorMessage,
  isRedeeming = false,
  redeem,
  subscription,
  onRedeemCdKey,
}: InactiveSubscriptionPanelProps) {
  const [isRedeemFormVisible, setIsRedeemFormVisible] = useState(false);
  const isRedeemEnabled = redeem?.enabled ?? false;
  const checkoutUrl = createCheckoutPageUrl(apiBaseUrl);
  const subscriptionCopy = getInactiveSubscriptionCopy(subscription);

  const handleShowRedeemForm = () => {
    if (!isRedeemEnabled) {
      return;
    }

    setIsRedeemFormVisible(true);
  };

  return (
    <section className="mb-4 flex flex-col gap-3 rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-card-bg p-4 shadow-tvlink-soft">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-tvlink-card border border-tvlink-danger-border bg-tvlink-danger-bg text-tvlink-danger">
          <TriangleAlertIcon className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-tvlink-text-strong">{subscriptionCopy.title}</p>
          <p className="mt-1 text-xs leading-5 text-tvlink-muted">{subscriptionCopy.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-tvlink-button border-0 bg-[linear-gradient(135deg,var(--tvlink-button-gradient-start)_0%,var(--tvlink-button-gradient-end)_100%)] text-sm font-semibold text-white shadow-tvlink-button transition duration-150 hover:-translate-y-0.5 hover:shadow-tvlink-button-hover"
          nativeButton={false}
          render={<a href={checkoutUrl} rel="noreferrer" target="_blank" />}
        >
          <CreditCardIcon data-icon="inline-start" />
          Buy Now
        </Button>
        <Button
          aria-expanded={isRedeemFormVisible}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-tvlink-button border border-tvlink-app-border bg-tvlink-card-bg text-sm font-semibold text-tvlink-text-strong shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-tvlink-primary-border hover:bg-tvlink-primary-soft hover:text-tvlink-primary-hover hover:shadow-tvlink-soft"
          disabled={!isRedeemEnabled}
          type="button"
          variant="outline"
          onClick={handleShowRedeemForm}
        >
          <KeyRoundIcon data-icon="inline-start" />
          Redeem Code
        </Button>
      </div>

      {!isRedeemEnabled ? (
        <p className="text-xs leading-5 text-tvlink-muted">Redeem code belum tersedia untuk akun ini.</p>
      ) : null}

      {isRedeemFormVisible && isRedeemEnabled ? (
        <RedeemCdKeyForm
          errorMessage={errorMessage}
          isRedeeming={isRedeeming}
          onRedeemCdKey={onRedeemCdKey}
        />
      ) : null}
    </section>
  );
}

function getInactiveSubscriptionCopy(subscription: ExtensionSubscription): InactiveSubscriptionCopy {
  switch (subscription.status) {
    case "canceled":
      return inactiveSubscriptionCopy.canceled;
    case "expired":
      return inactiveSubscriptionCopy.expired;
    case "none":
      return inactiveSubscriptionCopy.none;
    default:
      return {
        message: "Subscription belum aktif. Beli paket atau redeem code untuk memakai akses TvLink.",
        title: "Subscription tidak aktif",
      };
  }
}
