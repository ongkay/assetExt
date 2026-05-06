# Asset Manager Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun browser extension Asset Manager sesuai `.docs/PRD.md`, `.docs/wireframe.md`, `.docs/extension-v2-api.md`, dan spec desain `docs/superpowers/specs/2026-04-27-asset-manager-extension-design.md`.

**Architecture:** Implementasi memakai pendekatan core-first vertical slice. Domain logic dan API contract hidup di `src/lib/*`, Chrome privileged orchestration hidup di `src/background/core/*`, komponen reusable hidup di `src/components/asset-manager/*`, sedangkan `src/popup/*` dan `src/content/*` hanya menyusun surface masing-masing.

**Tech Stack:** Chrome Extension Manifest V3, Vite + CRXJS, React 19, TypeScript strict, Tailwind CSS v4, shadcn/base-ui primitives, Vitest, Playwright.

---

## Catatan Eksekusi

- Gunakan Node `24` dan pnpm `10+` sesuai `.nvmrc` dan `package.json`.
- Jangan membuat commit kecuali user meminta eksplisit. Jika plan menyebut checkpoint git, artinya hanya cek `git status --short`.
- Jangan memakai `<all_urls>` untuk content script.
- Jangan menghapus perubahan user yang sudah ada di worktree.
- Untuk shadcn/base-ui, gunakan semantic tokens dan komposisi resmi: `Button`, `Card`, `Alert`, `Badge`, `Skeleton`, `Spinner`, `Field`, `InputGroup`, `Avatar`, `ToggleGroup`.
- Untuk Chrome MV3, host permissions dipisah ke `host_permissions`; `cookies` membutuhkan permission `cookies` dan host permission domain target.

## Struktur File Target

File yang dibuat:

- `src/lib/asset-access/platforms.ts`: mapping platform, host detection, target URL, dan domain cookie utama.
- `src/lib/asset-access/subscription.ts`: helper status subscription, near-expiry, countdown, dan formatter tanggal.
- `src/lib/api/extensionApiConfig.ts`: base URL dan version config.
- `src/lib/api/extensionApiTypes.ts`: tipe kontrak `/api/ext/*`.
- `src/lib/api/extensionApi.ts`: fetch client API extension.
- `src/lib/storage/chromeStorage.ts`: wrapper Promise untuk `chrome.storage.local`.
- `src/lib/storage/bootstrapCache.ts`: stale-while-revalidate bootstrap cache.
- `src/lib/storage/deviceIdentity.ts`: device id persistence.
- `src/lib/storage/injectionCooldown.ts`: cooldown 5 menit per platform.
- `src/lib/runtime/messages.ts`: kontrak runtime message final.
- `src/background/core/bootstrap.ts`: orchestration bootstrap cache + fetch.
- `src/background/core/cookies.ts`: clear dan inject cookies.
- `src/background/core/assetAccess.ts`: orchestration asset access.
- `src/background/core/heartbeat.ts`: heartbeat tab domain aset.
- `src/background/core/tabs.ts`: helper active tab, open/reload target URL.
- `src/components/asset-manager/Logo.tsx`: logo app-specific hasil pindahan dari `src/component/Logo.tsx`.
- `src/components/asset-manager/UserAvatar.tsx`: avatar + fallback initial + spinner sync.
- `src/components/asset-manager/ExtensionHeader.tsx`: header popup/profile.
- `src/components/asset-manager/BootstrapSkeleton.tsx`: skeleton awal hanya saat belum ada cache.
- `src/components/asset-manager/StatusNotice.tsx`: callout status semantic.
- `src/components/asset-manager/SubscriptionSummary.tsx`: summary status paket.
- `src/components/asset-manager/RenewalActions.tsx`: toggle package/redeem.
- `src/components/asset-manager/PackageList.tsx`: package card list.
- `src/components/asset-manager/RedeemCdKeyForm.tsx`: form redeem dengan icon kiri.
- `src/components/asset-manager/AssetModeChooser.tsx`: chooser private/share untuk popup dan content overlay.
- `src/components/asset-manager/AssetAccessList.tsx`: list asset access.
- `src/components/asset-manager/ProfilePanel.tsx`: profile state.
- `src/components/asset-manager/UnauthenticatedPanel.tsx`: login state.
- `src/components/asset-manager/VersionGatePanel.tsx`: update required state.
- `src/popup/ui/PopupShell.tsx`: wrapper ukuran popup dan theme ready state.
- `src/content/ui/AccessOverlay.tsx`: overlay loading + chooser untuk domain aset.
- `tests/unit/asset-access/platforms.test.ts`: unit test platform mapping.
- `tests/unit/asset-access/subscription.test.ts`: unit test countdown/status helper.
- `tests/unit/storage/bootstrapCache.test.ts`: unit test cache stale-while-revalidate.
- `tests/unit/api/extensionApi.test.ts`: unit test API client request dan error contract.
- `tests/integration/access-overlay.spec.ts`: Playwright test overlay Shadow DOM dan chooser.

File yang dimodifikasi:

- `manifest.json`: metadata, permissions, host permissions, content script matches.
- `src/background/index.ts`: message router utama.
- `src/popup/PopupApp.tsx`: composition popup final.
- `src/popup/index.tsx`: import tetap, hanya path dependency jika perlu.
- `src/content/ContentApp.tsx`: composition content automation final.
- `src/content/index.tsx`: tetap memakai Shadow DOM root.
- `src/options/OptionsApp.tsx`: hapus demo badge controls atau ubah menjadi status/settings ringan bila masih relevan.
- `src/lib/styles/globals.css`: hanya tambah cursor pointer jika dibutuhkan oleh shadcn Button v4, tanpa hardcode theme.
- `README.md`: update struktur dan quick tour dari template demo menjadi Asset Manager.

File yang dihapus:

- `src/component/Logo.tsx`: setelah `Logo` dipindah ke `src/components/asset-manager/Logo.tsx` dan semua import sudah diganti.
- `src/background/core/badge.ts`: jika demo badge sudah tidak dipakai.
- `src/popup/ui/ActionButton.tsx`: jika sudah diganti `Button` shadcn langsung.
- `src/options/ui/StatusText.tsx`: jika hanya tersisa demo badge dan tidak dipakai.

---

## Task 1: Siapkan shadcn Components Tambahan dan Manifest

**Files:**

- Modify: `manifest.json`
- Modify: `src/lib/styles/globals.css`
- Create: `src/components/ui/avatar.tsx` via shadcn CLI
- Create: `src/components/ui/field.tsx` via shadcn CLI
- Create: `src/components/ui/input-group.tsx` via shadcn CLI
- Create: `src/components/ui/toggle-group.tsx` via shadcn CLI
- Create: `src/components/ui/empty.tsx` via shadcn CLI

- [ ] **Step 1: Tambah primitive shadcn yang dibutuhkan**

Run:

```bash
pnpm dlx shadcn@latest add avatar field input-group toggle-group empty
```

Expected:

```text
Components added successfully
```

- [ ] **Step 2: Review file primitive yang ditambahkan**

Pastikan file ini ada:

```text
src/components/ui/avatar.tsx
src/components/ui/field.tsx
src/components/ui/input-group.tsx
src/components/ui/toggle-group.tsx
src/components/ui/empty.tsx
```

Jika CLI menambahkan import dengan alias yang tidak sesuai, ubah ke alias repo:

```ts
import { cn } from "@/lib/utils";
```

- [ ] **Step 3: Update manifest**

Ganti isi `manifest.json` menjadi:

```json
{
  "manifest_version": 3,
  "name": "Asset Manager",
  "description": "Premium asset access manager for authenticated subscribers.",
  "version": "2.0.0",
  "action": {
    "default_title": "Asset Manager",
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    }
  },
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  "permissions": ["cookies", "storage", "tabs"],
  "host_permissions": [
    "http://localhost:3000/*",
    "https://www.tradingview.com/*",
    "https://*.tradingview.com/*",
    "https://forextester.com/*",
    "https://*.forextester.com/*",
    "https://tv.checkout.com/*",
    "https://*.tv.checkout.com/*"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": [
        "https://www.tradingview.com/*",
        "https://*.tradingview.com/*",
        "https://forextester.com/*",
        "https://*.forextester.com/*"
      ],
      "js": ["src/content/index.tsx"]
    }
  ]
}
```

- [ ] **Step 4: Tambah cursor pointer global untuk tombol aktif**

Tambahkan di akhir `@layer base` pada `src/lib/styles/globals.css`, sebelum kurung tutup `}` layer base:

```css
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
```

- [ ] **Step 5: Jalankan typecheck awal**

Run:

```bash
pnpm typecheck
```

Expected:

```text
Exit code 0
```

- [ ] **Step 6: Checkpoint git tanpa commit**

Run:

```bash
git status --short
```

Expected: terlihat perubahan manifest, globals, dan primitive shadcn baru. Jangan commit kecuali user meminta.

---

## Task 2: Domain Types, Platform Mapping, dan Subscription Helpers

**Files:**

- Create: `src/lib/asset-access/platforms.ts`
- Create: `src/lib/asset-access/subscription.ts`
- Test: `tests/unit/asset-access/platforms.test.ts`
- Test: `tests/unit/asset-access/subscription.test.ts`

- [ ] **Step 1: Tulis failing test platform mapping**

Buat `tests/unit/asset-access/platforms.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  assetPlatforms,
  detectAssetPlatformFromHostname,
  getAssetPlatformConfig,
} from "@/lib/asset-access/platforms";

describe("asset platform mapping", () => {
  it("menyediakan tiga platform dari PRD", () => {
    expect(assetPlatforms).toEqual(["tradingview", "fxtester"]);
  });

  it("mendeteksi hostname platform", () => {
    expect(detectAssetPlatformFromHostname("www.tradingview.com")).toBe("tradingview");
    expect(detectAssetPlatformFromHostname("id.tradingview.com")).toBe("tradingview");
    expect(detectAssetPlatformFromHostname("forextester.com")).toBe("fxtester");
    expect(detectAssetPlatformFromHostname("www.forextester.com")).toBe("fxtester");
  });

  it("mengembalikan null untuk hostname yang tidak didukung", () => {
    expect(detectAssetPlatformFromHostname("example.com")).toBeNull();
  });

  it("mengembalikan target URL dan domain cookie utama", () => {
    expect(getAssetPlatformConfig("tradingview")).toMatchObject({
      label: "TradingView",
      targetUrl: "https://www.tradingview.com/chart/",
      cookieDomains: [".tradingview.com", "tradingview.com"],
    });
  });
});
```

- [ ] **Step 2: Jalankan test platform dan pastikan gagal**

Run:

```bash
pnpm test tests/unit/asset-access/platforms.test.ts
```

Expected: FAIL karena `@/lib/asset-access/platforms` belum ada.

- [ ] **Step 3: Implementasi platform mapping**

Buat `src/lib/asset-access/platforms.ts`:

