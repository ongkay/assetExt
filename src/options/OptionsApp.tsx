import manifestData from "../../manifest.json";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/asset-manager/Logo";
import { useThemePreference } from "@/lib/useThemePreference";

const manifest =
  typeof chrome !== "undefined" && chrome.runtime?.getManifest
    ? chrome.runtime.getManifest()
    : manifestData;

const extensionVersion = manifest?.version ?? "0.0.0";

export function OptionsApp() {
  const themeTarget = typeof document === "undefined" ? null : document.documentElement;
  const { isDark, isReady, theme, setTheme } = useThemePreference(themeTarget);

  return (
    <div
      className={
        isReady
          ? "min-h-dvh bg-linear-to-b from-background via-background to-muted/20 px-6 py-8 text-foreground"
          : "invisible min-h-dvh bg-linear-to-b from-background via-background to-muted/20 px-6 py-8 text-foreground"
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/15">
              <Logo className="h-5 w-5 shrink-0" title="Extension logo" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Asset Manager Settings</h1>
              <p className="text-sm text-muted-foreground">Version {extensionVersion}</p>
              <p className="text-sm text-muted-foreground">
                Atur preferensi tampilan ekstensi agar tetap nyaman dipakai di semua permukaan
                Asset Manager.
              </p>
            </div>
          </div>

          <Badge variant="outline" className="bg-background/80 capitalize shadow-xs">
            {theme} mode
          </Badge>
        </div>

        <Card className="rounded-2xl border border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Preferensi Tampilan</CardTitle>
            <CardDescription>
              Pilih mode visual yang digunakan popup, options, dan panel konten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-xs">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Mode gelap</p>
                <p className="text-sm text-muted-foreground">
                  Aktifkan untuk memakai tema gelap di seluruh extension.
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
      </div>
    </div>
  );
}
