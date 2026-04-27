import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ExtensionUser } from "@/lib/api/extensionApiTypes";

type UserAvatarProps = {
  isLoading?: boolean;
  onOpenProfile: () => void;
  user: ExtensionUser;
};

export function UserAvatar({ isLoading = false, onOpenProfile, user }: UserAvatarProps) {
  return (
    <Button
      aria-label="Buka profile user"
      disabled={isLoading}
      size="icon-sm"
      type="button"
      variant="ghost"
      onClick={onOpenProfile}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <Avatar size="sm">
          {user.avatarUrl ? <AvatarImage alt={user.username} src={user.avatarUrl} /> : null}
          <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
        </Avatar>
      )}
    </Button>
  );
}

function getUserInitials(user: ExtensionUser): string {
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
