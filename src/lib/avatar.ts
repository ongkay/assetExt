import type { ExtensionUser } from "@/lib/api/extensionApiTypes";

const avatarPalette = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#059669",
  "#0891b2",
  "#ca8a04",
  "#4f46e5",
];

type AvatarIdentity = Pick<ExtensionUser, "avatarUrl" | "email" | "publicId" | "username">;

export function getAvatarColor(seed: string): string {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return avatarPalette[hash % avatarPalette.length];
}

export function getAvatarLabel(...labelCandidates: Array<string | null | undefined>): string {
  const labelSource = labelCandidates.find((candidate) => Boolean(candidate?.trim()))?.trim() ?? "A";

  return labelSource.charAt(0).toUpperCase();
}

export function getAvatarInitials(user: AvatarIdentity): string {
  const displayName = user.username.trim() || user.email.trim() || user.publicId.trim();

  if (!displayName) {
    return "TV";
  }

  return displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase() ?? "")
    .join("");
}

export function resolveAvatarImageUrl(user: AvatarIdentity): string {
  if (user.avatarUrl) {
    return user.avatarUrl;
  }

  const avatarLabel = getAvatarLabel(user.username, user.email, user.publicId);
  const avatarSeed = user.publicId || user.username || user.email || avatarLabel;

  return createFallbackAvatarUrl(avatarSeed, avatarLabel);
}

export function getAvatarFallbackStyle(user: AvatarIdentity): { backgroundColor: string; color: string } {
  const avatarSeed = user.publicId || user.username || user.email || "TvLink";

  return {
    backgroundColor: getAvatarColor(avatarSeed),
    color: "#ffffff",
  };
}

function createFallbackAvatarUrl(seed: string, label: string): string {
  const backgroundColor = getAvatarColor(seed);
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="${backgroundColor}"/><text x="24" y="24" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700">${escapeHtml(label)}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
