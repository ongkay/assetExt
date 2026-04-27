import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/component/Logo";
import { runtimeMessageType } from "@/lib/runtime/messages";
import { useThemePreference } from "@/lib/useThemePreference";

import { ActionButton } from "./ui/ActionButton";

export function PopupApp() {
  const themeTarget = typeof document === "undefined" ? null : document.documentElement;
  const { isDark, isReady, theme, setTheme } = useThemePreference(themeTarget);
  const [status, setStatus] = useState("");

  const handleOpenOptions = () => {
    if (typeof chrome === "undefined") {
      return;
    }

    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
      return;
    }

    if (chrome.runtime?.getURL) {
      window.open(chrome.runtime.getURL("options.html"));
    }
  };

  const handleToggleUi = () => {
    if (typeof chrome === "undefined") {
      return;
    }

    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs?.[0]?.id;
      if (!tabId) {
        return;
      }

      chrome.tabs.sendMessage(tabId, { type: runtimeMessageType.toggleUi }, () => {
        if (chrome.runtime.lastError) {
          setStatus("No overlay on this page.");
          return;
        }

        setStatus("");
      });
    });
  };

  const handleIncrementBadge = () => {
    if (typeof chrome === "undefined") {
      return;
    }

    chrome.runtime.sendMessage({ type: runtimeMessageType.incrementBadge }, (response) => {
      if (chrome.runtime.lastError || !response) {
        setStatus("Could not update badge.");
        return;
      }

      setStatus("");
    });
  };

  return (
    <div
      className={
        isReady
          ? "w-[332px] bg-background px-4 py-4 text-foreground"
          : "invisible w-[332px] bg-background px-4 py-4 text-foreground"
      }
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/15">
              <Logo className="h-5 w-5 shrink-0" title="My Extension logo" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-base leading-tight font-semibold tracking-tight">
                My Extension
              </h1>
              <p className="max-w-[15rem] text-sm text-muted-foreground">
                Popup tools for the active tab.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-background/80 capitalize shadow-xs">
            {theme}
          </Badge>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-3 shadow-xs">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-muted-foreground">
              Synced across popup, options, and overlay.
            </p>
          </div>
          <Switch
            aria-label="Toggle dark mode"
            checked={isDark}
            onCheckedChange={(checked) => void setTheme(checked ? "dark" : "light")}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-2.5">
          <ActionButton variant="solid" onClick={handleToggleUi}>
            Overlay
          </ActionButton>
          <ActionButton onClick={handleIncrementBadge}>Badge +</ActionButton>
        </div>

        <div className="flex items-start justify-between gap-3">
          <button
            className="cursor-pointer text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            onClick={handleOpenOptions}
          >
            Open settings
          </button>
          <p className="min-h-4 text-right text-[11px] text-muted-foreground" role="status">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
