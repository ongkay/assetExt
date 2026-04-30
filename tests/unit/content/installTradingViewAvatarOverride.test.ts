import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installTradingViewAvatarOverride } from "@/content/dom/installTradingViewAvatarOverride";
import * as assetPlatforms from "@/lib/asset-access/platforms";
import { runtimeMessageType } from "@/lib/runtime/messages";
import {
  bootstrapCacheStorageKey,
  createBootstrapCacheRecord,
  type BootstrapCacheRecord,
} from "@/lib/storage/bootstrapCache";

const mainMenuButtonSelector = 'button[data-qa-id="main-menu-button"]';
const mainAvatarImageSelector = `${mainMenuButtonSelector} img`;
const logoutMenuItemSelector = '[data-qa-id="main-menu-sign-out-item"][data-role="menuitem"]';

const originalChrome = globalThis.chrome;

type Deferred<TValue> = {
  promise: Promise<TValue>;
  reject: (reason: unknown) => void;
  resolve: (value: TValue) => void;
};

describe("TradingView avatar override", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.spyOn(assetPlatforms, "detectAssetPlatformFromHostname").mockReturnValue("tradingview");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.chrome = originalChrome;
    document.body.innerHTML = "";
  });

  it("applies restricted menu rules when private access is unavailable", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-a.png",
        hasPrivateAccess: false,
      }),
    );
    renderTradingViewPage();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getMainAvatarImage().src).toBe("https://cdn.example.com/avatar-a.png");
    expect(document.querySelector(".menuNotifications-U2jIw4km")).toBeNull();
    expect(getMenuItemBySelector('[data-qa-id="main-menu-user-menu-item"]')).toBeNull();
    expect(getMenuItemBySelector('[aria-label="Help Center"]')).toBeNull();
    expect(getMenuItemBySelector('[aria-label="Support requests"]')).toBeNull();
    expect(getMenuItemBySelector('[aria-label="What\'s new"]')).toBeNull();
    expect(getMenuItemBySelector('[aria-label="Keyboard shortcuts"]')).toBeNull();
    expect(getMenuItemBySelector('[aria-label="Get desktop app"]')).toBeNull();
    expect(getMenuItemByTextPrefix("Language")).toBeNull();
    expect(getHomeMenuItem().href).toBe("https://google.com/");
    expect(getHomeMenuItem().target).toBe("_blank");
    expect(getHomeMenuItem().rel).toBe("noopener noreferrer");
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Logout");
    expect(getLogoutMenuItem().textContent).toContain("Logout");

    disposeTradingViewAvatarOverride();
  });

  it("does nothing outside TradingView", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-outside.png",
        hasPrivateAccess: false,
      }),
    );
    vi.spyOn(assetPlatforms, "detectAssetPlatformFromHostname").mockReturnValue("fxreplay");
    renderTradingViewPage();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getMainAvatarImage().src).toBe("https://old.example.com/avatar.png");
    expect(document.querySelector(".menuNotifications-U2jIw4km")).toBeInstanceOf(HTMLElement);
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Sign out");
    expect(getLogoutMenuItem().textContent).toContain("Sign out");

    disposeTradingViewAvatarOverride();
  });

  it("delays the first avatar click until TradingView state is ready", async () => {
    const pendingBootstrapCache = createDeferred<BootstrapCacheRecord | null>();

    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-delayed.png",
        hasPrivateAccess: false,
      }),
      { pendingBootstrapCache },
    );
    document.body.innerHTML = createTradingViewHeaderMarkup();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();
    const avatarClick = new MouseEvent("click", { bubbles: true, cancelable: true });

    expect(getMainMenuButton().dispatchEvent(avatarClick)).toBe(false);

    pendingBootstrapCache.resolve(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-delayed.png",
        hasPrivateAccess: false,
      }),
    );
    await flushAsyncWork();

    expect(getMainAvatarImage().src).toBe("https://cdn.example.com/avatar-delayed.png");

    disposeTradingViewAvatarOverride();
  });

  it("keeps non-logout menu rows visible when private access is available", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-private.png",
        hasPrivateAccess: true,
      }),
    );
    renderTradingViewPage();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getMenuItemBySelector('[data-qa-id="main-menu-user-menu-item"]')).toBeInstanceOf(
      HTMLElement,
    );
    expect(getMenuItemBySelector('[aria-label="Help Center"]')).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector('[aria-label="Support requests"]')).toBeInstanceOf(
      HTMLElement,
    );
    expect(getMenuItemBySelector('[aria-label="What\'s new"]')).toBeInstanceOf(HTMLElement);
    expect(getMenuItemBySelector('[aria-label="Keyboard shortcuts"]')).toBeInstanceOf(
      HTMLElement,
    );
    expect(getMenuItemBySelector('[aria-label="Get desktop app"]')).toBeInstanceOf(
      HTMLElement,
    );
    expect(getMenuItemByTextPrefix("Language")).toBeInstanceOf(HTMLElement);
    expect(getHomeMenuItem().getAttribute("href")).toBe("/");
    expect(getHomeMenuItem().href).not.toBe("https://google.com/");
    expect(getHomeMenuItem().target).toBe("_blank");
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Logout");
    expect(getLogoutMenuItem().textContent).toContain("Logout");

    disposeTradingViewAvatarOverride();
  });

  it("uses a generated fallback avatar when the user has no avatar URL", async () => {
    installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: null,
        username: "ongkaytrade",
      }),
    );
    document.body.innerHTML = createTradingViewHeaderMarkup();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    expect(getMainAvatarImage().src.startsWith("data:image/svg+xml;charset=UTF-8,")).toBe(
      true,
    );
    expect(getMainAvatarImage().alt).toBe("O");

    disposeTradingViewAvatarOverride();
  });

  it("keeps the initial restricted rules for the current page session", async () => {
    const { emitStorageChange } = installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-b.png",
        hasPrivateAccess: false,
      }),
    );
    renderTradingViewPage();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    emitStorageChange(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-next.png",
        hasPrivateAccess: true,
      }),
    );
    await flushAsyncWork();

    expect(getMainAvatarImage().src).toBe("https://cdn.example.com/avatar-b.png");
    expect(getMenuItemBySelector('[data-qa-id="main-menu-user-menu-item"]')).toBeNull();
    expect(getMenuItemBySelector('[aria-label="Help Center"]')).toBeNull();
    expect(getMenuItemByTextPrefix("Language")).toBeNull();
    expect(getHomeMenuItem().href).toBe("https://google.com/");

    disposeTradingViewAvatarOverride();
  });

  it("sends logout through the extension runtime and updates the menu label", async () => {
    vi.useFakeTimers();

    const { runtimeSendMessage } = installChromeExtensionMocks(
      createBootstrapCacheRecordWithUser({
        avatarUrl: "https://cdn.example.com/avatar-c.png",
        hasPrivateAccess: false,
      }),
      {
        logoutResponse: { redirectTo: "http://localhost:3000/login" },
      },
    );
    renderTradingViewPage();

    const disposeTradingViewAvatarOverride = installTradingViewAvatarOverride();

    await flushAsyncWork();

    getLogoutMenuItem().dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    await flushAsyncWork();

    expect(runtimeSendMessage).toHaveBeenCalledWith(
      { type: runtimeMessageType.logoutRequested },
      expect.any(Function),
    );
    expect(getLogoutMenuItem().getAttribute("aria-label")).toBe("Success");
    expect(getLogoutMenuItem().textContent).toContain("Success");

    disposeTradingViewAvatarOverride();
  });
});

