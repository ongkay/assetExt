import { useState } from "react";
import manifestData from "../../manifest.json";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/component/Logo";
import { runtimeMessageType } from "@/lib/runtime/messages";
import { useThemePreference } from "@/lib/useThemePreference";

import { StatusText } from "./ui/StatusText";

const manifest =
  typeof chrome !== "undefined" && chrome.runtime?.getManifest
    ? chrome.runtime.getManifest()
    : manifestData;

const extensionName = manifest?.name ?? "Extension";
const extensionVersion = manifest?.version ?? "0.0.0";

export function OptionsApp() {
  const themeTarget = typeof document === "undefined" ? null : document.documentElement;
  const { isDark, isReady, theme, setTheme } = useThemePreference(themeTarget);
  const [status, setStatus] = useState("");

  const handleResetBadge = () => {
    if (typeof chrome === "undefined") {
      return;
    }

    chrome.runtime.sendMessage({ type: runtimeMessageType.resetBadge }, () => {
      if (chrome.runtime.lastError) {
        setStatus("Unable to reset badge.");
        return;
      }

      setStatus("Badge cleared.");
    });
  };

  return (
    <div
      className={
        isReady
          ? "min-h-dvh bg-linear-to-b from-background via-background to-muted/20 px-6 py-8 text-foreground"
          : "invisible min-h-dvh bg-linear-to-b from-background via-background to-muted/20 px-6 py-8 text-foreground"
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/15">
              <Logo className="h-5 w-5 shrink-0" title="Extension logo" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {extensionName} Settings
              </h1>
              <p className="text-sm text-muted-foreground">Version {extensionVersion}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep the extension compact, readable, and consistent across every surface.
              </p>
            </div>
          </div>

          <Badge variant="outline" className="bg-background/80 capitalize shadow-xs">
            {theme} mode
          </Badge>
        </div>

        <Card className="rounded-2xl border border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose the default look used by every extension surface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-xs">
              <div className="space-y-1">
                <p className="text-sm font-medium">Dark mode</p>
                <p className="text-sm text-muted-foreground">
                  Light mode stays the default until you turn this on.
                </p>
              </div>
              <Switch
                aria-label="Toggle dark mode"
                checked={isDark}
                onCheckedChange={(checked) => void setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Toolbar badge demo</CardTitle>
            <CardDescription>
              Reset the demo badge count managed by the background service worker.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={handleResetBadge}>
                Reset badge count
              </Button>
              <Separator orientation="vertical" className="hidden h-6 md:block" />
              <p className="text-sm text-muted-foreground">
                Useful while testing background badge updates.
              </p>
            </div>
            <StatusText status={status} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
