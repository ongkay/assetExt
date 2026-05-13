import type { RuntimeMessage, RuntimeResponse } from "@/lib/runtime/messages";

export type RuntimeMessageResult<TValue> = {
  errorMessage: string | null;
  value: TValue | null;
};

export async function sendRuntimeMessage<TValue>(
  message: RuntimeMessage,
): Promise<RuntimeMessageResult<TValue>> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    return { errorMessage: "Runtime extension tidak tersedia.", value: null };
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: RuntimeResponse<TValue> | undefined) => {
      if (chrome.runtime.lastError) {
        resolve({
          errorMessage: chrome.runtime.lastError.message ?? null,
          value: null,
        });
        return;
      }

      if (!response) {
        resolve({ errorMessage: null, value: null });
        return;
      }

      if (!response.ok) {
        resolve({
          errorMessage: response.errorMessage,
          value: null,
        });
        return;
      }

      resolve({ errorMessage: null, value: response.value });
    });
  });
}
