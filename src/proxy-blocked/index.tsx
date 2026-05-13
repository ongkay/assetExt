import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/lib/styles/globals.css";

import { ProxyBlockedApp } from "./ProxyBlockedApp";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <ProxyBlockedApp />
    </StrictMode>,
  );
}
