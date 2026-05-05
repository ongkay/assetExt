import { LockKeyholeIcon, Share2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ExtensionMode } from "@/lib/api/extensionApiTypes";

type AssetModeChooserProps = {
  availableModes: ExtensionMode[];
  defaultMode: ExtensionMode;
  isSubmitting?: boolean;
  platformLabel: string;
  secondsRemaining: number;
  onSelectMode: (mode: ExtensionMode) => void | Promise<void>;
};

export function AssetModeChooser({
  availableModes,
  defaultMode,
  isSubmitting = false,
  platformLabel,
  secondsRemaining,
  onSelectMode,
}: AssetModeChooserProps) {
  const canChooseMode = availableModes.length > 1;
  const [selectedMode, setSelectedMode] = useState(defaultMode);

  if (!canChooseMode) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card p-3">
        <ChooserCopy platformLabel={platformLabel} secondsRemaining={secondsRemaining} />
        <Button disabled={isSubmitting} type="button" onClick={() => void onSelectMode(defaultMode)}>
          {defaultMode === "private" ? (
            <LockKeyholeIcon data-icon="inline-start" />
          ) : (
            <Share2Icon data-icon="inline-start" />
          )}
          Gunakan mode {getAssetModeLabel(defaultMode)}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card p-3">
      <ChooserCopy platformLabel={platformLabel} secondsRemaining={secondsRemaining} />
      <ToggleGroup
        aria-label="Pilih mode akses asset"
        className="w-full"
        disabled={isSubmitting}
        spacing={1}
        value={[selectedMode]}
        variant="outline"
        onValueChange={(nextModes) => {
          const nextMode = nextModes[0];

          if (nextMode === "private" || nextMode === "share") {
            setSelectedMode(nextMode);
            void onSelectMode(nextMode);
          }
        }}
      >
        {availableModes.includes("private") ? (
          <ToggleGroupItem className="flex-1" value="private">
            <LockKeyholeIcon data-icon="inline-start" />
            Private
          </ToggleGroupItem>
        ) : null}
        {availableModes.includes("share") ? (
          <ToggleGroupItem className="flex-1" value="share">
            <Share2Icon data-icon="inline-start" />
            Share
          </ToggleGroupItem>
        ) : null}
      </ToggleGroup>
    </div>
  );
}

function ChooserCopy({
  platformLabel,
  secondsRemaining,
}: {
  platformLabel: string;
  secondsRemaining: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">Pilih mode akses {platformLabel}</p>
      <p className="text-xs text-muted-foreground">
        Mode default akan dipakai otomatis dalam {secondsRemaining}s.
      </p>
    </div>
  );
}

function getAssetModeLabel(mode: ExtensionMode): string {
  return mode === "private" ? "Private" : "Share";
}
