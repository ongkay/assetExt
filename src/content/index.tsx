import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import styles from "@/lib/styles/globals.css?inline";
import { mountContentRoot } from "./dom/mountContentRoot";
import { ContentApp } from "./ContentApp";

const { mountPoint } = mountContentRoot(styles);

createRoot(mountPoint).render(
  <StrictMode>
    <ContentApp />
  </StrictMode>,
);
