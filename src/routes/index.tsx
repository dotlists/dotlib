import { LandingPage } from '@/components/LandingPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <LandingPage />
  );
}