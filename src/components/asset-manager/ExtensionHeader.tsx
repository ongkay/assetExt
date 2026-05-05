import { Badge } from "@/components/ui/badge";
import type { ExtensionUser } from "@/lib/api/extensionApiTypes";

import { Logo } from "./Logo";
import { UserAvatar } from "./UserAvatar";

type ExtensionHeaderProps = {
  isProfileLoading?: boolean;
  onOpenProfile?: () => void;
  subtitle: string;
  title: string;
  user?: ExtensionUser;
  version: string;
};

export function ExtensionHeader({
  isProfileLoading = false,
  onOpenProfile,
  subtitle,
  title,
  user,
  version,
}: ExtensionHeaderProps) {
  return (
    <header className="flex flex-col gap-3 pb-3 border-b border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-blue-400 dark:bg-blue-500/20 border border-primary/20 dark:border-blue-500/20 shadow-[0_0_15px_rgba(var(--color-primary),0.1)]">
            <Logo className="size-6 shrink-0" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h1 className="font-heading truncate text-lg font-bold tracking-tight text-primary dark:text-blue-400">
                {title}
              </h1>
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-mono bg-primary/10 text-primary dark:text-blue-400 dark:bg-blue-500/20 hover:bg-primary/10 border-0"
              >
                v{version}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
          </div>
        </div>
        {user && onOpenProfile ? (
          <UserAvatar isLoading={isProfileLoading} user={user} onOpenProfile={onOpenProfile} />
        ) : null}
      </div>
    </header>
  );
}
