type ContentMount = {
  mountPoint: HTMLDivElement;
};

export function mountContentRoot(styles: string): ContentMount {
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

  const mountPoint = document.createElement("div");
  shadowRoot.appendChild(mountPoint);

  return { mountPoint };
}
