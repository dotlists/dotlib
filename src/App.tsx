import { useConvexAuth } from "convex/react";
import { LandingPage } from "./components/LandingPage";
import React, { Suspense } from "react";
import { Route } from "wouter";
//
const AuthenticatedApp = React.lazy(() => import("./AuthenticatedApp"));

export default function App() {
  const { isAuthenticated } = useConvexAuth();

  if (!isAuthenticated) {
    return (
      <Route path="/">
        <LandingPage />
      </Route>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <AuthenticatedApp />
    </Suspense>
  );
}
