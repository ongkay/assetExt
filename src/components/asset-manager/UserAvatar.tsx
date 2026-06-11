import { UserIcon } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

type UserAvatarProps = {
  isLoading?: boolean;
  onOpenProfile: () => void;
};

export function UserAvatar({ isLoading = false, onOpenProfile }: UserAvatarProps) {
  return (
    <button
      aria-label="Buka profil pengguna"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,248,255,0.96)_100%)] text-tvlink-text-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_12px_24px_rgba(22,50,74,0.14)] ring-1 ring-white/55 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-tvlink-primary-border hover:bg-[linear-gradient(180deg,#ffffff_0%,#eaf7ff_100%)] hover:text-tvlink-primary-hover hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_16px_28px_rgba(0,156,255,0.18)] hover:ring-tvlink-primary-border/55 dark:border-tvlink-app-border dark:bg-[linear-gradient(180deg,rgba(25,52,73,0.96)_0%,rgba(18,39,57,0.98)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_24px_rgba(0,0,0,0.24)] dark:ring-white/8 dark:hover:bg-[linear-gradient(180deg,rgba(30,60,84,0.98)_0%,rgba(20,44,64,1)_100%)] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_18px_28px_rgba(0,156,255,0.16)] dark:hover:ring-tvlink-primary-border/40"
      disabled={isLoading}
      type="button"
      onClick={onOpenProfile}
    >
      {isLoading ? <Spinner /> : <UserIcon className="h-[18px] w-[18px]" strokeWidth={2.15} />}
    </button>
  );
}