function renderTradingViewPage() {
  document.body.innerHTML = `${createTradingViewHeaderMarkup()}${createTradingViewMenuMarkup()}`;
}

function getMainMenuButton() {
  const mainMenuButton = document.querySelector(mainMenuButtonSelector);

  expect(mainMenuButton).toBeInstanceOf(HTMLButtonElement);

  return mainMenuButton as HTMLButtonElement;
}

function getMainAvatarImage() {
  const avatarImage = document.querySelector(mainAvatarImageSelector);

  expect(avatarImage).toBeInstanceOf(HTMLImageElement);

  return avatarImage as HTMLImageElement;
}

function getHomeMenuItem() {
  const homeMenuItem = document.querySelector('a[aria-label="Home"][data-role="menuitem"]');

  expect(homeMenuItem).toBeInstanceOf(HTMLAnchorElement);

  return homeMenuItem as HTMLAnchorElement;
}

function getLogoutMenuItem() {
  const logoutMenuItem = document.querySelector(logoutMenuItemSelector);

  expect(logoutMenuItem).toBeInstanceOf(HTMLElement);

  return logoutMenuItem as HTMLElement;
}

function getMenuItemBySelector(selector: string) {
  return document.querySelector(selector);
}

function getMenuItemByTextPrefix(textPrefix: string) {
  return (
    [...document.querySelectorAll('[data-role="menuitem"]')].find((candidate) => {
      if (!(candidate instanceof HTMLElement)) {
        return false;
      }

      return normalizeText(candidate.textContent).startsWith(textPrefix);
    }) ?? null
  );
}

