import { ArrowLeftIcon, LogOutIcon, MailIcon, MoonIcon, SunIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { getAvatarFallbackStyle, getAvatarInitials } from "@/lib/avatar";
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
  const avatarFallbackStyle = getAvatarFallbackStyle(user);

  return (
    <Card className="flex flex-1 gap-0 rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg shadow-tvlink-soft">
      <CardHeader className="border-b border-tvlink-app-border pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              className="size-14 border border-white/80 shadow-tvlink-avatar after:border-white/0"
              size="lg"
            >
              {user.avatarUrl ? <AvatarImage alt={user.username} src={user.avatarUrl} /> : null}
              <AvatarFallback className="text-base font-semibold" style={avatarFallbackStyle}>
                {getAvatarInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-0.5">
              <CardTitle className="text-base font-bold text-tvlink-text-strong">{user.username}</CardTitle>
              <CardDescription className="text-xs text-tvlink-muted">{user.publicId}</CardDescription>
            </div>
          </div>
          <Button
            aria-label="Kembali"
            className="rounded-tvlink-button border border-tvlink-app-border bg-tvlink-card-bg text-tvlink-text-strong shadow-sm transition duration-150 hover:bg-tvlink-primary-soft hover:text-tvlink-primary-hover"
            size="icon-sm"
            type="button"
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeftIcon data-icon="inline-start" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 py-4">
        <div className="rounded-tvlink-card border border-tvlink-app-border bg-tvlink-surface-soft px-4 py-4">
          <div className="flex items-center gap-3 text-sm text-tvlink-text-base">
            <div className="grid size-9 place-items-center rounded-tvlink-button bg-tvlink-primary-soft text-tvlink-primary">
              <MailIcon className="size-4" />
            </div>
            <span className="font-medium text-tvlink-text-strong">{user.email}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-tvlink-card border border-tvlink-app-border bg-tvlink-surface-soft p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-tvlink-button border border-tvlink-app-border bg-tvlink-card-bg text-tvlink-text-strong shadow-sm">
              {theme === "dark" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
            </div>
            <Label htmlFor="theme-mode" className="text-sm font-medium text-tvlink-text-strong">
              Mode Tampilan
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Label
              htmlFor="theme-mode"
              className="text-[10px] font-bold tracking-[0.18em] text-tvlink-muted-strong"
            >
              {theme === "dark" ? "GELAP" : "TERANG"}
            </Label>
            <Switch
              checked={theme === "dark"}
              id="theme-mode"
              onCheckedChange={(checked) => onThemeChange(checked ? "dark" : "light")}
            />
          </div>
        </div>

        <Button
          className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-tvlink-button border border-tvlink-danger-border bg-tvlink-danger-bg text-sm font-semibold text-tvlink-danger shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-tvlink-danger-hover-bg hover:text-tvlink-danger-hover hover:shadow-tvlink-soft active:translate-y-0"
          disabled={isLoggingOut}
          type="button"
          onClick={() => void onLogout()}
        >
          {isLoggingOut ? <Spinner data-icon="inline-start" /> : <LogOutIcon data-icon="inline-start" />}
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}
