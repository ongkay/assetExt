import {
  runtimeMessageType,
  type BadgeResponse,
  type RuntimeMessage,
} from "@/lib/runtime/messages";
import { incrementBadge, initializeBadge, resetBadge } from "./core/badge";

chrome.runtime.onInstalled.addListener(() => {
  initializeBadge();
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === runtimeMessageType.incrementBadge) {
    incrementBadge((count) => {
      sendResponse({ count } satisfies BadgeResponse);
    });
    return true;
  }

  if (message.type === runtimeMessageType.resetBadge) {
    resetBadge((count) => {
      sendResponse({ count } satisfies BadgeResponse);
    });
    return true;
  }

  return undefined;
});
