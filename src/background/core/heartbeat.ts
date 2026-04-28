import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { detectAssetPlatformFromHostname } from "@/lib/asset-access/platforms";
import { postExtensionHeartbeat } from "@/lib/api/extensionApi";
import { getOrCreateDeviceId } from "@/lib/storage/deviceIdentity";

import { createExtensionApiConfig } from "./bootstrap";

const heartbeatAlarmName = "assetManager.heartbeat";
const legacyHeartbeatAlarmPrefix = `${heartbeatAlarmName}.`;
const heartbeatIntervalMinutes = 5;
const heartbeatImmediateThrottleMs = heartbeatIntervalMinutes * 60 * 1_000;
let globalHeartbeatStartPromise: Promise<void> | null = null;
let lastImmediateHeartbeatAt = 0;

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== heartbeatAlarmName && !isLegacyHeartbeatAlarmName(alarm.name)) {
    return;
  }

  void handleHeartbeatAlarm(alarm).catch(() => undefined);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  stopHeartbeat(tabId);
});

void cleanupStaleHeartbeatAlarms().catch(() => undefined);

export async function startHeartbeat(tabId: number, _platform: AssetPlatform): Promise<void> {
  if (!(await isHeartbeatTabActive(tabId))) {
    return;
  }

  if (globalHeartbeatStartPromise) {
    await globalHeartbeatStartPromise;
    return;
  }

  globalHeartbeatStartPromise = startGlobalHeartbeat().finally(() => {
    globalHeartbeatStartPromise = null;
  });

  await globalHeartbeatStartPromise;
}

export function stopHeartbeat(_tabId: number): void {
  void stopGlobalHeartbeatIfNoAssetTabs();
}

async function handleHeartbeatAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  if (isLegacyHeartbeatAlarmName(alarm.name)) {
    await chrome.alarms.clear(alarm.name);
    return;
  }

  if (!(await hasActiveAssetTabs())) {
    await clearGlobalHeartbeatAlarm();
    return;
  }

  await sendHeartbeat();
}

async function startGlobalHeartbeat(): Promise<void> {
  await cleanupLegacyHeartbeatAlarms();

  if (shouldSendImmediateHeartbeat()) {
    await sendHeartbeat();
    lastImmediateHeartbeatAt = Date.now();
  }

  if (await chrome.alarms.get(heartbeatAlarmName)) {
    return;
  }

  await chrome.alarms.create(heartbeatAlarmName, {
    delayInMinutes: heartbeatIntervalMinutes,
    periodInMinutes: heartbeatIntervalMinutes,
  });
}

async function stopGlobalHeartbeatIfNoAssetTabs(): Promise<void> {
  if (await hasActiveAssetTabs()) {
    return;
  }

  lastImmediateHeartbeatAt = 0;
  await clearGlobalHeartbeatAlarm();
}

async function cleanupStaleHeartbeatAlarms(): Promise<void> {
  await cleanupLegacyHeartbeatAlarms();

  if (!(await hasActiveAssetTabs())) {
    await clearGlobalHeartbeatAlarm();
  }
}

async function cleanupLegacyHeartbeatAlarms(): Promise<void> {
  const alarms = await chrome.alarms.getAll();
  const heartbeatAlarms = alarms.filter((alarm) => isLegacyHeartbeatAlarmName(alarm.name));

  await Promise.all(heartbeatAlarms.map((alarm) => chrome.alarms.clear(alarm.name)));
}

async function isHeartbeatTabActive(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    const tabUrl = tab.url ?? tab.pendingUrl;

    if (!tabUrl) {
      return false;
    }

    const hostname = new URL(tabUrl).hostname;

    return detectAssetPlatformFromHostname(hostname) !== null;
  } catch {
    return false;
  }
}

async function hasActiveAssetTabs(): Promise<boolean> {
  const tabs = await chrome.tabs.query({});

  return tabs.some((tab) => {
    const tabUrl = tab.url ?? tab.pendingUrl;

    if (!tabUrl) {
      return false;
    }

    try {
      return detectAssetPlatformFromHostname(new URL(tabUrl).hostname) !== null;
    } catch {
      return false;
    }
  });
}

function shouldSendImmediateHeartbeat(): boolean {
  if (!lastImmediateHeartbeatAt) {
    return true;
  }

  return Date.now() - lastImmediateHeartbeatAt > heartbeatImmediateThrottleMs;
}

function clearGlobalHeartbeatAlarm(): Promise<boolean> {
  return chrome.alarms.clear(heartbeatAlarmName);
}

function isLegacyHeartbeatAlarmName(alarmName: string): boolean {
  return alarmName.startsWith(legacyHeartbeatAlarmPrefix);
}

async function sendHeartbeat(): Promise<void> {
  const heartbeatResult = await postExtensionHeartbeat(
    createExtensionApiConfig(),
    await getOrCreateDeviceId(),
  );

  if (!heartbeatResult.ok) {
    throw new Error(heartbeatResult.error.message);
  }
}
