import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/components/Settings/SettingsPage';
import { useContext } from 'react';
import { AppContext } from './app';
import { AnimatePresence } from 'framer-motion';

export const Route = createFileRoute('/app/settings')({
  component: SettingsRouteComponent,
});

function SettingsRouteComponent() {
  const { selectedList } = useContext(AppContext);
  return (
    <AnimatePresence>
      <SettingsPage
        selectedListId={selectedList?._id ?? null}
      />
    </AnimatePresence>
  );
  // return <SettingsPage selectedListId={selectedList?._id ?? null} />;
}
