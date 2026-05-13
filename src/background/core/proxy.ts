import {
  assetPlatforms,
  detectAssetPlatformFromHostname,
  getAssetPlatformConfig,
  type AssetPlatform,
} from "@/lib/asset-access/platforms";
import {
  assetProxyConflictMessage,
  parseAssetProxy,
  type AssetProxyConfig,
  type AssetProxyConflictState,
  type AssetProxyLevelOfControl,
  type AssetProxyState,
} from "@/lib/proxy/assetProxy";
import { readProxyExtensionCandidates } from "@/lib/proxy/proxyExtensionManagement";
import {
  assetProxyStateStorageKey,
  clearAssetProxyState,
  createEmptyAssetProxyConflictState,
  createEmptyAssetProxyState,
  readAssetProxyState,
  updateAssetProxyPlatformState,
  writeAssetProxyState,
} from "@/lib/storage/assetProxyState";

const proxyUnsupportedMessage =
  "Kontrol proxy browser tidak tersedia. Asset Manager tidak dapat memastikan koneksi asset berjalan aman.";
const protectedMainFrameRedirectRuleBaseId = 2100;
const protectedSubresourceBlockRuleBaseId = 2200;
const proxyBlockedPagePath = "proxy-blocked.html";
const proxyAuthMaxAttemptsPerRequest = 2;

let latestAssetProxyState: AssetProxyState | null = null;
let latestAssetProxyStateRevision = 0;
let proxyRuntimeSyncPromise: Promise<AssetProxyState> | null = null;

const proxyAuthRequestAttempts = new Map<string, number>();

registerProxySettingsChangeListener();
registerProxyAuthListener();
registerProxyAuthRequestCleanupListeners();

export class ProxyConflictError extends Error {
  constructor(message = assetProxyConflictMessage) {
    super(message);
    this.name = "ProxyConflictError";
  }
}

export async function ensureProxyControllerReady(): Promise<void> {
  await syncProxyRuntimeState();
}

export async function ensureProxyAccessAvailable(): Promise<AssetProxyState> {
  const assetProxyState = await syncProxyRuntimeState();

  if (assetProxyState.conflict.isActive) {
    throw new ProxyConflictError(assetProxyState.conflict.message ?? assetProxyConflictMessage);
  }

  return assetProxyState;
}

export async function refreshProxyConflictState(): Promise<AssetProxyState> {
  return syncProxyRuntimeState();
}

export async function syncAssetPlatformProxy(
  platform: AssetPlatform,
  proxyValue: string | null | undefined,
  updatedAt: string | null,
): Promise<AssetProxyState> {
  const nextState = await updateAssetProxyPlatformState(platform, () => ({
    proxy: parseAssetProxy(proxyValue),
    updatedAt,
  }));
  cacheAssetProxyState(nextState, true);

  return syncProxyRuntimeState(nextState);
}

export async function clearAssetPlatformProxy(platform: AssetPlatform): Promise<AssetProxyState> {
  const nextState = await updateAssetProxyPlatformState(platform, () => ({
    proxy: null,
    updatedAt: null,
  }));
  cacheAssetProxyState(nextState, true);

  return syncProxyRuntimeState(nextState);
}

export async function clearManagedProxyState(): Promise<void> {
  const emptyAssetProxyState = createEmptyAssetProxyState();

  cacheAssetProxyState(emptyAssetProxyState, true);
  await clearAssetProxyState();
  await syncProxyRuntimeState(emptyAssetProxyState);
}

export function getProxyBlockedPageUrl(): string {
  return chrome.runtime.getURL(proxyBlockedPagePath);
}

export function getProxyConflictMessage(): string {
  return assetProxyConflictMessage;
}

export function isProxyConflictStateActive(assetProxyState: AssetProxyState): boolean {
  return assetProxyState.conflict.isActive;
}

async function syncProxyRuntimeState(preloadedState?: AssetProxyState): Promise<AssetProxyState> {
  if (preloadedState) {
    cacheAssetProxyState(preloadedState);
  }

  if (proxyRuntimeSyncPromise) {
    return proxyRuntimeSyncPromise;
  }

  proxyRuntimeSyncPromise = (async () => {
    let syncedState = preloadedState ?? (await readLatestAssetProxyState());
    let observedRevision = latestAssetProxyStateRevision;

    while (true) {
      syncedState = await runProxyRuntimeSync(syncedState);

      if (observedRevision === latestAssetProxyStateRevision) {
        return syncedState;
      }

      observedRevision = latestAssetProxyStateRevision;
      syncedState = await readLatestAssetProxyState();
    }
  })().finally(() => {
    proxyRuntimeSyncPromise = null;
  });

  return proxyRuntimeSyncPromise;
}

