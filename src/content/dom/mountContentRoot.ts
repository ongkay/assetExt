import { applyThemeClass, defaultThemePreference, type ThemePreference } from "@/lib/theme";

type ContentMount = {
  host: HTMLDivElement;
  mountPoint: HTMLDivElement;
  themeRoot: HTMLDivElement;
};

export function mountContentRoot(
  styles: string,
  theme: ThemePreference = defaultThemePreference,
): ContentMount {
  const existingHost = document.getElementById("extension-root") as HTMLDivElement | null;
  const host = existingHost ?? document.createElement("div");

  if (!existingHost) {
    host.id = "extension-root";
    document.body.appendChild(host);
  }

  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  shadowRoot.replaceChildren();

  const style = document.createElement("style");
  style.textContent = styles;
  shadowRoot.appendChild(style);

  const themeRoot = document.createElement("div");
  applyThemeClass(themeRoot, theme);
  shadowRoot.appendChild(themeRoot);

  const mountPoint = document.createElement("div");
  themeRoot.appendChild(mountPoint);

  return { host, mountPoint, themeRoot };
}