function createBootstrapCacheRecordWithUser(
  userOverrides: Partial<NonNullable<BootstrapCacheRecord["snapshot"]["user"]>> & {
    avatarUrl: string | null;
    hasPrivateAccess?: boolean;
  },
): BootstrapCacheRecord {
  return createBootstrapCacheRecord({
    assets: [
      {
        hasPrivateAccess: userOverrides.hasPrivateAccess ?? false,
        hasShareAccess: true,
        platform: "tradingview",
      },
    ],
    auth: { status: "authenticated" },
    user: {
      avatarUrl: userOverrides.avatarUrl,
      email: userOverrides.email ?? "ongkay@example.com",
      id: userOverrides.id ?? "user-1",
      publicId: userOverrides.publicId ?? "public-user-1",
      username: userOverrides.username ?? "ongkaytrade",
    },
    version: { status: "supported" },
  });
}

function createTradingViewHeaderMarkup(avatarUrl = "https://old.example.com/avatar.png") {
  return `
    <div class="layout__area--topleft">
      <div class="topLeftButton-hCWTCWBf">
        <div class="wrap-n5bmFxyX">
          <button type="button" data-qa-id="main-menu-button">
            <img alt="" class="userPic-U2jIw4km" src="${avatarUrl}" />
          </button>
          <span class="menuNotifications-U2jIw4km notifications-U2jIw4km">11</span>
        </div>
      </div>
    </div>
  `;
}

function createTradingViewMenuMarkup() {
  return `
    <div role="treegrid" data-qa-id="popup-menu-container">
      <div class="background-row"><div role="row" aria-label="Watchlist" data-role="menuitem"><span role="gridcell">Watchlist</span></div></div>
      <div class="background-row"><div role="row" aria-label="Alerts" data-role="menuitem"><span role="gridcell">Alerts</span></div></div>
      <div role="separator"></div>
      <div class="background-row"><div role="row" data-qa-id="main-menu-user-menu-item" data-role="menuitem"><span role="gridcell">ongkaytrade</span></div></div>
      <div class="background-row"><a role="row" aria-label="Home" data-role="menuitem" href="/" target="_blank"><span role="gridcell">Home</span></a></div>
      <div class="background-row"><div role="row" aria-label="Help Center" data-role="menuitem"><span role="gridcell">Help Center</span></div></div>
      <div class="background-row"><div role="row" aria-label="Support requests" data-role="menuitem"><span role="gridcell">Support requests</span></div></div>
      <div class="background-row"><div role="row" aria-label="What's new" data-role="menuitem"><span role="gridcell">What's new</span></div></div>
      <div role="separator"></div>
      <div class="background-row"><div role="row" aria-label="Dark theme" data-role="menuitem"><span role="gridcell">Dark theme</span></div></div>
      <div class="background-row"><div role="row" aria-label="Drawings panel" data-role="menuitem"><span role="gridcell">Drawings panel</span></div></div>
      <div class="background-row"><div role="row" data-role="menuitem"><span role="gridcell">Language English</span></div></div>
      <div class="background-row"><div role="row" aria-label="Keyboard shortcuts" data-role="menuitem"><span role="gridcell">Keyboard shortcuts</span></div></div>
      <div class="background-row"><a role="row" aria-label="Get desktop app" data-role="menuitem" href="/desktop/" target="_blank"><span role="gridcell">Get desktop app</span></a></div>
      <div role="separator"></div>
      <div class="background-row"><div role="row" aria-label="Sign out" data-qa-id="main-menu-sign-out-item" data-role="menuitem"><span role="gridcell">Sign out</span></div></div>
    </div>
  `;
}