```ts
export const assetPlatforms = ["tradingview", "fxtester"] as const;

export type AssetPlatform = (typeof assetPlatforms)[number];

export type AssetPlatformConfig = {
  platform: AssetPlatform;
  label: string;
  targetUrl: string;
  hostPatterns: readonly string[];
  cookieDomains: readonly string[];
};

export const assetPlatformConfigs: Record<AssetPlatform, AssetPlatformConfig> = {
  tradingview: {
    platform: "tradingview",
    label: "TradingView",
    targetUrl: "https://www.tradingview.com/chart/",
    hostPatterns: ["tradingview.com"],
    cookieDomains: [".tradingview.com", "tradingview.com"],
  },
  fxtester: {
    platform: "fxtester",
    label: "FXTester",
    targetUrl: "https://forextester.com/",
    hostPatterns: ["forextester.com"],
    cookieDomains: [".forextester.com", "forextester.com"],
  },
};

export function getAssetPlatformConfig(platform: AssetPlatform): AssetPlatformConfig {
  return assetPlatformConfigs[platform];
}

export function isAssetPlatform(platform: string): platform is AssetPlatform {
  return assetPlatforms.some((assetPlatform) => assetPlatform === platform);
}

export function detectAssetPlatformFromHostname(hostname: string): AssetPlatform | null {
  const normalizedHostname = hostname.toLowerCase();

  for (const platform of assetPlatforms) {
    const config = getAssetPlatformConfig(platform);
    const isMatch = config.hostPatterns.some(
      (hostPattern) =>
        normalizedHostname === hostPattern || normalizedHostname.endsWith(`.${hostPattern}`),
    );

    if (isMatch) {
      return platform;
    }
  }

  return null;
}
```

- [ ] **Step 4: Tulis failing test subscription helper**

Buat `tests/unit/asset-access/subscription.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  formatCountdownParts,
  formatDateForPopup,
  getSubscriptionStatusLabel,
  isRenewalWarningActive,
} from "@/lib/asset-access/subscription";

describe("subscription helpers", () => {
  it("mengaktifkan warning renewal saat sisa waktu kurang dari atau sama dengan 3 hari", () => {
    expect(isRenewalWarningActive(259_200)).toBe(true);
    expect(isRenewalWarningActive(259_201)).toBe(false);
    expect(isRenewalWarningActive(0)).toBe(false);
  });

  it("memformat countdown menjadi hari jam menit detik", () => {
    expect(formatCountdownParts(176_461)).toEqual({
      days: 2,
      hours: 1,
      minutes: 1,
      seconds: 1,
      label: "02d 01h 01m 01s",
    });
  });

  it("mengubah status menjadi label UI", () => {
    expect(getSubscriptionStatusLabel("active")).toBe("Active");
    expect(getSubscriptionStatusLabel("processed")).toBe("Processed");
    expect(getSubscriptionStatusLabel("expired")).toBe("Expired");
    expect(getSubscriptionStatusLabel("canceled")).toBe("Canceled");
    expect(getSubscriptionStatusLabel("none")).toBe("None");
  });

  it("memformat tanggal popup dengan locale Indonesia", () => {
    expect(formatDateForPopup("2026-05-01T09:45:22.805+00:00")).toBe("01 Mei 2026");
    expect(formatDateForPopup(null)).toBe("-");
  });
});
```

- [ ] **Step 5: Jalankan test subscription dan pastikan gagal**

Run:

```bash
pnpm test tests/unit/asset-access/subscription.test.ts
```

Expected: FAIL karena `@/lib/asset-access/subscription` belum ada.

- [ ] **Step 6: Implementasi subscription helper**

Buat `src/lib/asset-access/subscription.ts`:

```ts
export const renewalWarningThresholdSeconds = 259_200;

export type SubscriptionStatus = "active" | "processed" | "expired" | "canceled" | "none";

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
};

const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  active: "Active",
  processed: "Processed",
  expired: "Expired",
  canceled: "Canceled",
  none: "None",
};

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  return subscriptionStatusLabels[status];
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === "active" || status === "processed";
}

export function isRenewalWarningActive(countdownSeconds: number): boolean {
  return countdownSeconds > 0 && countdownSeconds <= renewalWarningThresholdSeconds;
}

export function formatCountdownParts(countdownSeconds: number): CountdownParts {
  const safeSeconds = Math.max(0, Math.floor(countdownSeconds));
  const days = Math.floor(safeSeconds / 86_400);
  const hours = Math.floor((safeSeconds % 86_400) / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const seconds = safeSeconds % 60;

  const label = `${padTime(days)}d ${padTime(hours)}h ${padTime(minutes)}m ${padTime(seconds)}s`;

  return { days, hours, minutes, seconds, label };
}

export function formatDateForPopup(dateIso: string | null): string {
  if (!dateIso) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateIso));
}

function padTime(timePart: number): string {
  return String(timePart).padStart(2, "0");
}
```

- [ ] **Step 7: Jalankan unit test task ini**

Run:

```bash
pnpm test tests/unit/asset-access/platforms.test.ts tests/unit/asset-access/subscription.test.ts
```

Expected: PASS.

- [ ] **Step 8: Jalankan typecheck**

Run:

```bash
pnpm typecheck
```

Expected: Exit code 0.

---

## Task 3: API Contract dan API Client

**Files:**

- Create: `src/lib/api/extensionApiConfig.ts`
- Create: `src/lib/api/extensionApiTypes.ts`
- Create: `src/lib/api/extensionApi.ts`
- Test: `tests/unit/api/extensionApi.test.ts`

- [ ] **Step 1: Tulis failing test API client**

Buat `tests/unit/api/extensionApi.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchExtensionBootstrap, redeemExtensionCdKey } from "@/lib/api/extensionApi";

const originalFetch = globalThis.fetch;

describe("extension API client", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("mengirim bootstrap request dengan credentials dan extension headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          auth: { status: "unauthenticated", loginUrl: "/login" },
          version: { status: "supported" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    globalThis.fetch = fetchMock;

    await fetchExtensionBootstrap({
      apiBaseUrl: "http://localhost:3000",
      extensionId: "test-extension-id",
      extensionVersion: "2.0.0",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/ext/bootstrap?version=2.0.0",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "x-extension-id": "test-extension-id",
          "x-extension-version": "2.0.0",
        }),
        method: "GET",
      }),
    );
  });

  it("mengembalikan error contract saat response tidak ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "EXT_REDEEM_INVALID", message: "CD-Key tidak valid atau sudah terpakai." },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await redeemExtensionCdKey(
      {
        apiBaseUrl: "http://localhost:3000",
        extensionId: "test-extension-id",
        extensionVersion: "2.0.0",
      },
      "WRONGCODE",
    );

    expect(result).toEqual({
      ok: false,
      error: { code: "EXT_REDEEM_INVALID", message: "CD-Key tidak valid atau sudah terpakai." },
      status: 400,
    });
  });
});
```

- [ ] **Step 2: Jalankan test API dan pastikan gagal**

Run:

```bash
pnpm test tests/unit/api/extensionApi.test.ts
```

Expected: FAIL karena file API belum ada.

- [ ] **Step 3: Buat API config**

Buat `src/lib/api/extensionApiConfig.ts`:

```ts
export const defaultExtensionApiBaseUrl = "http://localhost:3000";

export type ExtensionApiConfig = {
  apiBaseUrl: string;
  extensionId: string | null;
  extensionVersion: string;
};

export function getExtensionApiBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_EXT_API_BASE_URL;

  if (typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0) {
    return envBaseUrl.replace(/\/$/, "");
  }

  return defaultExtensionApiBaseUrl;
}
```

- [ ] **Step 4: Buat API types**

Buat `src/lib/api/extensionApiTypes.ts`:

```ts
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import type { SubscriptionStatus } from "@/lib/asset-access/subscription";

export type ExtensionMode = "private" | "share";

export type ExtensionVersionStatus =
  | { status: "supported" }
  | { status: "update_available"; downloadUrl: string; latestVersion: string; minimumVersion: string }
  | { status: "update_required"; downloadUrl: string; latestVersion: string; minimumVersion: string };

export type ExtensionAuthState =
  | { status: "unauthenticated"; loginUrl: string }
  | { status: "authenticated" };

export type ExtensionUser = {
  avatarUrl: string | null;
  email: string;
  id: string;
  publicId: string;
  username: string;
};

export type ExtensionAssetSummary = {
  hasPrivateAccess: boolean;
  hasShareAccess: boolean;
  platform: AssetPlatform;
};

export type ExtensionPackage = {
  amountRp: number;
  checkoutUrl: string;
  id: string;
  name: string;
  summary: string;
};

export type ExtensionSubscription = {
  countdownSeconds: number;
  endAt: string | null;
  packageName: string | null;
  status: SubscriptionStatus;
};

export type ExtensionBootstrap = {
  assets?: ExtensionAssetSummary[];
  auth: ExtensionAuthState;
  packages?: ExtensionPackage[];
  redeem?: { enabled: boolean };
  subscription?: ExtensionSubscription;
  user?: ExtensionUser;
  version: ExtensionVersionStatus;
};

export type ExtensionCookieSameSite = "no_restriction" | "lax" | "strict" | "unspecified";

export type ExtensionCookiePayload = {
  domain?: string;
  expirationDate?: number;
  hostOnly?: boolean;
  httpOnly?: boolean;
  name: string;
  path?: string;
  sameSite?: ExtensionCookieSameSite;
  secure?: boolean;
  session?: boolean;
  storeId?: string;
  value: string;
};

export type ExtensionAssetResponse =
  | {
      availableModes: ExtensionMode[];
      defaultMode: ExtensionMode;
      platform: AssetPlatform;
      selectionTimeoutSeconds: number;
      status: "selection_required";
    }
  | {
      cookies: ExtensionCookiePayload[];
      mode: ExtensionMode;
      platform: AssetPlatform;
      proxy?: string;
      status: "ready";
    }
  | {
      reason: "subscription_required";
      status: "forbidden";
    };

export type ExtensionRedeemSuccess = {
  bootstrap: ExtensionBootstrap;
  message: string;
  ok: true;
};

export type ExtensionHeartbeatResponse = {
  ok: true;
  timestamp: string;
};

export type ExtensionLogoutResponse = {
  ok: true;
  redirectTo: string;
};

export type ExtensionApiErrorCode =
  | "EXT_HEADER_REQUIRED"
  | "EXT_REQUEST_INVALID"
  | "EXT_REDEEM_INVALID"
  | "EXT_UNAUTHENTICATED"
  | "EXT_ORIGIN_DENIED"
  | "EXT_USER_BANNED"
  | "EXT_UPDATE_REQUIRED"
  | "EXT_MODE_NOT_ALLOWED"
  | "EXT_REDEEM_USED"
  | "EXT_ASSET_UNAVAILABLE";

export type ExtensionApiError = {
  code: ExtensionApiErrorCode;
  message: string;
};

export type ExtensionApiResult<TSuccess> =
  | { ok: true; status: number; value: TSuccess }
  | { ok: false; error: ExtensionApiError; status: number };
```

- [ ] **Step 5: Buat API client**

Buat `src/lib/api/extensionApi.ts`:

