import { useState } from "react";
import { KeyRoundIcon, PackageIcon } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ExtensionPackage, ExtensionRedeemState } from "@/lib/api/extensionApiTypes";

import { PackageList } from "./PackageList";
import { RedeemCdKeyForm } from "./RedeemCdKeyForm";

type RenewalActionMode = "packages" | "redeem";

type RenewalActionsProps = {
  apiBaseUrl: string;
  errorMessage?: string;
  isRedeeming?: boolean;
  packages: ExtensionPackage[];
  redeem?: ExtensionRedeemState;
  onRedeemCdKey: (cdKeyCode: string) => void | Promise<void>;
};

export function RenewalActions({
  apiBaseUrl,
  errorMessage,
  isRedeeming = false,
  packages,
  redeem,
  onRedeemCdKey,
}: RenewalActionsProps) {
  const isRedeemEnabled = redeem?.enabled ?? false;
  const [renewalActionMode, setRenewalActionMode] = useState<RenewalActionMode>("packages");

  return (
    <section aria-label="Renewal actions" className="flex flex-col gap-3">
      <ToggleGroup
        className="w-full rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg p-1 shadow-tvlink-soft"
        spacing={1}
        value={[renewalActionMode]}
        onValueChange={(nextRenewalActionModes) => {
          const nextRenewalActionMode = nextRenewalActionModes[0];

          if (nextRenewalActionMode === "packages" || nextRenewalActionMode === "redeem") {
            setRenewalActionMode(nextRenewalActionMode);
          }
        }}
      >
        <ToggleGroupItem
          className="flex-1 rounded-tvlink-button text-tvlink-muted transition-all hover:text-tvlink-text-strong aria-pressed:bg-tvlink-primary-soft aria-pressed:text-tvlink-primary-hover aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-tvlink-primary-border"
          value="packages"
        >
          <PackageIcon data-icon="inline-start" />
          Paket
        </ToggleGroupItem>
        <ToggleGroupItem
          className="flex-1 rounded-tvlink-button text-tvlink-muted transition-all hover:text-tvlink-text-strong aria-pressed:bg-tvlink-primary-soft aria-pressed:text-tvlink-primary-hover aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-tvlink-primary-border"
          disabled={!isRedeemEnabled}
          value="redeem"
        >
          <KeyRoundIcon data-icon="inline-start" />
          CD Key
        </ToggleGroupItem>
      </ToggleGroup>

      {renewalActionMode === "redeem" && isRedeemEnabled ? (
        <RedeemCdKeyForm
          errorMessage={errorMessage}
          isRedeeming={isRedeeming}
          onRedeemCdKey={onRedeemCdKey}
        />
      ) : (
        <PackageList apiBaseUrl={apiBaseUrl} packages={packages} />
      )}
    </section>
  );
}