function installChromeExtensionMocks(
  initialBootstrapCache: BootstrapCacheRecord,
  options?: {
    pendingBootstrapCache?: Deferred<BootstrapCacheRecord | null>;
    logoutResponse?: { redirectTo: string };
  },
) {
  const storageValues: Record<string, unknown> = {
    [bootstrapCacheStorageKey]: initialBootstrapCache,
  };
  let storageChangeListener:
    | ((changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void)
    | undefined;
  const runtimeSendMessage = vi.fn(
    (
      message: { type: string },
      callback: (response: {
        ok: boolean;
        value?: { redirectTo: string };
        errorMessage?: string;
      }) => void,
    ) => {
      if (message.type !== runtimeMessageType.logoutRequested) {
        callback({ ok: false, errorMessage: "Unsupported runtime message." });
        return;
      }

      callback({ ok: true, value: options?.logoutResponse ?? { redirectTo: "/login" } });
    },
  );

  globalThis.chrome = {
    runtime: {
      sendMessage: runtimeSendMessage,
    },
    storage: {
      local: {
        get: vi.fn((key: string) => {
          if (options?.pendingBootstrapCache) {
            return options.pendingBootstrapCache.promise.then((value) => ({ [key]: value }));
          }

          return Promise.resolve({ [key]: storageValues[key] });
        }),
        remove: vi.fn((key: string) => {
          delete storageValues[key];

          return Promise.resolve();
        }),
        set: vi.fn((values: Record<string, unknown>) => {
          Object.assign(storageValues, values);

          return Promise.resolve();
        }),
      },
      onChanged: {
        addListener: vi.fn(
          (
            listener: (
              changes: Record<string, chrome.storage.StorageChange>,
              areaName: string,
            ) => void,
          ) => {
            storageChangeListener = listener;
          },
        ),
        removeListener: vi.fn(() => {
          storageChangeListener = undefined;
        }),
      },
    },
  } as unknown as typeof chrome;

  return {
    emitStorageChange(nextBootstrapCache: BootstrapCacheRecord) {
      storageValues[bootstrapCacheStorageKey] = nextBootstrapCache;
      storageChangeListener?.(
        {
          [bootstrapCacheStorageKey]: {
            newValue: nextBootstrapCache,
            oldValue: initialBootstrapCache,
          },
        },
        "local",
      );
    },
    runtimeSendMessage,
  };
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
}

function createDeferred<TValue>(): Deferred<TValue> {
  let rejectDeferred: (reason: unknown) => void = () => undefined;
  let resolveDeferred: (value: TValue) => void = () => undefined;
  const promise = new Promise<TValue>((resolve, reject) => {
    rejectDeferred = reject;
    resolveDeferred = resolve;
  });

  return {
    promise,
    reject: rejectDeferred,
    resolve: resolveDeferred,
  };
}

function normalizeText(textContent: string | null | undefined) {
  return textContent?.replace(/\s+/g, " ").trim() ?? "";
}
