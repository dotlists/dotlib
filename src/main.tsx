import { ConvexAuthProvider } from "@convex-dev/auth/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ConvexReactClient } from "convex/react";
import { SettingsProvider } from "./contexts/SettingsContext.tsx";
import "./global.css";

const convexURL = import.meta.env.VITE_CONVEX_URL;

if (!convexURL) {
  throw new Error(
    "VITE_CONVEX_URL is not set. Make sure to set it in your .env.local file or in your hosting provider's environment variables.",
  );
}

const convex = new ConvexReactClient(convexURL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ConvexAuthProvider>
  </React.StrictMode>,
);