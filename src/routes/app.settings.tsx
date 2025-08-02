import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/components/Settings/SettingsPage';
import { useContext } from 'react';
import { AppContext } from './app';

export const Route = createFileRoute('/app/settings')({
  component: SettingsRouteComponent,
});

function SettingsRouteComponent() {
  const { selectedList } = useContext(AppContext);
  return <SettingsPage selectedListId={selectedList?._id ?? null} />;
}