async function runProxyRuntimeSync(preloadedState?: AssetProxyState): Promise<AssetProxyState> {
  const assetProxyState = preloadedState ?? (await readLatestAssetProxyState());

  if (!isProxyControlSupported()) {
    return activateProxyConflict(assetProxyState, null, proxyUnsupportedMessage);
  }

  let proxySettingDetails = await readProxySettingDetails();

  if (isProxyControlBlocked(proxySettingDetails.levelOfControl)) {
    return activateProxyConflict(
      assetProxyState,
      proxySettingDetails.levelOfControl,
      assetProxyConflictMessage,
    );
  }

  const activePlatformProxies = getActivePlatformProxies(assetProxyState);

  if (activePlatformProxies.length > 0) {
    const pacScript = createAssetProxyPacScript(activePlatformProxies);

    if (!isManagedPacScriptApplied(proxySettingDetails, pacScript)) {
      await setManagedProxyPacScript(pacScript);
      proxySettingDetails = await readProxySettingDetails();

      if (isProxyControlBlocked(proxySettingDetails.levelOfControl)) {
        return activateProxyConflict(
          assetProxyState,
          proxySettingDetails.levelOfControl,
          assetProxyConflictMessage,
        );
      }
    }
  } else if (isManagedProxyControlledByThisExtension(proxySettingDetails)) {
    await clearManagedProxySettings();
    proxySettingDetails = await readProxySettingDetails();
  }

  const conflictClearedState = await clearProxyConflict(
    assetProxyState,
    normalizeProxyLevelOfControl(proxySettingDetails.levelOfControl),
  );

  await syncProtectedDomainRules(false);

  return conflictClearedState;
}

async function activateProxyConflict(
  assetProxyState: AssetProxyState,
  levelOfControl: AssetProxyLevelOfControl | null,
  message: string,
): Promise<AssetProxyState> {
  const conflictExtensions = await readProxyExtensionCandidates().catch(() => []);
  const nextConflictState: AssetProxyConflictState = {
    detectedAt: assetProxyState.conflict.detectedAt ?? Date.now(),
    extensions: conflictExtensions,
    isActive: true,
    levelOfControl,
    message,
  };
  const nextState = {
    ...assetProxyState,
    conflict: nextConflictState,
  } satisfies AssetProxyState;

  if (isSameProxyConflictState(assetProxyState.conflict, nextConflictState)) {
    latestAssetProxyState = assetProxyState;
    await syncProtectedDomainRules(true);
    await redirectProtectedTabsToBlockedPage();
    return assetProxyState;
  }

  await persistAssetProxyState(nextState);
  await syncProtectedDomainRules(true);
  await redirectProtectedTabsToBlockedPage();

  return nextState;
}

async function clearProxyConflict(
  assetProxyState: AssetProxyState,
  levelOfControl: AssetProxyLevelOfControl | null,
): Promise<AssetProxyState> {
  const nextConflictState: AssetProxyConflictState = {
    ...createEmptyAssetProxyConflictState(),
    levelOfControl,
  };

  if (isSameProxyConflictState(assetProxyState.conflict, nextConflictState)) {
    latestAssetProxyState = assetProxyState;
    return assetProxyState;
  }

  const nextState = {
    ...assetProxyState,
    conflict: nextConflictState,
  } satisfies AssetProxyState;

  await persistAssetProxyState(nextState);

  return nextState;
}

async function readLatestAssetProxyState(): Promise<AssetProxyState> {
  if (latestAssetProxyState) {
    return latestAssetProxyState;
  }

  cacheAssetProxyState(await readAssetProxyState());

  return latestAssetProxyState!;
}

async function persistAssetProxyState(assetProxyState: AssetProxyState): Promise<void> {
  cacheAssetProxyState(assetProxyState, true);
  await writeAssetProxyState(assetProxyState);
}

function cacheAssetProxyState(assetProxyState: AssetProxyState, shouldMarkChanged = false): void {
  latestAssetProxyState = assetProxyState;

  if (shouldMarkChanged) {
    latestAssetProxyStateRevision += 1;
  }
}

function registerProxySettingsChangeListener(): void {
  if (typeof chrome === "undefined" || !chrome.proxy?.settings?.onChange) {
    return;
  }

  chrome.proxy.settings.onChange.addListener(() => {
    void syncProxyRuntimeState().catch(() => undefined);
  });
}

function registerProxyAuthListener(): void {
  if (typeof chrome === "undefined" || !chrome.webRequest?.onAuthRequired) {
    return;
  }

  chrome.webRequest.onAuthRequired.addListener(
    (details, callback) => {
      if (!callback) {
        return;
      }

      void handleProxyAuthChallenge(details)
        .then((response) => callback(response ?? {}))
        .catch(() => callback({ cancel: true }));
    },
    { urls: ["<all_urls>"] },
    ["asyncBlocking"],
  );
}

