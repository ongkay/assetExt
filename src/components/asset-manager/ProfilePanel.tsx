import { ArrowLeftIcon, LogOutIcon, MailIcon, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ExtensionUser } from "@/lib/api/extensionApiTypes";

type ProfilePanelProps = {
  isLoggingOut?: boolean;
  onBack: () => void;
  onLogout: () => void | Promise<void>;
  user: ExtensionUser;
};

export function ProfilePanel({
  isLoggingOut = false,
  onBack,
  onLogout,
  user,
}: ProfilePanelProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {user.avatarUrl ? (
                <AvatarImage alt={user.username} src={user.avatarUrl} />
              ) : null}
              <AvatarFallback>{getProfileInitials(user)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle>{user.username}</CardTitle>
              <CardDescription>{user.publicId}</CardDescription>
            </div>
          </div>
          <Button
            aria-label="Kembali"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onBack}
          >
            <ArrowLeftIcon data-icon="inline-start" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserIcon />
            <span>{user.id}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MailIcon />
            <span>{user.email}</span>
          </div>
        </div>
        <Button
          disabled={isLoggingOut}
          type="button"
          variant="destructive"
          onClick={() => void onLogout()}
        >
          {isLoggingOut ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <LogOutIcon data-icon="inline-start" />
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
