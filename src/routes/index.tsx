import { LandingPage } from '@/components/LandingPage'
import { createFileRoute } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react';
import React from 'react';

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = Route.useNavigate();
  
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate({ to: '/app', replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <LandingPage />
  );
}