function registerProxyAuthRequestCleanupListeners(): void {
  if (typeof chrome === "undefined" || !chrome.webRequest) {
    return;
  }

  chrome.webRequest.onCompleted?.addListener(
    (details) => {
      clearProxyAuthRequestAttempt(details.requestId);
    },
    { urls: ["<all_urls>"] },
  );

  chrome.webRequest.onErrorOccurred?.addListener(
    (details) => {
      clearProxyAuthRequestAttempt(details.requestId);
    },
    { urls: ["<all_urls>"] },
  );
}

async function handleProxyAuthChallenge(
  details: chrome.webRequest.WebAuthenticationChallengeDetails,
): Promise<chrome.webRequest.BlockingResponse | undefined> {
  if (details.isProxy !== true) {
    return undefined;
  }

  const attemptCount = (proxyAuthRequestAttempts.get(details.requestId) ?? 0) + 1;
  proxyAuthRequestAttempts.set(details.requestId, attemptCount);

  if (attemptCount > proxyAuthMaxAttemptsPerRequest) {
    clearProxyAuthRequestAttempt(details.requestId);
    return { cancel: true };
  }

  let requestUrl: URL;

  try {
    requestUrl = new URL(details.url);
  } catch {
    clearProxyAuthRequestAttempt(details.requestId);
    return { cancel: true };
  }

  const platform = detectAssetPlatformFromHostname(requestUrl.hostname);

  if (!platform) {
    clearProxyAuthRequestAttempt(details.requestId);
    return undefined;
  }

  const assetProxyState = await readLatestAssetProxyState();
  const proxyConfig = assetProxyState.platforms[platform].proxy;

  if (!proxyConfig?.credentials) {
    clearProxyAuthRequestAttempt(details.requestId);
    return { cancel: true };
  }

  return {
    authCredentials: {
      password: proxyConfig.credentials.password,
      username: proxyConfig.credentials.username,
    },
  };
}

function clearProxyAuthRequestAttempt(requestId: string): void {
  proxyAuthRequestAttempts.delete(requestId);
}

function createAssetProxyPacScript(
  activePlatformProxies: Array<{ platform: AssetPlatform; proxy: AssetProxyConfig }>,
): string {
  const pacLines = [
    "function FindProxyForURL(url, host) {",
    ...activePlatformProxies.flatMap(({ platform, proxy }) => createPacConditionLines(platform, proxy)),
    '  return "DIRECT";',
    "}",
  ];

  return pacLines.join("\n");
}

function createPacConditionLines(platform: AssetPlatform, proxyConfig: AssetProxyConfig): string[] {
  const hostConditions = getAssetPlatformConfig(platform).hostPatterns.map(
    (hostPattern) => `dnsDomainIs(host, "${hostPattern}") || shExpMatch(host, "*.${hostPattern}")`,
  );
  const pacProxyValue = toPacProxyValue(proxyConfig);

  return [`  if (${hostConditions.join(" || ")}) {`, `    return "${pacProxyValue}";`, "  }"];
}

function toPacProxyValue(proxyConfig: AssetProxyConfig): string {
  const pacScheme =
    proxyConfig.scheme === "http" ? "PROXY" : proxyConfig.scheme === "https" ? "HTTPS" : "SOCKS5";

  return `${pacScheme} ${proxyConfig.host}:${proxyConfig.port}`;
}

function getActivePlatformProxies(
  assetProxyState: AssetProxyState,
): Array<{ platform: AssetPlatform; proxy: AssetProxyConfig }> {
  return Object.entries(assetProxyState.platforms).flatMap(([platform, platformState]) => {
    if (!platformState.proxy) {
      return [];
    }

    return [{ platform: platform as AssetPlatform, proxy: platformState.proxy }];
  });
}

function isProxyControlSupported(): boolean {
  return Boolean(chrome.proxy?.settings && chrome.declarativeNetRequest?.updateDynamicRules);
}

function isProxyControlBlocked(levelOfControl: AssetProxyLevelOfControl | undefined): boolean {
  return levelOfControl === "controlled_by_other_extensions" || levelOfControl === "not_controllable";
}

function normalizeProxyLevelOfControl(
  levelOfControl: AssetProxyLevelOfControl | undefined,
): AssetProxyLevelOfControl | null {
  return levelOfControl ?? null;
}

function isManagedPacScriptApplied(
  proxySettingDetails: chrome.types.ChromeSettingGetResultDetails,
  pacScript: string,
): boolean {
  return (
    proxySettingDetails.levelOfControl === "controlled_by_this_extension" &&
    proxySettingDetails.value?.mode === "pac_script" &&
    proxySettingDetails.value.pacScript?.data === pacScript
  );
}

