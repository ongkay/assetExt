export type TvMenuMode = "default" | "restricted";

export type TvOverrideState = {
  avatarAlt: string | null;
  avatarSrc: string | null;
  menuMode: TvMenuMode;
  publicId: string | null;
};

export type TvLogoutStatus = "idle" | "loading" | "success" | "error";
