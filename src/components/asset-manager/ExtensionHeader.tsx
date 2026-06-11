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
    <header className="mb-4 flex items-center justify-between gap-3 border-b border-tvlink-app-border pb-4">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-3">
          <Logo className="h-[26px] w-[26px] shrink-0 text-tvlink-primary" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="truncate text-[16px] font-extrabold leading-none tracking-wide text-tvlink-text-strong">
                {title}
              </h1>
              <Badge
                className="inline-flex h-5 items-center rounded-full border border-tvlink-primary-border bg-tvlink-card-bg/80 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-tvlink-primary-hover hover:bg-tvlink-card-bg/80"
                variant="secondary"
              >
                v{version}
              </Badge>
            </div>
            <p className="text-xs leading-5 text-tvlink-muted-strong">{subtitle}</p>
          </div>
        </div>
      </div>
      {user && onOpenProfile ? (
        <UserAvatar isLoading={isProfileLoading} onOpenProfile={onOpenProfile} />
      ) : null}
    </header>
  );
}