function isManagedProxyControlledByThisExtension(
  proxySettingDetails: chrome.types.ChromeSettingGetResultDetails,
): boolean {
  return proxySettingDetails.levelOfControl === "controlled_by_this_extension";
}

function readProxySettingDetails(): Promise<chrome.types.ChromeSettingGetResultDetails> {
  return new Promise((resolve, reject) => {
    chrome.proxy.settings.get({ incognito: false }, (details) => {
      const runtimeError = chrome.runtime.lastError;

      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }

      resolve(details);
    });
  });
}

function setManagedProxyPacScript(pacScript: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.proxy.settings.set(
      {
        scope: "regular",
        value: {
          mode: "pac_script",
          pacScript: {
            data: pacScript,
            mandatory: true,
          },
        },
      },
      () => {
        const runtimeError = chrome.runtime.lastError;

        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        resolve();
      },
    );
  });
}

function clearManagedProxySettings(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.proxy.settings.clear({ scope: "regular" }, () => {
      const runtimeError = chrome.runtime.lastError;

      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }

      resolve();
    });
  });
}

async function syncProtectedDomainRules(shouldBlock: boolean): Promise<void> {
  if (!chrome.declarativeNetRequest?.updateDynamicRules) {
    return;
  }

  const ruleIds = getProtectedDomainRuleIds();

  if (!shouldBlock) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
    });
    return;
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: createProtectedDomainRules(),
    removeRuleIds: ruleIds,
  });
}

function createProtectedDomainRules(): chrome.declarativeNetRequest.Rule[] {
  const nonMainFrameResourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType).filter(
    (resourceType): resourceType is chrome.declarativeNetRequest.ResourceType =>
      resourceType !== chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
  );

  return getProtectedRootDomains().flatMap((domain, index) => [
    {
      action: {
        redirect: {
          extensionPath: `/${proxyBlockedPagePath}`,
        },
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      },
      condition: {
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        urlFilter: `||${domain}`,
      },
      id: protectedMainFrameRedirectRuleBaseId + index + 1,
      priority: 10,
    },
    {
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
      },
      condition: {
        resourceTypes: nonMainFrameResourceTypes,
        urlFilter: `||${domain}`,
      },
      id: protectedSubresourceBlockRuleBaseId + index + 1,
      priority: 10,
    },
  ]);
}

function getProtectedDomainRuleIds(): number[] {
  return getProtectedRootDomains().flatMap((_, index) => [
    protectedMainFrameRedirectRuleBaseId + index + 1,
    protectedSubresourceBlockRuleBaseId + index + 1,
  ]);
}

function getProtectedRootDomains(): string[] {
  return [...new Set(assetPlatforms.flatMap((platform) => getAssetPlatformConfig(platform).hostPatterns))];
}

async function redirectProtectedTabsToBlockedPage(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query || !chrome.tabs?.update) {
    return;
  }

  const tabs = await chrome.tabs.query({});
  const blockedPageUrl = getProxyBlockedPageUrl();

  await Promise.all(
    tabs.flatMap((tab) => {
      if (!tab.id) {
        return [];
      }

      const tabUrl = tab.url ?? tab.pendingUrl;

      if (!tabUrl) {
        return [];
      }

      try {
        return detectAssetPlatformFromHostname(new URL(tabUrl).hostname)
          ? [chrome.tabs.update(tab.id, { url: blockedPageUrl })]
          : [];
      } catch {
        return [];
      }
    }),
  );
}

function isSameProxyConflictState(
  leftConflictState: AssetProxyConflictState,
  rightConflictState: AssetProxyConflictState,
): boolean {
  return (
    leftConflictState.detectedAt === rightConflictState.detectedAt &&
    areProxyConflictExtensionsEqual(leftConflictState.extensions, rightConflictState.extensions) &&
    leftConflictState.isActive === rightConflictState.isActive &&
    leftConflictState.levelOfControl === rightConflictState.levelOfControl &&
    leftConflictState.message === rightConflictState.message
  );
}

function areProxyConflictExtensionsEqual(
  leftExtensions: AssetProxyConflictState["extensions"],
  rightExtensions: AssetProxyConflictState["extensions"],
): boolean {
  if (leftExtensions.length !== rightExtensions.length) {
    return false;
  }

  return leftExtensions.every((leftExtension, index) => {
    const rightExtension = rightExtensions[index];

    return (
      leftExtension.iconUrl === rightExtension?.iconUrl &&
      leftExtension.id === rightExtension?.id &&
      leftExtension.installType === rightExtension?.installType &&
      leftExtension.mayDisable === rightExtension?.mayDisable &&
      leftExtension.name === rightExtension?.name
    );
  });
}

export { assetProxyStateStorageKey };
