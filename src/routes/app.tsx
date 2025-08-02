import { LandingPage } from '@/components/LandingPage';
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react';
import React, { Suspense } from "react";

const AuthenticatedApp = React.lazy(() => import("../AuthenticatedApp"));

export const Route = createFileRoute('/app')({
  component: RoutedApp,
})

function RoutedApp() {
  const { isAuthenticated } = useConvexAuth();

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <AuthenticatedApp />
      </Suspense>
      <Outlet />
    </>
  );
}