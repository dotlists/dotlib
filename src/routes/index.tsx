import { LandingPage } from '@/components/LandingPage'
import { createFileRoute } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react';
import React from 'react';

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const { isAuthenticated } = useConvexAuth();
  const navigate = Route.useNavigate();
  
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/app', replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <LandingPage />
  );
}
