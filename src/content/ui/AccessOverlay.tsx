import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";

type AccessOverlayState = "idle" | "loading" | "success" | "error";

type AccessOverlayProps = {
  message: string;
  platform: AssetPlatform | null;
  state: AccessOverlayState;
};

export function AccessOverlay({ message, platform, state }: AccessOverlayProps) {
  if (state === "idle" || !platform) {
    return null;
  }

  const platformLabel = getAssetPlatformConfig(platform).label;

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
