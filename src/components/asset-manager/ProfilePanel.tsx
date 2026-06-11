import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeftIcon, LogOutIcon, MailIcon, MoonIcon, PenIcon, SunIcon } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { getAvatarFallbackStyle, getAvatarInitials } from "@/lib/avatar";
import type { ExtensionUser } from "@/lib/api/extensionApiTypes";
import type { ThemePreference } from "@/lib/theme";

type ProfilePanelProps = {
  avatarPreviewDataUrl?: string | null;
  avatarUploadErrorMessage?: string | null;
  avatarUploadSuccessMessage?: string | null;
  avatarButtonLabel?: string;
  isLoggingOut?: boolean;
  isUploadingAvatar?: boolean;
  onAvatarButtonClick?: () => void;
  onAvatarUpload?: (file: File) => void;
  onBack: () => void;
  onLogout: () => void | Promise<void>;
  onThemeChange: (theme: ThemePreference) => void;
  theme: ThemePreference;
  user: ExtensionUser;
};

export function ProfilePanel({
  avatarPreviewDataUrl = null,
  avatarUploadErrorMessage = null,
  avatarUploadSuccessMessage = null,
  avatarButtonLabel = "Ganti avatar",
  isLoggingOut = false,
  isUploadingAvatar = false,
  onAvatarButtonClick,
  onAvatarUpload,
  onBack,
  onLogout,
  onThemeChange,
  theme,
  user,
}: ProfilePanelProps) {
  const avatarFallbackStyle = getAvatarFallbackStyle(user);
  const avatarInputId = useId();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isAvatarImageBroken, setIsAvatarImageBroken] = useState(false);
  const avatarImageSource = avatarPreviewDataUrl ?? user.avatarUrl;
  const isAvatarUploadEnabled = Boolean(onAvatarUpload);

  useEffect(() => {
    setIsAvatarImageBroken(false);
  }, [avatarImageSource]);

  const shouldRenderAvatarImage = Boolean(avatarImageSource) && !isAvatarImageBroken;

  return (
    <div className="flex min-h-[550px] flex-col">
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-tvlink-app-border pb-4">
        <div className="flex items-center gap-3">
          <button
            aria-label="Kembali ke home"
            className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/80 bg-white/90 text-tvlink-text-strong shadow-sm backdrop-blur transition duration-200 hover:-translate-x-0.5 hover:border-tvlink-primary-border hover:bg-tvlink-primary-soft hover:text-tvlink-primary-hover hover:shadow-tvlink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tvlink-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-x-0 dark:border-tvlink-app-border dark:bg-tvlink-card-bg/90 dark:focus-visible:ring-offset-tvlink-card-bg"
            type="button"
            onClick={onBack}
          >
            <ArrowLeftIcon className="h-4 w-4" strokeWidth={2.2} />
          </button>

          <h1 className="text-lg font-extrabold leading-none tracking-wide text-tvlink-text-strong">
            Profile
          </h1>
        </div>

        <button
          aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/80 bg-white/90 px-3 text-tvlink-text-strong shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-tvlink-primary-border hover:bg-tvlink-primary-soft hover:text-tvlink-primary-hover hover:shadow-tvlink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tvlink-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-0 dark:border-tvlink-app-border dark:bg-tvlink-card-bg/90 dark:focus-visible:ring-offset-tvlink-card-bg"
          type="button"
          onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>
      </header>

      <section
        aria-labelledby="profile-title"
        className="mb-4 overflow-hidden rounded-[18px] border border-tvlink-panel-border bg-tvlink-card-bg shadow-[0_18px_36px_rgba(22,50,74,0.1)] dark:shadow-[0_20px_36px_rgba(0,0,0,0.26)]"
      >
        <h2 className="sr-only" id="profile-title">
          User profile
        </h2>

        <div className="tvlink-profile-card-hero relative h-[142px] overflow-hidden">
          <div
            className="tvlink-profile-orb pointer-events-none absolute -left-8 top-6 h-28 w-28 rounded-full border border-white/70 bg-white/45 blur-[1px]"
            style={{
              ["--orb-duration" as string]: "9s",
              ["--orb-scale" as string]: "1.08",
              ["--orb-x" as string]: "16px",
              ["--orb-y" as string]: "8px",
            }}
          />
          <div
            className="tvlink-profile-orb pointer-events-none absolute -right-7 -top-6 h-24 w-24 rounded-full border border-white/60 bg-tvlink-primary/10 blur-[0.5px]"
            style={{
              ["--orb-duration" as string]: "11s",
              ["--orb-scale" as string]: "1.12",
              ["--orb-x" as string]: "-14px",
              ["--orb-y" as string]: "18px",
            }}
          />
          <div
            className="tvlink-profile-orb pointer-events-none absolute bottom-5 right-8 h-10 w-10 rounded-full border border-white/70 bg-white/35"
            style={{
              ["--orb-duration" as string]: "8s",
              ["--orb-scale" as string]: "0.92",
              ["--orb-x" as string]: "-10px",
              ["--orb-y" as string]: "-14px",
            }}
          />
          <div
            className="tvlink-profile-orb pointer-events-none absolute bottom-9 left-10 h-3 w-3 rounded-full bg-tvlink-primary/25"
            style={{
              ["--orb-duration" as string]: "7s",
              ["--orb-scale" as string]: "1.4",
              ["--orb-x" as string]: "18px",
              ["--orb-y" as string]: "-8px",
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/80 dark:bg-white/12" />
        </div>

        <div className="relative bg-[linear-gradient(180deg,var(--tvlink-card-bg)_0%,var(--tvlink-surface-soft)_100%)] px-5 pb-5 pt-[72px] text-center">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <button
              aria-label={avatarButtonLabel}
              className="group relative h-[118px] w-[118px] rounded-full border-[5px] border-white text-[42px] font-extrabold uppercase text-white shadow-[0_18px_34px_rgba(0,156,255,0.18)] ring-1 ring-tvlink-primary-border/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(0,156,255,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tvlink-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0 dark:border-tvlink-card-bg dark:focus-visible:ring-offset-tvlink-card-bg"
              disabled={isUploadingAvatar || (!isAvatarUploadEnabled && !onAvatarButtonClick)}
              style={avatarFallbackStyle}
              type="button"
              onClick={() => {
                if (onAvatarUpload) {
                  avatarInputRef.current?.click();
                  return;
                }

                onAvatarButtonClick?.();
              }}
            >
              {shouldRenderAvatarImage ? (
                <img
                  alt={`Avatar ${user.username}`}
                  className="h-full w-full rounded-full object-cover"
                  src={avatarImageSource ?? undefined}
                  onError={() => setIsAvatarImageBroken(true)}
                />
              ) : (
                <span className="grid h-full w-full place-items-center rounded-full">
                  {getAvatarInitials(user)}
                </span>
              )}

              {isUploadingAvatar ? (
                <span className="absolute inset-0 grid rounded-full bg-slate-950/22 backdrop-blur-[1px]">
                  <Spinner className="m-auto h-5 w-5 text-white" />
                </span>
              ) : null}

              <span className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full border-[3px] border-white bg-white text-tvlink-primary shadow-[0_10px_18px_rgba(0,156,255,0.22)] transition duration-200 group-hover:bg-tvlink-primary group-hover:text-white dark:border-tvlink-card-bg dark:bg-tvlink-card-bg dark:text-tvlink-primary">
                <PenIcon className="h-3.5 w-3.5" />
              </span>
            </button>

            {onAvatarUpload ? (
              <input
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id={avatarInputId}
                ref={avatarInputRef}
                type="file"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];

                  if (!selectedFile) {
                    return;
                  }

                  onAvatarUpload(selectedFile);
                  event.target.value = "";
                }}
              />
            ) : null}
          </div>

          <p className="mx-auto max-w-full truncate text-xl font-extrabold tracking-tight text-tvlink-text-strong">
            {user.username}
          </p>

          <div className="mx-auto mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-tvlink-primary-border/80 bg-[#f6fbff] px-3.5 py-2 text-sm font-semibold text-tvlink-muted-strong shadow-[0_8px_16px_rgba(22,50,74,0.06)] dark:bg-tvlink-primary-soft/70 dark:shadow-[0_10px_18px_rgba(0,0,0,0.18)]">
            <MailIcon className="h-3.5 w-3.5 shrink-0 text-tvlink-primary" />
            <span className="min-w-0 truncate">{user.email}</span>
          </div>
        </div>
      </section>

      {avatarUploadErrorMessage ? (
        <div className="mb-4 rounded-xl border border-tvlink-danger-border bg-tvlink-danger-bg px-4 py-3 text-sm leading-6 text-tvlink-danger">
          {avatarUploadErrorMessage}
        </div>
      ) : null}

      {avatarUploadSuccessMessage ? (
        <div className="mb-4 rounded-xl border border-tvlink-success-border bg-tvlink-success-bg px-4 py-3 text-sm leading-6 text-tvlink-success">
          {avatarUploadSuccessMessage}
        </div>
      ) : null}

      <footer className="mt-auto border-t border-tvlink-app-border pt-4">
        <button
          className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-tvlink-danger-bg text-sm font-semibold text-tvlink-danger shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:bg-tvlink-danger-hover-bg hover:text-tvlink-danger-hover hover:shadow-tvlink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 dark:border-tvlink-danger-border dark:focus-visible:ring-offset-tvlink-card-bg"
          disabled={isLoggingOut}
          type="button"
          onClick={() => void onLogout()}
        >
          {isLoggingOut ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <LogOutIcon
              className="h-4 w-4 transition duration-200 group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          )}
          <span>Logout</span>
        </button>
      </footer>
    </div>
  );
}