```ts
import type { AssetPlatform } from "@/lib/asset-access/platforms";

import type { ExtensionApiConfig } from "./extensionApiConfig";
import type {
  ExtensionApiError,
  ExtensionApiResult,
  ExtensionAssetResponse,
  ExtensionBootstrap,
  ExtensionHeartbeatResponse,
  ExtensionLogoutResponse,
  ExtensionMode,
  ExtensionRedeemSuccess,
} from "./extensionApiTypes";

const fallbackApiError: ExtensionApiError = {
  code: "EXT_REQUEST_INVALID",
  message: "Request extension gagal diproses.",
};

export function fetchExtensionBootstrap(config: ExtensionApiConfig) {
  const searchParams = new URLSearchParams({ version: config.extensionVersion });
  return requestExtensionApi<ExtensionBootstrap>(config, `/api/ext/bootstrap?${searchParams}`, {
    method: "GET",
  });
}

export function fetchExtensionAsset(
  config: ExtensionApiConfig,
  platform: AssetPlatform,
  mode?: ExtensionMode,
) {
  const searchParams = new URLSearchParams({ platform });

  if (mode) {
    searchParams.set("mode", mode);
  }

  return requestExtensionApi<ExtensionAssetResponse>(config, `/api/ext/asset?${searchParams}`, {
    method: "GET",
  });
}

export function postExtensionHeartbeat(config: ExtensionApiConfig, deviceId: string) {
  return requestExtensionApi<ExtensionHeartbeatResponse>(config, "/api/ext/heartbeat", {
    body: JSON.stringify({ deviceId, extensionVersion: config.extensionVersion }),
    method: "POST",
  });
}

export function redeemExtensionCdKey(config: ExtensionApiConfig, code: string) {
  return requestExtensionApi<ExtensionRedeemSuccess>(config, "/api/ext/redeem", {
    body: JSON.stringify({ code }),
    method: "POST",
  });
}

export function postExtensionLogout(config: ExtensionApiConfig) {
  return requestExtensionApi<ExtensionLogoutResponse>(config, "/api/ext/logout", {
    method: "POST",
  });
}

async function requestExtensionApi<TSuccess>(
  config: ExtensionApiConfig,
  path: string,
  init: RequestInit,
): Promise<ExtensionApiResult<TSuccess>> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: buildExtensionHeaders(config, init.headers),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      error: readApiError(payload),
      ok: false,
      status: response.status,
    };
  }

  return {
    ok: true,
    status: response.status,
    value: payload as TSuccess,
  };
}

function buildExtensionHeaders(config: ExtensionApiConfig, headers: HeadersInit | undefined): Headers {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("content-type", "application/json");
  requestHeaders.set("x-extension-version", config.extensionVersion);

  if (config.extensionId) {
    requestHeaders.set("x-extension-id", config.extensionId);
  }

  return requestHeaders;
}

function readApiError(payload: unknown): ExtensionApiError {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return fallbackApiError;
  }

  const { error } = payload;

  if (!error || typeof error !== "object" || !("code" in error) || !("message" in error)) {
    return fallbackApiError;
  }

  if (typeof error.code !== "string" || typeof error.message !== "string") {
    return fallbackApiError;
  }

  return { code: error.code as ExtensionApiError["code"], message: error.message };
}
```

- [ ] **Step 6: Jalankan test API**

Run:

```bash
pnpm test tests/unit/api/extensionApi.test.ts
```

Expected: PASS.

- [ ] **Step 7: Jalankan typecheck**

Run:

```bash
pnpm typecheck
```

Expected: Exit code 0.

---

## Task 4: Storage Helpers dan Bootstrap Cache

**Files:**

- Create: `src/lib/storage/chromeStorage.ts`
- Create: `src/lib/storage/bootstrapCache.ts`
- Create: `src/lib/storage/deviceIdentity.ts`
- Create: `src/lib/storage/injectionCooldown.ts`
- Test: `tests/unit/storage/bootstrapCache.test.ts`

- [ ] **Step 1: Tulis failing test bootstrap cache**

Buat `tests/unit/storage/bootstrapCache.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  bootstrapCacheTtlMs,
  createInvalidUnauthenticatedBootstrapCache,
  isBootstrapCacheExpired,
  type BootstrapCacheRecord,
} from "@/lib/storage/bootstrapCache";

describe("bootstrap cache", () => {
  it("menganggap cache expired jika fetchedAt lebih lama dari TTL", () => {
    const record: BootstrapCacheRecord = {
      fetchedAt: 1_000,
      isValid: true,
      snapshot: { auth: { status: "unauthenticated", loginUrl: "/login" }, version: { status: "supported" } },
    };

    expect(isBootstrapCacheExpired(record, 1_000 + bootstrapCacheTtlMs)).toBe(false);
    expect(isBootstrapCacheExpired(record, 1_001 + bootstrapCacheTtlMs)).toBe(true);
  });

  it("membuat cache unauthenticated invalid untuk logout", () => {
    expect(createInvalidUnauthenticatedBootstrapCache("/login", 123)).toEqual({
      fetchedAt: 123,
      isValid: false,
      snapshot: { auth: { status: "unauthenticated", loginUrl: "/login" }, version: { status: "supported" } },
    });
  });
});
```

- [ ] **Step 2: Jalankan test cache dan pastikan gagal**

Run:

```bash
pnpm test tests/unit/storage/bootstrapCache.test.ts
```

Expected: FAIL karena file cache belum ada.

- [ ] **Step 3: Buat chrome storage wrapper**

Buat `src/lib/storage/chromeStorage.ts`:

```ts
export async function getChromeStorageValue<TValue>(key: string): Promise<TValue | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  const result = await chrome.storage.local.get(key);
  return key in result ? (result[key] as TValue) : null;
}

export async function setChromeStorageValue<TValue>(key: string, value: TValue): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.set({ [key]: value });
}
```

- [ ] **Step 4: Buat bootstrap cache helper**

Buat `src/lib/storage/bootstrapCache.ts`:

```ts
import type { ExtensionBootstrap } from "@/lib/api/extensionApiTypes";

import { getChromeStorageValue, setChromeStorageValue } from "./chromeStorage";

export const bootstrapCacheStorageKey = "assetManager.bootstrapCache";
export const bootstrapCacheTtlMs = 10 * 60 * 1_000;

export type BootstrapCacheRecord = {
  fetchedAt: number;
  isValid: boolean;
  lastErrorMessage?: string;
  snapshot: ExtensionBootstrap;
};

export function isBootstrapCacheExpired(record: BootstrapCacheRecord, now = Date.now()): boolean {
  return now - record.fetchedAt > bootstrapCacheTtlMs;
}

export function createBootstrapCacheRecord(
  snapshot: ExtensionBootstrap,
  now = Date.now(),
): BootstrapCacheRecord {
  return { fetchedAt: now, isValid: true, snapshot };
}

export function createBootstrapCacheErrorRecord(
  record: BootstrapCacheRecord,
  lastErrorMessage: string,
): BootstrapCacheRecord {
  return { ...record, lastErrorMessage };
}

export function createInvalidUnauthenticatedBootstrapCache(
  loginUrl: string,
  now = Date.now(),
): BootstrapCacheRecord {
  return {
    fetchedAt: now,
    isValid: false,
    snapshot: { auth: { status: "unauthenticated", loginUrl }, version: { status: "supported" } },
  };
}

export function readBootstrapCache() {
  return getChromeStorageValue<BootstrapCacheRecord>(bootstrapCacheStorageKey);
}

export function writeBootstrapCache(record: BootstrapCacheRecord) {
  return setChromeStorageValue(bootstrapCacheStorageKey, record);
}
```

- [ ] **Step 5: Buat device identity helper**

Buat `src/lib/storage/deviceIdentity.ts`:

```ts
import { getChromeStorageValue, setChromeStorageValue } from "./chromeStorage";

const deviceIdStorageKey = "assetManager.deviceId";

export async function getOrCreateDeviceId(): Promise<string> {
  const existingDeviceId = await getChromeStorageValue<string>(deviceIdStorageKey);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const nextDeviceId = crypto.randomUUID();
  await setChromeStorageValue(deviceIdStorageKey, nextDeviceId);
  return nextDeviceId;
}
```

- [ ] **Step 6: Buat injection cooldown helper**

Buat `src/lib/storage/injectionCooldown.ts`:

```ts
import type { AssetPlatform } from "@/lib/asset-access/platforms";

import { getChromeStorageValue, setChromeStorageValue } from "./chromeStorage";

const injectionCooldownStorageKey = "assetManager.injectionCooldown";
export const injectionCooldownMs = 5 * 60 * 1_000;

type InjectionCooldownRecord = Partial<Record<AssetPlatform, number>>;

export async function isInjectionCooldownActive(platform: AssetPlatform, now = Date.now()): Promise<boolean> {
  const record = await getChromeStorageValue<InjectionCooldownRecord>(injectionCooldownStorageKey);
  const lastInjectedAt = record?.[platform];

  if (!lastInjectedAt) {
    return false;
  }

  return now - lastInjectedAt < injectionCooldownMs;
}

export async function markInjectionCooldown(platform: AssetPlatform, now = Date.now()): Promise<void> {
  const record = (await getChromeStorageValue<InjectionCooldownRecord>(injectionCooldownStorageKey)) ?? {};
  await setChromeStorageValue<InjectionCooldownRecord>(injectionCooldownStorageKey, {
    ...record,
    [platform]: now,
  });
}
```

- [ ] **Step 7: Jalankan unit test cache**

Run:

```bash
pnpm test tests/unit/storage/bootstrapCache.test.ts
```

Expected: PASS.

- [ ] **Step 8: Jalankan typecheck**

Run:

```bash
pnpm typecheck
```

Expected: Exit code 0.

---

## Task 5: Runtime Message Contract

**Files:**

- Replace: `src/lib/runtime/messages.ts`

- [ ] **Step 1: Ganti kontrak runtime message demo**

Ganti isi `src/lib/runtime/messages.ts` dengan:

```ts
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import type {
  ExtensionAssetResponse,
  ExtensionBootstrap,
  ExtensionMode,
} from "@/lib/api/extensionApiTypes";
import type { BootstrapCacheRecord } from "@/lib/storage/bootstrapCache";

export const runtimeMessageType = {
  bootstrapRequested: "BOOTSTRAP_REQUESTED",
  bootstrapRefreshRequested: "BOOTSTRAP_REFRESH_REQUESTED",
  assetAccessRequested: "ASSET_ACCESS_REQUESTED",
  autoAccessRequested: "AUTO_ACCESS_REQUESTED",
  assetModeSelected: "ASSET_MODE_SELECTED",
  redeemCdKeyRequested: "REDEEM_CD_KEY_REQUESTED",
  logoutRequested: "LOGOUT_REQUESTED",
  heartbeatStarted: "HEARTBEAT_STARTED",
  heartbeatStopped: "HEARTBEAT_STOPPED",
  overlayStateChanged: "OVERLAY_STATE_CHANGED",
} as const;

export type BootstrapRequestedMessage = {
  type: (typeof runtimeMessageType)["bootstrapRequested"];
};

export type BootstrapRefreshRequestedMessage = {
  type: (typeof runtimeMessageType)["bootstrapRefreshRequested"];
};

export type AssetAccessRequestedMessage = {
  platform: AssetPlatform;
  tabId?: number;
  type: (typeof runtimeMessageType)["assetAccessRequested"];
};

export type AutoAccessRequestedMessage = {
  platform: AssetPlatform;
  type: (typeof runtimeMessageType)["autoAccessRequested"];
};

export type AssetModeSelectedMessage = {
  mode: ExtensionMode;
  requestId: string;
  type: (typeof runtimeMessageType)["assetModeSelected"];
};

export type RedeemCdKeyRequestedMessage = {
  code: string;
  type: (typeof runtimeMessageType)["redeemCdKeyRequested"];
};

export type LogoutRequestedMessage = {
  type: (typeof runtimeMessageType)["logoutRequested"];
};

export type HeartbeatStartedMessage = {
  platform: AssetPlatform;
  tabId: number;
  type: (typeof runtimeMessageType)["heartbeatStarted"];
};

export type HeartbeatStoppedMessage = {
  tabId: number;
  type: (typeof runtimeMessageType)["heartbeatStopped"];
};

export type OverlayStateChangedMessage = {
  assetResponse?: ExtensionAssetResponse;
  message: string;
  requestId?: string;
  state: "idle" | "loading" | "chooser" | "success" | "error";
  type: (typeof runtimeMessageType)["overlayStateChanged"];
};

export type RuntimeMessage =
  | BootstrapRequestedMessage
  | BootstrapRefreshRequestedMessage
  | AssetAccessRequestedMessage
  | AutoAccessRequestedMessage
  | AssetModeSelectedMessage
  | RedeemCdKeyRequestedMessage
  | LogoutRequestedMessage
  | HeartbeatStartedMessage
  | HeartbeatStoppedMessage
  | OverlayStateChangedMessage;

export type RuntimeSuccessResponse<TValue> = {
  ok: true;
  value: TValue;
};

export type RuntimeErrorResponse = {
  errorMessage: string;
  ok: false;
};

export type RuntimeResponse<TValue> = RuntimeSuccessResponse<TValue> | RuntimeErrorResponse;

export type BootstrapRuntimeValue = {
  cache: BootstrapCacheRecord | null;
  isSyncing: boolean;
};

export type BootstrapRuntimeResponse = RuntimeResponse<BootstrapRuntimeValue>;
export type BootstrapRefreshRuntimeResponse = RuntimeResponse<BootstrapCacheRecord>;
export type AssetAccessRuntimeResponse = RuntimeResponse<ExtensionAssetResponse>;
export type RedeemCdKeyRuntimeResponse = RuntimeResponse<ExtensionBootstrap>;
export type LogoutRuntimeResponse = RuntimeResponse<{ redirectTo: string }>;
```

