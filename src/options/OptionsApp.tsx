import { PopupApp, type PopupView } from "@/popup/PopupApp";

export function OptionsApp() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,var(--tvlink-options-canvas-start)_0%,var(--tvlink-options-canvas-mid)_46%,var(--tvlink-options-canvas-end)_100%)] p-4">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] items-center justify-center">
        <PopupApp
          avatarUploadMode="direct-upload"
          initialView={getOptionsView()}
          onPopupViewChange={syncOptionsViewUrl}
        />
      </div>
    </div>
  );
}

function getOptionsView(): PopupView {
  if (typeof window === "undefined") {
    return "main";
  }

  return new URLSearchParams(window.location.search).get("view") === "profile" ? "profile" : "main";
}

function syncOptionsViewUrl(view: PopupView) {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = getOptionsViewUrl(view);
  window.history.replaceState(null, "", nextUrl);
}

function getOptionsViewUrl(view: PopupView): string {
  const relativeUrl = view === "profile" ? "options.html?view=profile" : "options.html";

  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(relativeUrl);
  }

  return relativeUrl;
}
