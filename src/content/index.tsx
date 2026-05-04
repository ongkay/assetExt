import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { detectAssetPlatformFromHostname } from "@/lib/asset-access/platforms";
import styles from "@/lib/styles/globals.css?inline";
import { mountContentRoot } from "./dom/mountContentRoot";
import { installTvShellBootstrapState } from "./dom/tv/tvShell";
import { ContentApp } from "./ContentApp";

if (detectAssetPlatformFromHostname(window.location.hostname) === "tradingview") {
  installTvShellBootstrapState();
}

const { mountPoint, themeRoot } = mountContentRoot(styles);

createRoot(mountPoint).render(
  <StrictMode>
    <ContentApp themeRoot={themeRoot} />
  </StrictMode>,
);
