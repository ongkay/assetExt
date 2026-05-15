import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/lib/styles/globals.css";

import { PeerGuardWarningPage } from "@/components/asset-manager/PeerGuardWarningPage";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <PeerGuardWarningPage extensionLabel="ext-1" />
    </StrictMode>,
  );
}
