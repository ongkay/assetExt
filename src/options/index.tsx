import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/lib/styles/globals.css";
import { OptionsApp } from "./OptionsApp";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <OptionsApp />
    </StrictMode>,
  );
}
