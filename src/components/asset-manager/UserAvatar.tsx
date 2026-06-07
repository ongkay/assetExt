import { Spinner } from "@/components/ui/spinner";
import { getAvatarFallbackStyle, getAvatarInitials } from "@/lib/avatar";
import type { ExtensionUser } from "@/lib/api/extensionApiTypes";

type UserAvatarProps = {
  isLoading?: boolean;
  onOpenProfile: () => void;
  user: ExtensionUser;
};

export function UserAvatar({ isLoading = false, onOpenProfile, user }: UserAvatarProps) {
  const avatarFallbackStyle = getAvatarFallbackStyle(user);

  return (
    <button
      aria-label="Buka profil pengguna"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-tvlink-panel-border bg-tvlink-card-bg text-sm font-semibold shadow-tvlink-avatar transition-transform duration-150 hover:-translate-y-0.5"
      disabled={isLoading}
      type="button"
      onClick={onOpenProfile}
    >
      {isLoading ? (
        <Spinner />
      ) : user.avatarUrl ? (
        <img alt={user.username} className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} />
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-full" style={avatarFallbackStyle}>
          {getAvatarInitials(user).charAt(0) || "A"}
        </span>
      )}
    </button>
  );
}
