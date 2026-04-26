import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/lib/styles/globals.css";
import { PopupApp } from "./PopupApp";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <PopupApp />
    </StrictMode>,
  );
}
