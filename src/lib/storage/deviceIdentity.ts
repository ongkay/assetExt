import { getChromeStorageValue, setChromeStorageValue } from "@/lib/storage/chromeStorage";

const deviceIdStorageKey = "assetManager.deviceId";

export async function getOrCreateDeviceId(): Promise<string> {
  const storedDeviceId = await getChromeStorageValue<string>(deviceIdStorageKey);

  if (storedDeviceId) {
    return storedDeviceId;
  }

  const deviceId = crypto.randomUUID();
  await setChromeStorageValue(deviceIdStorageKey, deviceId);

  return deviceId;
}
