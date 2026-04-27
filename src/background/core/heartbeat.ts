import type { AssetPlatform } from "@/lib/asset-access/platforms";
import { postExtensionHeartbeat } from "@/lib/api/extensionApi";
import { getOrCreateDeviceId } from "@/lib/storage/deviceIdentity";

import { createExtensionApiConfig } from "./bootstrap";

const heartbeatAlarmPrefix = "assetManager.heartbeat.";
const heartbeatIntervalMinutes = 5;

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith(heartbeatAlarmPrefix)) {
    return;
  }

  void sendHeartbeat().catch(() => undefined);
});

export async function startHeartbeat(tabId: number, _platform: AssetPlatform): Promise<void> {
  stopHeartbeat(tabId);

  await sendHeartbeat();
  await chrome.alarms.create(getHeartbeatAlarmName(tabId), {
    delayInMinutes: heartbeatIntervalMinutes,
    periodInMinutes: heartbeatIntervalMinutes,
  });
}

export function stopHeartbeat(tabId: number): void {
  void chrome.alarms.clear(getHeartbeatAlarmName(tabId));
}

function getHeartbeatAlarmName(tabId: number): string {
  return `${heartbeatAlarmPrefix}${tabId}`;
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