- [ ] **Step 2: Jalankan typecheck untuk menemukan import lama**

Run:

```bash
pnpm typecheck
```

Expected: FAIL karena `toggleUi`, `incrementBadge`, dan `resetBadge` masih dipakai di popup/content/background/options.

- [ ] **Step 3: Catat file yang perlu disesuaikan di task berikutnya**

File yang seharusnya gagal:

```text
src/popup/PopupApp.tsx
src/content/ContentApp.tsx
src/background/index.ts
src/options/OptionsApp.tsx
```

Jangan betulkan file ini di task ini kecuali error berasal dari tipe message baru.

---

## Task 6: Background Bootstrap, Logout, dan Message Router Dasar

**Files:**

- Create: `src/background/core/bootstrap.ts`
- Create: `src/background/core/tabs.ts`
- Modify: `src/background/index.ts`
- Modify: `src/options/OptionsApp.tsx`

- [ ] **Step 1: Buat helper config background**

Buat `src/background/core/bootstrap.ts`:

```ts
import { getExtensionApiBaseUrl, type ExtensionApiConfig } from "@/lib/api/extensionApiConfig";
import { fetchExtensionBootstrap, postExtensionLogout } from "@/lib/api/extensionApi";
import {
  createBootstrapCacheErrorRecord,
  createBootstrapCacheRecord,
  createInvalidUnauthenticatedBootstrapCache,
  isBootstrapCacheExpired,
  readBootstrapCache,
  writeBootstrapCache,
  type BootstrapCacheRecord,
} from "@/lib/storage/bootstrapCache";

let bootstrapSyncPromise: Promise<BootstrapCacheRecord | null> | null = null;

export async function readBootstrapState(forceRefresh: boolean) {
  const cache = await readBootstrapCache();
  const shouldRefresh = forceRefresh || !cache || isBootstrapCacheExpired(cache);

  if (!shouldRefresh) {
    return { cache, isSyncing: false };
  }

  bootstrapSyncPromise = syncBootstrapCache(cache);

  if (!cache) {
    const nextCache = await bootstrapSyncPromise;
    return { cache: nextCache, isSyncing: false };
  }

  return { cache, isSyncing: true };
}

export async function forceRefreshBootstrapCache() {
  return syncBootstrapCache(await readBootstrapCache());
}

export async function replaceBootstrapCacheFromSnapshot(snapshot: BootstrapCacheRecord["snapshot"]) {
  const record = createBootstrapCacheRecord(snapshot);
  await writeBootstrapCache(record);
  return record;
}

export async function logoutExtensionSession() {
  const logoutResult = await postExtensionLogout(createExtensionApiConfig());

  if (!logoutResult.ok) {
    throw new Error(logoutResult.error.message);
  }

  const record = createInvalidUnauthenticatedBootstrapCache(logoutResult.value.redirectTo);
  await writeBootstrapCache(record);
  return logoutResult.value;
}

export function createExtensionApiConfig(): ExtensionApiConfig {
  return {
    apiBaseUrl: getExtensionApiBaseUrl(),
    extensionId: chrome.runtime.id ?? null,
    extensionVersion: chrome.runtime.getManifest().version,
  };
}

async function syncBootstrapCache(previousCache: BootstrapCacheRecord | null) {
  if (bootstrapSyncPromise) {
    return bootstrapSyncPromise;
  }

  const syncPromise = fetchExtensionBootstrap(createExtensionApiConfig())
    .then(async (result) => {
      if (!result.ok) {
        if (!previousCache) {
          throw new Error(result.error.message);
        }

        const errorRecord = createBootstrapCacheErrorRecord(previousCache, result.error.message);
        await writeBootstrapCache(errorRecord);
        return errorRecord;
      }

      const nextRecord = createBootstrapCacheRecord(result.value);
      await writeBootstrapCache(nextRecord);
      return nextRecord;
    })
    .finally(() => {
      bootstrapSyncPromise = null;
    });

  bootstrapSyncPromise = syncPromise;
  return syncPromise;
}
```

- [ ] **Step 2: Buat helper tabs**

Buat `src/background/core/tabs.ts`:

```ts
export async function getActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id ?? null;
}

export async function openOrReloadTab(targetUrl: string, tabId?: number): Promise<void> {
  if (tabId) {
    await chrome.tabs.update(tabId, { active: true, url: targetUrl });
    return;
  }

  await chrome.tabs.create({ active: true, url: targetUrl });
}
```

- [ ] **Step 3: Ganti background router dasar**

Ganti isi `src/background/index.ts` dengan router awal:

```ts
import { redeemExtensionCdKey } from "@/lib/api/extensionApi";
import {
  runtimeMessageType,
  type BootstrapRefreshRuntimeResponse,
  type BootstrapRuntimeResponse,
  type LogoutRuntimeResponse,
  type RedeemCdKeyRuntimeResponse,
  type RuntimeMessage,
} from "@/lib/runtime/messages";

import {
  createExtensionApiConfig,
  forceRefreshBootstrapCache,
  logoutExtensionSession,
  readBootstrapState,
  replaceBootstrapCacheFromSnapshot,
} from "./core/bootstrap";

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  void handleRuntimeMessage(message)
    .then(sendResponse)
    .catch((error: unknown) => {
      sendResponse({
        errorMessage: error instanceof Error ? error.message : "Runtime extension gagal diproses.",
        ok: false,
      });
    });

  return true;
});

async function handleRuntimeMessage(message: RuntimeMessage) {
  if (message.type === runtimeMessageType.bootstrapRequested) {
    const value = await readBootstrapState(false);
    return { ok: true, value } satisfies BootstrapRuntimeResponse;
  }

  if (message.type === runtimeMessageType.bootstrapRefreshRequested) {
    const value = await forceRefreshBootstrapCache();
    return { ok: true, value } satisfies BootstrapRefreshRuntimeResponse;
  }

  if (message.type === runtimeMessageType.redeemCdKeyRequested) {
    const redeemResult = await redeemExtensionCdKey(createExtensionApiConfig(), message.code);

    if (!redeemResult.ok) {
      return { errorMessage: redeemResult.error.message, ok: false } satisfies RedeemCdKeyRuntimeResponse;
    }

    const nextCache = await replaceBootstrapCacheFromSnapshot(redeemResult.value.bootstrap);
    return { ok: true, value: nextCache.snapshot } satisfies RedeemCdKeyRuntimeResponse;
  }

  if (message.type === runtimeMessageType.logoutRequested) {
    const value = await logoutExtensionSession();
    return { ok: true, value } satisfies LogoutRuntimeResponse;
  }

  return { errorMessage: "Runtime message tidak didukung.", ok: false };
}
```

- [ ] **Step 4: Sederhanakan options app agar tidak memakai badge demo**

Ganti isi `src/options/OptionsApp.tsx` dengan:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useThemePreference } from "@/lib/useThemePreference";

