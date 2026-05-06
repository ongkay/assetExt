import { ArrowLeftIcon, LogOutIcon, MailIcon, MoonIcon, SunIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import type { ExtensionUser } from "@/lib/api/extensionApiTypes";
import type { ThemePreference } from "@/lib/theme";

type ProfilePanelProps = {
  isLoggingOut?: boolean;
  onBack: () => void;
  onLogout: () => void | Promise<void>;
  onThemeChange: (theme: ThemePreference) => void;
  theme: ThemePreference;
  user: ExtensionUser;
};

export function ProfilePanel({
  isLoggingOut = false,
  onBack,
  onLogout,
  onThemeChange,
  theme,
  user,
}: ProfilePanelProps) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card shadow-sm transition-all">
      <div className="pointer-events-none absolute top-0 left-0 h-32 w-32 -translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-3xl" />
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="border border-border/50 shadow-sm">
              {user.avatarUrl ? <AvatarImage alt={user.username} src={user.avatarUrl} /> : null}
              <AvatarFallback className="bg-muted text-foreground">{getProfileInitials(user)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-0.5">
              <CardTitle className="text-base font-semibold">{user.username}</CardTitle>
              <CardDescription className="text-xs">{user.publicId}</CardDescription>
            </div>
          </div>
          <Button
            aria-label="Kembali"
            className="transition-transform active:scale-95"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onBack}
          >
            <ArrowLeftIcon data-icon="inline-start" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/30 p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <MailIcon className="size-4" />
            <span className="font-medium text-foreground">{user.email}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-background border border-border/50 text-foreground shadow-sm">
              {theme === "dark" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
            </div>
            <Label htmlFor="theme-mode" className="text-sm font-medium">
              Mode Tampilan
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Label
              htmlFor="theme-mode"
              className="text-[10px] font-bold tracking-wider text-muted-foreground"
            >
              {theme === "dark" ? "GELAP" : "TERANG"}
            </Label>
            <Switch
              id="theme-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => onThemeChange(checked ? "dark" : "light")}
            />
          </div>
        </div>

        <Button
          className="w-full relative overflow-hidden bg-destructive/10! hover:bg-destructive/20! text-destructive! font-medium border! border-destructive/20! shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] active:translate-y-0 group/logout"
          disabled={isLoggingOut}
          type="button"
          onClick={() => void onLogout()}
        >
          {isLoggingOut ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <LogOutIcon
              className="transition-transform duration-300 group-hover/logout:-translate-x-1"
              data-icon="inline-start"
            />
          )}
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}

function getProfileInitials(user: ExtensionUser): string {
  const displayName = user.username.trim() || user.email.trim();

  if (!displayName) {
    return "AM";
  }

  return displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase() ?? "")
    .join("");
}
