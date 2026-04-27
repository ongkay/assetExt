import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type OverlayPanelProps = {
  isDark: boolean;
  isReady: boolean;
  isVisible: boolean;
  onHide: () => void;
  onIncrementBadge: () => void;
  onShow: () => void;
  onThemeChange: (checked: boolean) => void;
};

export function OverlayPanel({
  isDark,
  isReady,
  isVisible,
  onHide,
  onIncrementBadge,
  onShow,
  onThemeChange,
}: OverlayPanelProps) {
  if (!isVisible) {
    return (
      <div className="fixed right-4 bottom-4">
        <Button
          className={
            isReady
              ? "rounded-full shadow-lg shadow-primary/10"
              : "invisible rounded-full shadow-lg shadow-primary/10"
          }
          size="sm"
          type="button"
          onClick={onShow}
        >
          Show
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={
        isReady
          ? "fixed right-4 bottom-4 w-72 rounded-2xl border border-border/80 bg-linear-to-b from-card/95 to-muted/30 shadow-xl shadow-primary/10 backdrop-blur"
          : "invisible fixed right-4 bottom-4 w-72 rounded-2xl border border-border/80 bg-linear-to-b from-card/95 to-muted/30 shadow-xl shadow-primary/10 backdrop-blur"
      }
    >
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Overlay</CardTitle>
            <CardDescription>Shadow DOM surface with shared theme tokens.</CardDescription>
          </div>
          <Badge variant="outline" className="bg-background/80 capitalize shadow-xs">
            {isDark ? "dark" : "light"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 shadow-xs">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-muted-foreground">
              Matches popup and settings instantly.
            </p>
          </div>
          <Switch
            aria-label="Toggle overlay dark mode"
            checked={isDark}
            onCheckedChange={onThemeChange}
          />
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t border-border/70 pt-4">
        <Button className="flex-1" size="sm" type="button" onClick={onIncrementBadge}>
          Badge +
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={onHide}>
          Hide
        </Button>
      </CardFooter>
    </Card>
  );
}
