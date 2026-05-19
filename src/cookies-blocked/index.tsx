import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/lib/styles/globals.css";

import { CookiesBlockedApp } from "./CookiesBlockedApp";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <CookiesBlockedApp />
    </StrictMode>,
  );
}
