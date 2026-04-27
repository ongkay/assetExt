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
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/15">
          <Logo className="size-5 shrink-0" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading truncate text-base leading-tight font-semibold tracking-tight">
              {title}
            </h1>
            <Badge variant="outline">v{version}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {user && onOpenProfile ? (
        <UserAvatar isLoading={isProfileLoading} user={user} onOpenProfile={onOpenProfile} />
      ) : null}
    </header>
  );
}
