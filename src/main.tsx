import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import SettingsProvider from "./contexts/SettingsProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import "./global.css";
import { RouterProvider, createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const router = createRouter({ 
  routeTree,
  context: {
    auth: undefined!
  }
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const convexURL = import.meta.env.VITE_CONVEX_URL;

if (!convexURL) {
  throw new Error(
    "VITE_CONVEX_URL is not set. Make sure to set it in your .env.local file or in your hosting provider's environment variables.",
  );
}

const convex = new ConvexReactClient(convexURL);

function InnerApp() {
  const auth = useConvexAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <ThemeProvider>
        <SettingsProvider>
          <InnerApp />
        </SettingsProvider>
      </ThemeProvider>
    </ConvexAuthProvider>
  </React.StrictMode>,
);