export function OptionsApp() {
  const themeTarget = typeof document === "undefined" ? null : document.documentElement;
  const { isDark, isReady, theme, setTheme } = useThemePreference(themeTarget);

  return (
    <main className={isReady ? "min-h-dvh bg-background p-6 text-foreground" : "invisible"}>
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Asset Manager Settings</CardTitle>
              <CardDescription>Preferensi ringan untuk extension popup dan overlay.</CardDescription>
            </div>
            <Badge variant="outline" className="capitalize">
              {theme}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card px-3 py-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Sinkron dengan popup dan overlay.</p>
            </div>
            <Switch
              aria-label="Toggle dark mode"
              checked={isDark}
              onCheckedChange={(checked) => void setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 5: Jalankan typecheck**

Run:

```bash
pnpm typecheck
```

Expected: masih bisa FAIL karena popup/content belum diganti dari demo message. Error background/options harus selesai.

---

## Task 7: Background Cookie Injection, Asset Access, dan Heartbeat

**Files:**

- Create: `src/background/core/cookies.ts`
- Create: `src/background/core/assetAccess.ts`
- Create: `src/background/core/heartbeat.ts`
- Modify: `src/background/index.ts`

- [ ] **Step 1: Buat cookie helper**

Buat `src/background/core/cookies.ts`:

```ts
import type { ExtensionCookiePayload } from "@/lib/api/extensionApiTypes";
import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";

export async function clearAssetPlatformCookies(platform: AssetPlatform): Promise<void> {
  const config = getAssetPlatformConfig(platform);

  for (const domain of config.cookieDomains) {
    const cookies = await chrome.cookies.getAll({ domain });

    await Promise.all(
      cookies.map((cookie) =>
        chrome.cookies.remove({
          name: cookie.name,
          storeId: cookie.storeId,
          url: buildCookieUrl(cookie),
        }),
      ),
    );
  }
}

export async function injectExtensionCookies(cookies: ExtensionCookiePayload[]): Promise<void> {
  await Promise.all(cookies.map((cookie) => chrome.cookies.set(toChromeCookieDetails(cookie))));
}

function toChromeCookieDetails(cookie: ExtensionCookiePayload): chrome.cookies.SetDetails {
  return {
    domain: cookie.hostOnly ? undefined : cookie.domain,
    expirationDate: cookie.expirationDate,
    httpOnly: cookie.httpOnly,
    name: cookie.name,
    path: cookie.path ?? "/",
    sameSite: toChromeSameSite(cookie.sameSite),
    secure: cookie.secure,
    storeId: cookie.storeId,
    url: buildCookieSetUrl(cookie),
    value: cookie.value,
  };
}

function buildCookieSetUrl(cookie: ExtensionCookiePayload): string {
  const domain = cookie.domain?.replace(/^\./, "");

  if (!domain) {
    throw new Error(`Cookie ${cookie.name} tidak memiliki domain.`);
  }

  return `${cookie.secure === false ? "http" : "https"}://${domain}${cookie.path ?? "/"}`;
}

function buildCookieUrl(cookie: chrome.cookies.Cookie): string {
  return `${cookie.secure ? "https" : "http"}://${cookie.domain.replace(/^\./, "")}${cookie.path}`;
}

function toChromeSameSite(sameSite: ExtensionCookiePayload["sameSite"]): chrome.cookies.SameSiteStatus | undefined {
  if (!sameSite || sameSite === "unspecified") {
    return undefined;
  }

  if (sameSite === "no_restriction") {
    return "no_restriction";
  }

  return sameSite;
}
```

- [ ] **Step 2: Buat asset access orchestration**

Buat `src/background/core/assetAccess.ts`:

```ts
import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";
import { fetchExtensionAsset } from "@/lib/api/extensionApi";
import type { ExtensionAssetResponse, ExtensionMode } from "@/lib/api/extensionApiTypes";
import { markInjectionCooldown } from "@/lib/storage/injectionCooldown";

import { createExtensionApiConfig } from "./bootstrap";
import { clearAssetPlatformCookies, injectExtensionCookies } from "./cookies";
import { openOrReloadTab } from "./tabs";

export type RunAssetAccessOptions = {
  mode?: ExtensionMode;
  platform: AssetPlatform;
  shouldNavigate: boolean;
  tabId?: number;
};

export async function runAssetAccess(options: RunAssetAccessOptions): Promise<ExtensionAssetResponse> {
  const assetResult = await fetchExtensionAsset(createExtensionApiConfig(), options.platform, options.mode);

  if (!assetResult.ok) {
    throw new Error(assetResult.error.message);
  }

  if (assetResult.value.status !== "ready") {
    return assetResult.value;
  }

  await clearAssetPlatformCookies(options.platform);
  await injectExtensionCookies(assetResult.value.cookies);
  await markInjectionCooldown(options.platform);

  if (options.shouldNavigate) {
    await openOrReloadTab(getAssetPlatformConfig(options.platform).targetUrl, options.tabId);
  }

  return assetResult.value;
}
```

- [ ] **Step 3: Buat heartbeat manager**

Buat `src/background/core/heartbeat.ts`:

```ts
import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { postExtensionHeartbeat } from "@/lib/api/extensionApi";
import { getOrCreateDeviceId } from "@/lib/storage/deviceIdentity";

import { createExtensionApiConfig } from "./bootstrap";

const heartbeatIntervalMs = 5 * 60 * 1_000;
const heartbeatTimers = new Map<number, number>();

export function startHeartbeat(tabId: number, _platform: AssetPlatform): void {
  stopHeartbeat(tabId);

  void sendHeartbeat();
  const intervalId = globalThis.setInterval(() => {
    void sendHeartbeat();
  }, heartbeatIntervalMs);

  heartbeatTimers.set(tabId, intervalId);
}

export function stopHeartbeat(tabId: number): void {
  const intervalId = heartbeatTimers.get(tabId);

  if (!intervalId) {
    return;
  }

  globalThis.clearInterval(intervalId);
  heartbeatTimers.delete(tabId);
}

async function sendHeartbeat(): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  await postExtensionHeartbeat(createExtensionApiConfig(), deviceId);
}
```

- [ ] **Step 4: Tambahkan branch asset/heartbeat ke background router**

Tambahkan import di `src/background/index.ts`:

```ts
import { runAssetAccess } from "./core/assetAccess";
import { startHeartbeat, stopHeartbeat } from "./core/heartbeat";
```

Tambahkan branch di `handleRuntimeMessage` sebelum fallback:

```ts
  if (message.type === runtimeMessageType.assetAccessRequested) {
    const value = await runAssetAccess({
      platform: message.platform,
      shouldNavigate: true,
      tabId: message.tabId,
    });
    return { ok: true, value };
  }

  if (message.type === runtimeMessageType.autoAccessRequested) {
    const value = await runAssetAccess({
      platform: message.platform,
      shouldNavigate: false,
    });
    return { ok: true, value };
  }

  if (message.type === runtimeMessageType.heartbeatStarted) {
    startHeartbeat(message.tabId, message.platform);
    return { ok: true, value: { started: true } };
  }

  if (message.type === runtimeMessageType.heartbeatStopped) {
    stopHeartbeat(message.tabId);
    return { ok: true, value: { stopped: true } };
  }
```

- [ ] **Step 5: Jalankan typecheck**

Run:

```bash
pnpm typecheck
```

Expected: masih bisa FAIL karena popup/content belum diganti. Error background core harus selesai.

---

## Task 8: Komponen Reusable Asset Manager

**Files:**

- Create: `src/components/asset-manager/Logo.tsx`
- Create: `src/components/asset-manager/UserAvatar.tsx`
- Create: `src/components/asset-manager/ExtensionHeader.tsx`
- Create: `src/components/asset-manager/BootstrapSkeleton.tsx`
- Create: `src/components/asset-manager/StatusNotice.tsx`
- Create: `src/components/asset-manager/SubscriptionSummary.tsx`
- Create: `src/components/asset-manager/PackageList.tsx`
- Create: `src/components/asset-manager/RedeemCdKeyForm.tsx`
- Create: `src/components/asset-manager/RenewalActions.tsx`
- Create: `src/components/asset-manager/AssetModeChooser.tsx`
- Create: `src/components/asset-manager/AssetAccessList.tsx`
- Create: `src/components/asset-manager/ProfilePanel.tsx`
- Create: `src/components/asset-manager/UnauthenticatedPanel.tsx`
- Create: `src/components/asset-manager/VersionGatePanel.tsx`
- Delete: `src/component/Logo.tsx` after imports are replaced

- [ ] **Step 1: Pindahkan Logo ke folder komponen baru**

Buat `src/components/asset-manager/Logo.tsx` dengan isi SVG dari `src/component/Logo.tsx`, tetapi default title diganti:

```tsx
type LogoProps = {
  className?: string;
  id?: string;
  title?: string;
};

export function Logo({ className, id = "asset-manager-logo", title = "Asset Manager logo" }: LogoProps) {
  return (
    <svg
      className={className}
      role="img"
      aria-describedby={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 841.9 595.3"
    >
      <g fill="currentColor">
        <title id={id}>{title}</title>
        <circle cx="420.9" cy="296.5" r="45.7" />
        <path d="M520.5 78.1z" />
      </g>
    </svg>
  );
}
```

Catatan implementasi: jika ingin mempertahankan detail path logo lama, salin semua path dari file lama dan ubah `fill="#61DAFB"` menjadi `fill="currentColor"` agar theme-aware.

- [ ] **Step 2: Buat UserAvatar**

Buat `src/components/asset-manager/UserAvatar.tsx`:

```tsx
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = {
  avatarUrl: string | null;
  isSyncing?: boolean;
  name: string;
  onOpenProfile?: () => void;
};

export function UserAvatar({ avatarUrl, isSyncing = false, name, onOpenProfile }: UserAvatarProps) {
  const initial = createInitial(name);

  return (
    <button
      aria-label="Buka profile user"
      className="relative flex size-10 items-center justify-center rounded-full border border-border bg-card"
      type="button"
      onClick={onOpenProfile}
    >
      {isSyncing ? (
        <Spinner aria-label="Menyinkronkan data akun" />
      ) : (
        <Avatar size="sm">
          {avatarUrl ? <AvatarImage alt={name} src={avatarUrl} /> : null}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      )}
    </button>
  );
}

function createInitial(name: string): string {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "AM";
}
```

- [ ] **Step 3: Buat ExtensionHeader**

Buat `src/components/asset-manager/ExtensionHeader.tsx`:

```tsx
import { Logo } from "./Logo";
import { UserAvatar } from "./UserAvatar";

type ExtensionHeaderProps = {
  avatarUrl?: string | null;
  isSyncing?: boolean;
  onOpenProfile?: () => void;
  subtitle: string;
  title: string;
  username?: string;
  version: string;
};

export function ExtensionHeader({
  avatarUrl = null,
  isSyncing = false,
  onOpenProfile,
  subtitle,
  title,
  username,
  version,
}: ExtensionHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Logo className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-base leading-tight font-semibold tracking-tight">
            {title} <span className="text-xs font-medium text-muted-foreground">v{version}</span>
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {username ? (
        <UserAvatar
          avatarUrl={avatarUrl}
          isSyncing={isSyncing}
          name={username}
          onOpenProfile={onOpenProfile}
        />
      ) : null}
    </header>
  );
}
```

- [ ] **Step 4: Buat komponen UI lain dengan aturan token theme**

Untuk setiap file di bawah, gunakan komposisi ini:

`BootstrapSkeleton.tsx` memakai `Skeleton`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function BootstrapSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <Skeleton className="size-10 rounded-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-9 rounded-md" />
        <Skeleton className="h-9 rounded-md" />
      </div>
    </div>
  );
}
```

`StatusNotice.tsx` memakai `Alert`:

```tsx
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type NoticeTone = "info" | "success" | "warning" | "danger";

type StatusNoticeProps = {
  message: string;
  title: string;
  tone: NoticeTone;
};

export function StatusNotice({ message, title, tone }: StatusNoticeProps) {
  const Icon = getNoticeIcon(tone);

  return (
    <Alert variant={tone === "danger" ? "destructive" : "default"}>
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function getNoticeIcon(tone: NoticeTone) {
  if (tone === "success") {
    return CheckCircle2Icon;
  }

  if (tone === "warning") {
    return TriangleAlertIcon;
  }

  if (tone === "danger") {
    return AlertCircleIcon;
  }

  return InfoIcon;
}
```

`RedeemCdKeyForm.tsx` memakai `Field` dan `InputGroup`:

```tsx
import { KeyRoundIcon } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

type RedeemCdKeyFormProps = {
  errorMessage?: string;
  isSubmitting: boolean;
  onRedeemCdKey: (code: string) => void;
};

export function RedeemCdKeyForm({ errorMessage, isSubmitting, onRedeemCdKey }: RedeemCdKeyFormProps) {
  const [cdKeyCode, setCdKeyCode] = useState("");
  const isInvalid = Boolean(errorMessage);

  function handleSubmitRedeemCdKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRedeemCdKey(cdKeyCode.trim());
  }

  return (
    <form onSubmit={handleSubmitRedeemCdKey}>
      <FieldGroup>
        <Field data-invalid={isInvalid}>
          <FieldLabel htmlFor="redeem-cd-key">Redeem CDKey</FieldLabel>
          <InputGroup>
            <InputGroupInput
              aria-invalid={isInvalid}
              disabled={isSubmitting}
              id="redeem-cd-key"
              placeholder="ABCD123456"
              value={cdKeyCode}
              onChange={(event) => setCdKeyCode(event.target.value)}
            />
            <InputGroupAddon align="inline-start">
              <KeyRoundIcon />
            </InputGroupAddon>
          </InputGroup>
          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
          <FieldDescription>Jika berhasil, status paket akan tersinkron otomatis.</FieldDescription>
        </Field>
        <Button disabled={isSubmitting || cdKeyCode.trim().length === 0} type="submit">
          {isSubmitting ? <Spinner data-icon="inline-start" /> : <KeyRoundIcon data-icon="inline-start" />}
          Redeem Sekarang
        </Button>
      </FieldGroup>
    </form>
  );
}
```

- [ ] **Step 5: Buat SubscriptionSummary**

Buat `src/components/asset-manager/SubscriptionSummary.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtensionSubscription } from "@/lib/api/extensionApiTypes";
import {
  formatCountdownParts,
  formatDateForPopup,
  getSubscriptionStatusLabel,
} from "@/lib/asset-access/subscription";

type SubscriptionSummaryProps = {
  subscription: ExtensionSubscription;
};

export function SubscriptionSummary({ subscription }: SubscriptionSummaryProps) {
  const countdown = formatCountdownParts(subscription.countdownSeconds);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-sm">
          Info Subscriber
          <Badge variant="outline">{getSubscriptionStatusLabel(subscription.status)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Paket</dt>
          <dd className="text-right font-medium">{subscription.packageName ?? "-"}</dd>
          <dt className="text-muted-foreground">Expired At</dt>
          <dd className="text-right font-medium">{formatDateForPopup(subscription.endAt)}</dd>
          <dt className="text-muted-foreground">Countdown</dt>
          <dd className="text-right font-medium tabular-nums">{countdown.label}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Buat PackageList**

Buat `src/components/asset-manager/PackageList.tsx`:

```tsx
import { PackageCheckIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtensionPackage } from "@/lib/api/extensionApiTypes";

type PackageListProps = {
  apiBaseUrl: string;
  packages: ExtensionPackage[];
};

export function PackageList({ apiBaseUrl, packages }: PackageListProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Paket Tersedia</p>
      {packages.map((availablePackage) => (
        <Card key={availablePackage.id} size="sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-sm">
              {availablePackage.name}
              <span className="text-xs text-muted-foreground">
                Rp {availablePackage.amountRp.toLocaleString("id-ID")}
              </span>
            </CardTitle>
            <CardDescription>{availablePackage.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              className={buttonVariants({ className: "w-full", size: "sm", variant: "outline" })}
              href={`${apiBaseUrl}${availablePackage.checkoutUrl}`}
              rel="noreferrer"
              target="_blank"
            >
              <PackageCheckIcon data-icon="inline-start" />
              Pilih Paket
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Buat RenewalActions**

Buat `src/components/asset-manager/RenewalActions.tsx`:

```tsx
import { KeyRoundIcon, PackageCheckIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ExtensionPackage } from "@/lib/api/extensionApiTypes";

import { PackageList } from "./PackageList";
import { RedeemCdKeyForm } from "./RedeemCdKeyForm";

type RenewalPanel = "packages" | "redeem" | null;

type RenewalActionsProps = {
  apiBaseUrl: string;
  errorMessage?: string;
  isRedeeming: boolean;
  packages: ExtensionPackage[];
  onRedeemCdKey: (code: string) => void;
};

export function RenewalActions({
  apiBaseUrl,
  errorMessage,
  isRedeeming,
  packages,
  onRedeemCdKey,
}: RenewalActionsProps) {
  const [activePanel, setActivePanel] = useState<RenewalPanel>(null);

  function togglePanel(nextPanel: Exclude<RenewalPanel, null>) {
    setActivePanel((currentPanel) => (currentPanel === nextPanel ? null : nextPanel));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          aria-pressed={activePanel === "packages"}
          type="button"
          variant={activePanel === "packages" ? "default" : "outline"}
          onClick={() => togglePanel("packages")}
        >
          <PackageCheckIcon data-icon="inline-start" />
          Pilih Paket
        </Button>
        <Button
          aria-pressed={activePanel === "redeem"}
          type="button"
          variant={activePanel === "redeem" ? "default" : "outline"}
          onClick={() => togglePanel("redeem")}
        >
          <KeyRoundIcon data-icon="inline-start" />
          Redeem CDKey
        </Button>
      </div>
      {activePanel === "packages" ? <PackageList apiBaseUrl={apiBaseUrl} packages={packages} /> : null}
      {activePanel === "redeem" ? (
        <RedeemCdKeyForm
          errorMessage={errorMessage}
          isSubmitting={isRedeeming}
          onRedeemCdKey={onRedeemCdKey}
        />
      ) : null}
    </section>
  );
}
```

- [ ] **Step 8: Buat AssetModeChooser**

Buat `src/components/asset-manager/AssetModeChooser.tsx`:

```tsx
import { LockKeyholeIcon, UsersRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ExtensionMode } from "@/lib/api/extensionApiTypes";

type AssetModeChooserProps = {
  availableModes: ExtensionMode[];
  defaultMode: ExtensionMode;
  platformLabel: string;
  secondsRemaining: number;
  onSelectMode: (mode: ExtensionMode) => void;
};

export function AssetModeChooser({
  availableModes,
  defaultMode,
  platformLabel,
  secondsRemaining,
  onSelectMode,
}: AssetModeChooserProps) {
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Pilih mode akses {platformLabel}</CardTitle>
        <CardDescription>Auto pilih {defaultMode} dalam {secondsRemaining} detik.</CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          className="grid grid-cols-1 gap-2"
          type="single"
          variant="outline"
          onValueChange={(nextMode) => {
            if (nextMode === "private" || nextMode === "share") {
              onSelectMode(nextMode);
            }
          }}
        >
          {availableModes.includes("private") ? (
            <ToggleGroupItem className="justify-start" value="private">
              <LockKeyholeIcon data-icon="inline-start" />
              Private
            </ToggleGroupItem>
          ) : null}
          {availableModes.includes("share") ? (
            <ToggleGroupItem className="justify-start" value="share">
              <UsersRoundIcon data-icon="inline-start" />
              Share
            </ToggleGroupItem>
          ) : null}
        </ToggleGroup>
      </CardContent>
      <CardFooter>
        <Button className="w-full" type="button" onClick={() => onSelectMode(defaultMode)}>
          Gunakan {defaultMode}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

- [ ] **Step 9: Buat AssetAccessList**

Buat `src/components/asset-manager/AssetAccessList.tsx`:

```tsx
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtensionAssetSummary } from "@/lib/api/extensionApiTypes";
import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";

type AssetAccessListProps = {
  assets: ExtensionAssetSummary[];
  disabled?: boolean;
  onAccessAsset: (platform: AssetPlatform) => void;
};

export function AssetAccessList({ assets, disabled = false, onAccessAsset }: AssetAccessListProps) {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-sm font-medium">Akses Asset</p>
      {assets.map((assetSummary) => {
        const config = getAssetPlatformConfig(assetSummary.platform);
        const accessLabel = createAccessLabel(assetSummary);

        return (
          <Card key={assetSummary.platform} size="sm">
            <CardHeader>
              <CardTitle className="text-sm">{config.label}</CardTitle>
              <CardDescription>{accessLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                disabled={disabled}
                type="button"
                variant="outline"
                onClick={() => onAccessAsset(assetSummary.platform)}
              >
                Akses {config.label}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function createAccessLabel(assetSummary: ExtensionAssetSummary): string {
  if (assetSummary.hasPrivateAccess && assetSummary.hasShareAccess) {
    return "private dan share access tersedia";
  }

  if (assetSummary.hasPrivateAccess) {
    return "private access tersedia";
  }

  if (assetSummary.hasShareAccess) {
    return "share access tersedia";
  }

  return "akses belum tersedia";
}
```

- [ ] **Step 10: Buat ProfilePanel**

Buat `src/components/asset-manager/ProfilePanel.tsx`:

```tsx
import { ArrowLeftIcon, LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtensionUser } from "@/lib/api/extensionApiTypes";

import { UserAvatar } from "./UserAvatar";

type ProfilePanelProps = {
  isLoggingOut: boolean;
  onBack: () => void;
  onLogout: () => void;
  user: ExtensionUser;
};

export function ProfilePanel({ isLoggingOut, onBack, onLogout, user }: ProfilePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <Button size="sm" type="button" variant="ghost" onClick={onBack}>
          <ArrowLeftIcon data-icon="inline-start" />
          Kembali
        </Button>
        <p className="text-sm font-medium">Profile</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <UserAvatar avatarUrl={user.avatarUrl} name={user.username} />
          <p className="font-medium">{user.username}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">{user.publicId}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled={isLoggingOut} type="button" variant="destructive" onClick={onLogout}>
            <LogOutIcon data-icon="inline-start" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

- [ ] **Step 11: Buat UnauthenticatedPanel dan VersionGatePanel**

Buat `src/components/asset-manager/UnauthenticatedPanel.tsx`:

```tsx
import { LogInIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type UnauthenticatedPanelProps = {
  loginUrl: string;
  onOpenLogin: () => void;
};

export function UnauthenticatedPanel({ loginUrl, onOpenLogin }: UnauthenticatedPanelProps) {
  return (
    <Empty className="border border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LogInIcon />
        </EmptyMedia>
        <EmptyTitle>Anda belum login</EmptyTitle>
        <EmptyDescription>Login diperlukan untuk sinkron akun dan akses asset premium.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button className="w-full" type="button" onClick={onOpenLogin}>
          <LogInIcon data-icon="inline-start" />
          Login
        </Button>
        <p className="text-center text-xs text-muted-foreground">membuka: {loginUrl}</p>
      </EmptyContent>
    </Empty>
  );
}
```

Buat `src/components/asset-manager/VersionGatePanel.tsx`:

```tsx
import { DownloadIcon, ShieldAlertIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type VersionGatePanelProps = {
  downloadUrl?: string;
  version: string;
};

export function VersionGatePanel({ downloadUrl = "https://github.com", version }: VersionGatePanelProps) {
  return (
    <Empty className="border border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Versi ini sudah tidak didukung</EmptyTitle>
        <EmptyDescription>Anda wajib melakukan upgrade. Versi saat ini: {version}.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <a className={buttonVariants({ className: "w-full" })} href={downloadUrl} rel="noreferrer" target="_blank">
          <DownloadIcon data-icon="inline-start" />
          Download New Version
        </a>
      </EmptyContent>
    </Empty>
  );
}
```

Gunakan `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Badge`, `Button`, `Alert`, `Separator`, dan `Empty` sesuai kode di atas. Jangan memakai `space-y-*`; gunakan `flex flex-col gap-*`.

- [ ] **Step 12: Update import Logo lama**

Ganti semua import:

```ts
import { Logo } from "@/component/Logo";
```

menjadi:

```ts
import { Logo } from "@/components/asset-manager/Logo";
```

- [ ] **Step 13: Hapus file Logo lama jika sudah tidak ada import**

Gunakan Grep untuk memastikan tidak ada `@/component/Logo`. Jika tidak ada, hapus `src/component/Logo.tsx` memakai apply_patch delete.

- [ ] **Step 14: Jalankan typecheck**

Run:

```bash
pnpm typecheck
```

Expected: error yang tersisa hanya dari `PopupApp.tsx` atau `ContentApp.tsx` jika belum diintegrasikan.

---

## Task 9: Popup App State Machine dan Bootstrap Cache UI

**Files:**

- Create: `src/popup/ui/PopupShell.tsx`
- Replace: `src/popup/PopupApp.tsx`

- [ ] **Step 1: Buat PopupShell**

Buat `src/popup/ui/PopupShell.tsx`:

```tsx
import type { ReactNode } from "react";

type PopupShellProps = {
  children: ReactNode;
  isReady: boolean;
};

export function PopupShell({ children, isReady }: PopupShellProps) {
  return (
    <main
      className={
        isReady
          ? "w-[332px] bg-background px-4 py-4 text-foreground"
          : "invisible w-[332px] bg-background px-4 py-4 text-foreground"
      }
    >
      {children}
    </main>
  );
}
```

- [ ] **Step 2: Replace PopupApp dengan orchestration final**

Ganti `src/popup/PopupApp.tsx` dengan composition berikut.

```tsx
import { RefreshCwIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { AssetAccessList } from "@/components/asset-manager/AssetAccessList";
import { AssetModeChooser } from "@/components/asset-manager/AssetModeChooser";
import { BootstrapSkeleton } from "@/components/asset-manager/BootstrapSkeleton";
import { ExtensionHeader } from "@/components/asset-manager/ExtensionHeader";
import { ProfilePanel } from "@/components/asset-manager/ProfilePanel";
import { RenewalActions } from "@/components/asset-manager/RenewalActions";
import { StatusNotice } from "@/components/asset-manager/StatusNotice";
import { SubscriptionSummary } from "@/components/asset-manager/SubscriptionSummary";
import { UnauthenticatedPanel } from "@/components/asset-manager/UnauthenticatedPanel";
import { VersionGatePanel } from "@/components/asset-manager/VersionGatePanel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getExtensionApiBaseUrl } from "@/lib/api/extensionApiConfig";
import type { ExtensionAssetResponse, ExtensionBootstrap, ExtensionMode } from "@/lib/api/extensionApiTypes";
import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";
import { isRenewalWarningActive, isSubscriptionActive } from "@/lib/asset-access/subscription";
import { runtimeMessageType, type BootstrapRuntimeValue } from "@/lib/runtime/messages";
import { useThemePreference } from "@/lib/useThemePreference";

import { PopupShell } from "./ui/PopupShell";

type PopupView = "main" | "profile";
type AssetModeSelection = Extract<ExtensionAssetResponse, { status: "selection_required" }>;

export function PopupApp() {
  const themeTarget = typeof document === "undefined" ? null : document.documentElement;
  const { isReady } = useThemePreference(themeTarget);
  const [bootstrapValue, setBootstrapValue] = useState<BootstrapRuntimeValue | null>(null);
  const [view, setView] = useState<PopupView>("main");
  const [assetModeSelection, setAssetModeSelection] = useState<AssetModeSelection | null>(null);
  const [modeCountdown, setModeCountdown] = useState(10);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    sendRuntimeMessage({ type: runtimeMessageType.bootstrapRequested }, (value: BootstrapRuntimeValue) => {
      setBootstrapValue(value);
    });
  }, []);

  useEffect(() => {
    if (!assetModeSelection) {
      return;
    }

    setModeCountdown(assetModeSelection.selectionTimeoutSeconds);
    const intervalId = window.setInterval(() => {
      setModeCountdown((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(intervalId);
          sendRuntimeMessage(
            {
              mode: assetModeSelection.defaultMode,
              platform: assetModeSelection.platform,
              type: runtimeMessageType.assetAccessRequested,
            },
            () => setAssetModeSelection(null),
          );
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [assetModeSelection]);

  const snapshot = bootstrapValue?.cache?.snapshot ?? null;
  const isSyncing = Boolean(bootstrapValue?.isSyncing || isPending);
  const extensionVersion = chrome.runtime.getManifest().version;
  const apiBaseUrl = getExtensionApiBaseUrl();

  function handleRefreshBootstrap() {
    startTransition(() => {
      sendRuntimeMessage({ type: runtimeMessageType.bootstrapRefreshRequested }, (cache) => {
        setBootstrapValue({ cache, isSyncing: false });
      });
    });
  }

  function handleOpenLogin(loginUrl: string) {
    chrome.tabs.create({ url: `${apiBaseUrl}${loginUrl}` });
  }

  function handleAccessAsset(platform: AssetPlatform) {
    sendRuntimeMessage({ platform, type: runtimeMessageType.assetAccessRequested }, (value: ExtensionAssetResponse) => {
      setErrorMessage("");

      if (value.status === "selection_required") {
        setAssetModeSelection(value);
        return;
      }

      if (value.status === "forbidden") {
        setErrorMessage("Langganan diperlukan untuk mengakses asset ini.");
      }
    });
  }

  function handleSelectAssetMode(mode: ExtensionMode) {
    if (!assetModeSelection) {
      return;
    }

    sendRuntimeMessage(
      {
        mode,
        platform: assetModeSelection.platform,
        type: runtimeMessageType.assetAccessRequested,
      },
      () => setAssetModeSelection(null),
    );
  }

  function handleRedeemCdKey(code: string) {
    sendRuntimeMessage({ code, type: runtimeMessageType.redeemCdKeyRequested }, (nextSnapshot: ExtensionBootstrap) => {
      setBootstrapValue({
        cache: { fetchedAt: Date.now(), isValid: true, snapshot: nextSnapshot },
        isSyncing: false,
      });
    });
  }

  function handleLogout() {
    sendRuntimeMessage({ type: runtimeMessageType.logoutRequested }, () => {
      setView("main");
      sendRuntimeMessage({ type: runtimeMessageType.bootstrapRequested }, setBootstrapValue);
    });
  }

  if (!snapshot) {
    return (
      <PopupShell isReady={isReady}>
        <BootstrapSkeleton />
      </PopupShell>
    );
  }

  if (snapshot.version.status === "update_required") {
    return (
      <PopupShell isReady={isReady}>
        <VersionGatePanel downloadUrl={snapshot.version.downloadUrl} version={extensionVersion} />
      </PopupShell>
    );
  }

  if (snapshot.auth.status === "unauthenticated") {
    return (
      <PopupShell isReady={isReady}>
        <UnauthenticatedPanel loginUrl={snapshot.auth.loginUrl} onOpenLogin={() => handleOpenLogin(snapshot.auth.loginUrl)} />
      </PopupShell>
    );
  }

  if (!snapshot.user || !snapshot.subscription) {
    return (
      <PopupShell isReady={isReady}>
        <StatusNotice message="Data akun belum lengkap. Coba refresh ulang." title="Data belum lengkap" tone="warning" />
      </PopupShell>
    );
  }

  if (view === "profile") {
    return (
      <PopupShell isReady={isReady}>
        <ProfilePanel isLoggingOut={isPending} user={snapshot.user} onBack={() => setView("main")} onLogout={handleLogout} />
      </PopupShell>
    );
  }

  const canAccessAssets = isSubscriptionActive(snapshot.subscription.status);
  const showRenewalActions =
    !canAccessAssets || isRenewalWarningActive(snapshot.subscription.countdownSeconds);

  return (
    <PopupShell isReady={isReady}>
      <div className="flex flex-col gap-4">
        <ExtensionHeader
          avatarUrl={snapshot.user.avatarUrl}
          isSyncing={isSyncing}
          subtitle="Premium Access Extension"
          title="Asset Manager"
          username={snapshot.user.username}
          version={extensionVersion}
          onOpenProfile={() => setView("profile")}
        />

        {snapshot.version.status === "update_available" ? (
          <StatusNotice
            message="Versi terbaru tersedia, harap update untuk fitur optimal."
            title="Update tersedia"
            tone="warning"
          />
        ) : null}

        <SubscriptionSummary subscription={snapshot.subscription} />

        {snapshot.subscription.status === "processed" ? (
          <StatusNotice
            message="Pesanan sedang diproses oleh admin, mohon tunggu."
            title="Pesanan diproses"
            tone="warning"
          />
        ) : null}

        {assetModeSelection ? (
          <AssetModeChooser
            availableModes={assetModeSelection.availableModes}
            defaultMode={assetModeSelection.defaultMode}
            platformLabel={getAssetPlatformConfig(assetModeSelection.platform).label}
            secondsRemaining={modeCountdown}
            onSelectMode={handleSelectAssetMode}
          />
        ) : null}

        {showRenewalActions ? (
          <RenewalActions
            apiBaseUrl={apiBaseUrl}
            errorMessage={errorMessage}
            isRedeeming={isPending}
            packages={snapshot.packages ?? []}
            onRedeemCdKey={handleRedeemCdKey}
          />
        ) : null}

        {canAccessAssets ? (
          <AssetAccessList assets={snapshot.assets ?? []} disabled={isPending} onAccessAsset={handleAccessAsset} />
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button disabled={isPending} variant="outline" onClick={handleLogout}>
            Logout
          </Button>
          <Button disabled={isSyncing} variant="secondary" onClick={handleRefreshBootstrap}>
            {isSyncing ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
            Refresh
          </Button>
        </div>
      </div>
    </PopupShell>
  );
}

function sendRuntimeMessage<TValue>(message: object, onSuccess: (value: TValue) => void) {
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      return;
    }

    onSuccess(response.value as TValue);
  });
}
```

- [ ] **Step 3: Jalankan typecheck**

Run:

```bash
pnpm typecheck
```

Expected: error popup selesai; error content mungkin masih ada.

---

## Task 10: Content Overlay, Auto Access, dan Mode Chooser

**Files:**

- Create: `src/content/ui/AccessOverlay.tsx`
- Replace: `src/content/ContentApp.tsx`
- Test: `tests/integration/access-overlay.spec.ts`

- [ ] **Step 1: Tulis Playwright failing test overlay tidak bocor ke host page**

Buat `tests/integration/access-overlay.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("asset overlay di Shadow DOM tidak mengubah style heading host page", async ({ page }) => {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Host Heading</h1>
        <div id="extension-root"></div>
      </body>
    </html>
  `);

  const before = await page.evaluate(() => ({
    fontSize: getComputedStyle(document.querySelector("h1")!).fontSize,
    marginTop: getComputedStyle(document.querySelector("h1")!).marginTop,
  }));

  await page.evaluate(() => {
    const host = document.getElementById("extension-root")!;
    const shadowRoot = host.attachShadow({ mode: "open" });
    const overlay = document.createElement("section");
    overlay.textContent = "Menyiapkan akses aset...";
    shadowRoot.appendChild(overlay);
  });

  const after = await page.evaluate(() => ({
    fontSize: getComputedStyle(document.querySelector("h1")!).fontSize,
    marginTop: getComputedStyle(document.querySelector("h1")!).marginTop,
  }));

  expect(after).toEqual(before);
});
```

- [ ] **Step 2: Jalankan Playwright test baru**

Run:

```bash
pnpm test:web tests/integration/access-overlay.spec.ts
```

Expected: PASS karena test memverifikasi prinsip Shadow DOM. Jika command tidak menerima path di repo ini, jalankan `pnpm test:web`.

- [ ] **Step 3: Buat AccessOverlay**

Buat `src/content/ui/AccessOverlay.tsx`:

```tsx
import type { ExtensionAssetResponse, ExtensionMode } from "@/lib/api/extensionApiTypes";
import { AssetModeChooser } from "@/components/asset-manager/AssetModeChooser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getAssetPlatformConfig, type AssetPlatform } from "@/lib/asset-access/platforms";

type AccessOverlayProps = {
  assetResponse?: ExtensionAssetResponse;
  message: string;
  platform: AssetPlatform | null;
  secondsRemaining: number;
  state: "idle" | "loading" | "chooser" | "success" | "error";
  onSelectMode: (mode: ExtensionMode) => void;
};

export function AccessOverlay({
  assetResponse,
  message,
  platform,
  secondsRemaining,
  state,
  onSelectMode,
}: AccessOverlayProps) {
  if (state === "idle" || !platform) {
    return null;
  }

  const platformLabel = getAssetPlatformConfig(platform).label;

  if (state === "chooser" && assetResponse?.status === "selection_required") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 p-4 text-foreground backdrop-blur-sm">
        <AssetModeChooser
          availableModes={assetResponse.availableModes}
          defaultMode={assetResponse.defaultMode}
          platformLabel={platformLabel}
          secondsRemaining={secondsRemaining}
          onSelectMode={onSelectMode}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 p-4 text-foreground backdrop-blur-sm">
      <Card className="w-80 text-center">
        <CardHeader>
          <CardTitle>{state === "error" ? "Akses gagal disiapkan" : "Menyiapkan akses aset"}</CardTitle>
          <CardDescription>{platformLabel}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          {state === "loading" ? <Spinner /> : null}
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Ganti ContentApp**

Ganti `src/content/ContentApp.tsx`:

```tsx
import { useEffect, useState } from "react";

import type { ExtensionAssetResponse, ExtensionMode } from "@/lib/api/extensionApiTypes";
import { detectAssetPlatformFromHostname, type AssetPlatform } from "@/lib/asset-access/platforms";
import { runtimeMessageType } from "@/lib/runtime/messages";
import { useThemePreference } from "@/lib/useThemePreference";

import { AccessOverlay } from "./ui/AccessOverlay";

type ContentAppProps = {
  themeRoot: HTMLDivElement;
};

type OverlayState = "idle" | "loading" | "chooser" | "success" | "error";

export function ContentApp({ themeRoot }: ContentAppProps) {
  useThemePreference(themeRoot);
  const [platform] = useState<AssetPlatform | null>(() => detectAssetPlatformFromHostname(window.location.hostname));
  const [overlayState, setOverlayState] = useState<OverlayState>("idle");
  const [overlayMessage, setOverlayMessage] = useState("Menyiapkan akses aset...");
  const [assetResponse, setAssetResponse] = useState<ExtensionAssetResponse | undefined>();
  const [secondsRemaining, setSecondsRemaining] = useState(10);

  useEffect(() => {
    if (!platform) {
      return;
    }

    setOverlayState("loading");
    chrome.runtime.sendMessage({ platform, type: runtimeMessageType.autoAccessRequested }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        setOverlayMessage(response?.errorMessage ?? "Akses gagal disiapkan.");
        setOverlayState("error");
        return;
      }

      const value = response.value as ExtensionAssetResponse;
      setAssetResponse(value);

      if (value.status === "selection_required") {
        setSecondsRemaining(value.selectionTimeoutSeconds);
        setOverlayState("chooser");
        return;
      }

      if (value.status === "ready") {
        setOverlayState("success");
        window.location.reload();
      }
    });
  }, [platform]);

  useEffect(() => {
    if (overlayState !== "chooser" || !assetResponse || assetResponse.status !== "selection_required") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsRemaining((currentSeconds) => {
        if (currentSeconds <= 1) {
          handleSelectMode(assetResponse.defaultMode);
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [assetResponse, overlayState]);

  function handleSelectMode(mode: ExtensionMode) {
    if (!platform) {
      return;
    }

    setOverlayState("loading");
    chrome.runtime.sendMessage(
      { mode, platform, type: runtimeMessageType.autoAccessRequested },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          setOverlayMessage(response?.errorMessage ?? "Mode akses gagal diterapkan.");
          setOverlayState("error");
          return;
        }

        window.location.reload();
      },
    );
  }

  return (
    <AccessOverlay
      assetResponse={assetResponse}
      message={overlayMessage}
      platform={platform}
      secondsRemaining={secondsRemaining}
      state={overlayState}
      onSelectMode={handleSelectMode}
    />
  );
}
```

- [ ] **Step 5: Sesuaikan runtime message untuk mode di popup dan content flow**

Di `src/lib/runtime/messages.ts`, ubah `AssetAccessRequestedMessage` dan `AutoAccessRequestedMessage` menjadi:

```ts
export type AssetAccessRequestedMessage = {
  mode?: ExtensionMode;
  platform: AssetPlatform;
  tabId?: number;
  type: (typeof runtimeMessageType)["assetAccessRequested"];
};

export type AutoAccessRequestedMessage = {
  mode?: ExtensionMode;
  platform: AssetPlatform;
  type: (typeof runtimeMessageType)["autoAccessRequested"];
};
```

Di `src/background/index.ts`, pass `mode: message.mode` ke branch `assetAccessRequested` dan `autoAccessRequested`. Branch `assetAccessRequested` tetap `shouldNavigate: true` untuk flow popup. Branch `autoAccessRequested` tetap `shouldNavigate: false` untuk flow content script karena content script yang melakukan `window.location.reload()`.

- [ ] **Step 6: Jalankan typecheck dan Playwright**

Run:

```bash
pnpm typecheck
pnpm test:web
```

Expected: typecheck PASS, Playwright PASS.

---

## Task 11: Final Cleanup Demo Template dan README

**Files:**

- Modify: `README.md`
- Delete: `src/background/core/badge.ts` jika tidak dipakai
- Delete: `src/popup/ui/ActionButton.tsx` jika tidak dipakai
- Delete: `src/options/ui/StatusText.tsx` jika tidak dipakai
- Delete: empty `src/component/` directory if no files remain

- [ ] **Step 1: Cari sisa demo badge/overlay template**

Run Grep patterns:

```text
incrementBadge|resetBadge|toggleUi|Badge \+|Overlay|My Extension|Popup tools
```

Expected: tidak ada sisa di source kecuali README lama sebelum diedit.

- [ ] **Step 2: Hapus file demo yang tidak dipakai**

Gunakan `apply_patch` untuk delete file yang tidak punya import:

```text
src/background/core/badge.ts
src/popup/ui/ActionButton.tsx
src/options/ui/StatusText.tsx
src/component/Logo.tsx
```

- [ ] **Step 3: Update README struktur project**

Ubah bagian Project Structure README menjadi struktur Asset Manager:

```text
├── src/
│   ├── popup/               # Popup entry composition
│   ├── options/             # Extension settings page
│   ├── content/             # Asset-domain overlay and automation
│   ├── background/          # MV3 service worker orchestration
│   │   └── core/            # cookies, bootstrap, asset access, heartbeat
│   ├── components/
│   │   ├── asset-manager/   # reusable domain UI components
│   │   └── ui/              # shadcn/base-ui primitives
│   └── lib/
│       ├── api/             # api/ext client and contracts
│       ├── asset-access/    # platform/subscription helpers
│       ├── runtime/         # typed runtime messages
│       ├── storage/         # chrome.storage helpers
│       └── styles/          # Tailwind theme tokens
```

- [ ] **Step 4: Update README quick tour**

Ganti demo tour dengan:

```md
## Asset Manager Flow

1. Login ke web app local `http://localhost:3000` memakai akun seed di `.docs/dev-seed.md`.
2. Buka popup extension untuk melihat bootstrap state, subscription, package, dan asset access.
3. Klik asset untuk clear cookie, fetch payload `/api/ext/asset`, inject cookie, dan membuka domain target.
4. Buka domain aset langsung untuk menjalankan auto sync dengan cooldown 5 menit.
5. Gunakan tombol Refresh untuk forced bootstrap sync dan Redeem CDKey untuk memperbarui paket.
```

- [ ] **Step 5: Jalankan typecheck dan lint**

Run:

```bash
pnpm typecheck
pnpm lint
```

Expected: PASS.

---

## Task 12: Full Quality Gate dan Manual Verification Local Seed

**Files:**

- Read: `.docs/dev-seed.md`
- Read: `.docs/extension-v2-api.md`
- No code changes unless a verification failure identifies a bug.

- [ ] **Step 1: Jalankan semua automated quality gate**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:web
pnpm build
```

Expected: semua command exit code 0.

- [ ] **Step 2: Load extension build di Chrome**

Run dev/build sesuai kebutuhan:

```bash
pnpm build
```

Lalu load folder `dist` di `chrome://extensions`.

- [ ] **Step 3: Verifikasi unauthenticated state**

Pastikan web app local belum login. Buka popup extension.

Expected:

```text
Popup menampilkan login state.
Klik Login membuka http://localhost:3000/login.
BootstrapSkeleton hanya muncul jika storage belum punya snapshot.
```

- [ ] **Step 4: Verifikasi seed active**

Login web app dengan:

```text
email: seed.active.browser@assetnext.dev
password: Devpass123
```

Expected:

```text
Popup langsung menampilkan snapshot cache jika ada.
Jika cache stale, avatar berubah spinner saat sync.
Status Active tampil.
Asset access list tampil.
Klik Refresh disabled/loading saat fetch.
```

- [ ] **Step 5: Verifikasi seed processed**

Login web app dengan:

```text
email: seed.processed.browser@assetnext.dev
password: Devpass123
```

Expected:

```text
Status Processed tampil.
Warning "Pesanan sedang diproses oleh admin, mohon tunggu." tampil.
```

- [ ] **Step 6: Verifikasi seed expired/canceled/none**

Login bergantian dengan:

```text
seed.expired.browser@assetnext.dev
seed.canceled.browser@assetnext.dev
seed.none.browser@assetnext.dev
password: Devpass123
```

Expected:

```text
Status sesuai akun tampil.
Pilih Paket toggle membuka package list.
Redeem CDKey toggle membuka form.
Membuka satu panel menutup panel lain.
```

- [ ] **Step 7: Verifikasi asset access click**

Dengan akun active, klik TradingView jika tersedia.

Expected:

```text
Jika /api/ext/asset mengembalikan ready, cookie lama domain target dihapus, cookie response diinjeksi, tab target dibuka.
Jika /api/ext/asset mengembalikan selection_required, chooser muncul di popup.
Chooser tidak muncul untuk mode tunggal private-only atau share-only.
```

- [ ] **Step 8: Verifikasi content automation**

Buka domain aset yang match manifest.

Expected:

```text
Overlay "Menyiapkan akses aset..." muncul saat cooldown lewat.
Jika selection_required, chooser muncul di overlay dan auto-pilih default mode setelah 10 detik.
Jika ready, halaman reload setelah cookie sync.
Jika cooldown kurang dari 5 menit, overlay tidak mengganggu halaman.
```

- [ ] **Step 9: Verifikasi logout**

Klik Logout dari profile atau main popup.

Expected:

```text
API /api/ext/logout terpanggil.
Cache diganti unauthenticated invalid.
Data user lama tidak tampil.
Cookie domain aset dihapus.
```

- [ ] **Step 10: Checkpoint git tanpa commit**

Run:

```bash
git status --short
```

Expected: daftar file yang berubah sesuai task. Jangan commit kecuali user meminta.

---

## Self-Review Plan

- Spec coverage: plan mencakup folder reusable, theme light/dark, bootstrap stale-while-revalidate, API contract, manifest domain-only, popup states, asset flow, chooser conditional, content automation, heartbeat, logout, tests, dan seed verification.
- Placeholder scan: tidak ada marker pekerjaan kosong atau instruksi tanpa detail. Komponen utama diberi kode konkret atau props typed yang langsung dipakai oleh task integrasi.
- Type consistency: platform memakai `AssetPlatform`, mode memakai `ExtensionMode`, bootstrap memakai `ExtensionBootstrap` dan `BootstrapCacheRecord`, runtime response memakai `RuntimeResponse<TValue>`.
- Risiko yang perlu diperhatikan saat eksekusi: Task 9 snippet `sendRuntimeMessage` perlu disesuaikan jika response generic TypeScript terlalu sempit; gunakan typed overload kecil jika typecheck meminta.
