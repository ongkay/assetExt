import { AssetModeChooser } from "@/components/asset-manager/AssetModeChooser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";
import type { ExtensionAssetResponse, ExtensionMode } from "@/lib/api/extensionApiTypes";

type AccessOverlayState = "idle" | "loading" | "chooser" | "success" | "error";

type AccessOverlayProps = {
  assetResponse?: ExtensionAssetResponse;
  message: string;
  platform: AssetPlatform | null;
  secondsRemaining: number;
  state: AccessOverlayState;
  onSelectMode: (mode: ExtensionMode) => void | Promise<void>;
};

export function AccessOverlay({
  assetResponse,
  message,
  platform,
  secondsRemaining,
  state,
  onSelectMode,
}: AccessOverlayProps) {
  if (state === "idle" || !platform) {
    return null;
  }

  const platformLabel = getAssetPlatformConfig(platform).label;

  if (state === "chooser" && assetResponse?.status === "selection_required") {
    return (
      <section
        aria-label="Asset access mode chooser"
        className="fixed inset-0 z-2147483647 grid place-items-center bg-background/55 p-4 backdrop-blur-sm"
      >
        <Card className="w-full max-w-sm border-border/80 shadow-xl shadow-primary/10">
          <CardHeader className="gap-1.5">
            <CardTitle>Pilih mode akses</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent>
            <AssetModeChooser
              availableModes={assetResponse.availableModes}
              defaultMode={assetResponse.defaultMode}
              platformLabel={platformLabel}
              secondsRemaining={secondsRemaining}
              onSelectMode={onSelectMode}
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section
      aria-live="polite"
      aria-label="Asset access status"
      className="fixed inset-0 z-2147483647 grid place-items-center bg-background/55 p-4 backdrop-blur-sm"
    >
      <Card className="w-full max-w-xs border-border/80 shadow-xl shadow-primary/10">
        <CardContent className="flex items-center gap-3 py-4">
          {state === "loading" ? <Spinner className="size-5 text-primary" /> : null}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-card-foreground">{platformLabel}</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
