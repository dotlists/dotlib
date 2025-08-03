import { ConvexAuthProvider } from "@convex-dev/auth/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import SettingsProvider from "./contexts/SettingsProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import "./global.css";
import { Link, RouterProvider, createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const router = createRouter({ 
  routeTree,
  defaultNotFoundComponent: () => {
    return (
      <div className="p-5 font-mono">
        <span className="text-5xl">404. Page not found.</span>
        <br />
        <Link to="/" className="text-xl">Go back to Dotlists</Link>
      </div>
    )
  },
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <ThemeProvider>
        <SettingsProvider>
          <RouterProvider router={router} />
        </SettingsProvider>
      </ThemeProvider>
    </ConvexAuthProvider>
  </React.StrictMode>,
);
