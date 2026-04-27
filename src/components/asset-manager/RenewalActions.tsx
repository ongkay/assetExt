import { useState } from "react";
import { KeyRoundIcon, PackageIcon } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ExtensionPackage, ExtensionRedeemState } from "@/lib/api/extensionApiTypes";

import { PackageList } from "./PackageList";
import { RedeemCdKeyForm } from "./RedeemCdKeyForm";

type RenewalActionMode = "packages" | "redeem";

type RenewalActionsProps = {
  errorMessage?: string;
  isRedeeming?: boolean;
  packages: ExtensionPackage[];
  redeem?: ExtensionRedeemState;
  onRedeemCdKey: (cdKeyCode: string) => void | Promise<void>;
};

export function RenewalActions({
  errorMessage,
  isRedeeming = false,
  packages,
  redeem,
  onRedeemCdKey,
}: RenewalActionsProps) {
  const isRedeemEnabled = redeem?.enabled ?? false;
  const [renewalActionMode, setRenewalActionMode] = useState<RenewalActionMode>("packages");

  return (
    <section className="flex flex-col gap-3" aria-label="Renewal actions">
      <ToggleGroup
        className="w-full"
        spacing={1}
        value={[renewalActionMode]}
        variant="outline"
        onValueChange={(nextRenewalActionModes) => {
          const nextRenewalActionMode = nextRenewalActionModes[0];

          if (nextRenewalActionMode === "packages" || nextRenewalActionMode === "redeem") {
            setRenewalActionMode(nextRenewalActionMode);
          }
        }}
      >
        <ToggleGroupItem className="flex-1" value="packages">
          <PackageIcon data-icon="inline-start" />
          Paket
        </ToggleGroupItem>
        <ToggleGroupItem className="flex-1" disabled={!isRedeemEnabled} value="redeem">
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
        <PackageList packages={packages} />
      )}
    </section>
  );
}
