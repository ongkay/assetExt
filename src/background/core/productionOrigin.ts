import { getExtensionApiBaseUrl, isDev } from "@/lib/api/extensionApiConfig";

const productionOriginRuleId = 1001;

export async function syncProductionOriginHeaderRule(): Promise<void> {
  if (!chrome.declarativeNetRequest?.updateDynamicRules) {
    return;
  }

  if (isDev) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [productionOriginRuleId],
    });
    return;
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [createProductionOriginRule()],
    removeRuleIds: [productionOriginRuleId],
  });
}

function createProductionOriginRule(): chrome.declarativeNetRequest.Rule {
  const apiExtBaseUrl = new URL("/api/ext/", getExtensionApiBaseUrl()).toString();

  return {
    action: {
      requestHeaders: [
        {
          header: "Origin",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: `chrome-extension://${chrome.runtime.id}`,
        },
      ],
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
    },
    condition: {
      regexFilter: `^${escapeRegex(apiExtBaseUrl)}`,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
    },
    id: productionOriginRuleId,
    priority: 1,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
