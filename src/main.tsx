import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// 1. Block Context Menu (Right-Click) Globally
window.addEventListener(
  "contextmenu",
  (e) => {
    e.preventDefault();
    return false;
  },
  { capture: true }
);

// 2. Block Inspect, Devtools, View Source, and Browser Page Reloads
window.addEventListener(
  "keydown",
  (e) => {
    const key = e.key.toLowerCase();
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Block F12 (Devtools)
    if (e.key === "F12") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Block F5 (Browser Page Reload)
    if (e.key === "F5") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Block Ctrl+Shift+I / Cmd+Option+I (Inspect Element)
    if ((e.ctrlKey && e.shiftKey && key === "i") || (e.metaKey && e.altKey && key === "i")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Block Ctrl+Shift+J / Cmd+Option+J (Developer Console)
    if ((e.ctrlKey && e.shiftKey && key === "j") || (e.metaKey && e.altKey && key === "j")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Block Ctrl+Shift+C / Cmd+Option+C (Inspect Selection)
    if ((e.ctrlKey && e.shiftKey && key === "c") || (e.metaKey && e.altKey && key === "c")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Block Ctrl+U / Cmd+Option+U (View Page Source)
    if ((e.ctrlKey && key === "u") || (e.metaKey && e.altKey && key === "u")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Block Ctrl+Shift+R / Cmd+Shift+R (Hard Browser Reload)
    if (cmdOrCtrl && e.shiftKey && key === "r") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  },
  { capture: true }
);

// 3. Prevent accidental file drop navigation
window.addEventListener("dragover", (e) => e.preventDefault(), { capture: true });
window.addEventListener("drop", (e) => e.preventDefault(), { capture: true });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

