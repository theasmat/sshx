import React from "react";
import ReactDOM from "react-dom/client";
import { WebsiteApp } from "./WebsiteApp";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <WebsiteApp />
    </React.StrictMode>
  );
}
