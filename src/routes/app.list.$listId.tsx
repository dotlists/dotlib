import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { AppContext } from './app';
import { ListEditor } from '@/components/ListEditor';
import { GanttView } from '@/components/GanttView';
import { useSettings } from '@/contexts/SettingsContext';
import type { Id } from '@/lib/convex';

export const Route = createFileRoute('/app/list/$listId')({
  component: ListPageComponent,
});

function ListPageComponent() {
  const { listId } = Route.useParams();
  const { isSimpleMode } = useSettings();
  const {
    selectedList, 
    handleUpdateItem, 
    handleAddItem, 
    handleDeleteItem, 
    focusedItemId, 
    setFocusedItemId,
    viewMode
  } = useContext(AppContext);

  if (!selectedList) {
    return <div>List not found or loading...</div>;
  }

  return (
    <>
      {(viewMode === "list" || isSimpleMode) && (
        <ListEditor
          state={selectedList}
          handleUpdateItem={handleUpdateItem}
          handleAddItem={handleAddItem}
          handleDeleteItem={handleDeleteItem}
          focusedItemId={focusedItemId}
          setFocusedItemId={setFocusedItemId}
        />
      )}
      {viewMode === "gantt" && !isSimpleMode && (
        <GanttView listId={listId as Id<"lists">} />
      )}
    </>
  );
}
