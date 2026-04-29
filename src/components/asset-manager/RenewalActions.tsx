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
    <section className="flex flex-col gap-3" aria-label="Renewal actions">
      <ToggleGroup
        className="w-full rounded-xl bg-zinc-100 p-1 shadow-inner ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/5"
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
          className="flex-1 rounded-lg text-zinc-500 transition-all hover:text-zinc-700 aria-pressed:bg-white aria-pressed:text-zinc-900 aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-black/5 dark:text-zinc-400 dark:hover:text-zinc-200 dark:aria-pressed:bg-zinc-800 dark:aria-pressed:text-zinc-50 dark:aria-pressed:ring-white/10"
          value="packages"
        >
          <PackageIcon data-icon="inline-start" />
          Paket
        </ToggleGroupItem>
        <ToggleGroupItem
          className="flex-1 rounded-lg text-zinc-500 transition-all hover:text-zinc-700 aria-pressed:bg-white aria-pressed:text-zinc-900 aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-black/5 dark:text-zinc-400 dark:hover:text-zinc-200 dark:aria-pressed:bg-zinc-800 dark:aria-pressed:text-zinc-50 dark:aria-pressed:ring-white/10"
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
