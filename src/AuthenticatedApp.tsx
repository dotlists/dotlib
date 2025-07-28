import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "./components/StatusBar";
import { ListEditor } from "./components/ListEditor";
import { TeamManager } from "./components/TeamManager";
import { CreateUsername } from "./components/CreateUsername";
import { GanttView } from "./components/GanttView";
import { Settings } from "./components/Settings";
import { ChevronsLeft, Trash2, GripVertical, Plus } from "lucide-react";
import clsx from "clsx";
import { useSettings } from "./contexts/SettingsContext";
import { AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";

import { api, type Id, type Doc } from "@/lib/convex";
import { Button } from "./components/ui/button";

type ConvexItem = Doc<"items"> & { uuid: Id<"items"> };

type ConvexList = Doc<"lists"> & {
  id: Id<"lists">;
  nodes: ConvexItem[];
};

type ViewMode = "list" | "gantt";

export default function AuthenticatedApp() {
  const { isSimpleMode } = useSettings();
  const userProfile = useQuery(api.main.getMyUserProfile);
  const rawLists = useQuery(api.lists.getLists);
  const teams = useQuery(api.teams.getTeams);
  const reorderLists = useMutation(api.lists.reorderLists);

  const [selectedListId, setSelectedListId] = useState<Id<"lists"> | null>(
    null,
  );

  const items = useQuery(
    api.lists.getItems,
    selectedListId ? { listId: selectedListId } : "skip",
  );

  const createList = useMutation(api.lists.createListPublic);
  const updateList = useMutation(api.lists.updateList);
  const deleteList = useMutation(api.lists.deleteListPublic);
  const createItem = useMutation(api.lists.createItemPublic);
  const updateItem = useMutation(api.lists.updateItem);
  const deleteItem = useMutation(api.lists.deleteItemPublic);

  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(!isSimpleMode);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const lists: ConvexList[] = useMemo(
    () =>
      rawLists?.map((list) => ({
        ...list,
        id: list._id,
        nodes:
          items
            ?.filter((item) => item.listId === list._id)
            .map((node) => ({
              ...node,
              uuid: node._id,
            })) ?? [],
      })) ?? [],
    [rawLists, items],
  );

  const personalLists = lists.filter((list) => !list.teamId);
  const teamLists = lists.filter((list) => list.teamId);

  const [listName, setListName] = useState<string>("");
  const [focusedItemId, setFocusedItemId] = useState<Id<"items"> | null>(null);

  const selectedList = lists.find(
    (list: ConvexList) => list.id === selectedListId,
  );

  const handleListNameChange = (name: string) => {
    if (selectedListId && name) {
      updateList({ id: selectedListId, name });
    }
  };

  const handleReorderLists = async (fromIdx: number, toIdx: number) => {
    const reorderedLists = [...personalLists];
    const [removed] = reorderedLists.splice(fromIdx, 1);
    reorderedLists.splice(toIdx, 0, removed);

    try {
      await reorderLists({
        listIds: reorderedLists.map((list) => list._id),
      });
    } catch (error) {
      console.error("Failed to reorder lists:", error);
    }
  };

  const handleCreateList = useCallback(async (teamId?: Id<"teams">) => {
    const result = await createList({ name: "New List", teamId });
    if (result) {
      setSelectedListId(result);
      setListName("New List");
      setIsMobileDrawerOpen(false);
      setTimeout(() => {
        const input = document.getElementById("list-name-input");
        if (input) {
          (input as HTMLInputElement).focus();
          (input as HTMLInputElement).select();
        }
      }, 100);
    }
  }, [createList]);

  const handleAddItem = useCallback(async (
    text: string,
    state: "red" | "yellow" | "green" = "red",
  ) => {
    if (selectedListId) {
      const newItemId = await createItem({ listId: selectedListId, text, state });
      setFocusedItemId(newItemId);
    }
  }, [createItem, selectedListId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "L") {
        event.preventDefault();
        handleCreateList();
      }
      if (event.ctrlKey && event.shiftKey && event.key === "N") {
        event.preventDefault();
        handleAddItem("New Task");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCreateList, handleAddItem]);

  const handleUpdateItem = async (
    id: Id<"items">,
    updates: Partial<Doc<"items">>,
  ) => {
    await updateItem({ id, ...updates });
  };

  const handleDeleteItem = async (id: Id<"items">) => {
    await deleteItem({ id });
  };

  const handleDeleteList = async (id: Id<"lists">) => {
    await deleteList({ id });
    if (selectedListId === id) {
      const newSelectedList = lists.find((l) => l.id !== id);
      if (newSelectedList) {
        setSelectedListId(newSelectedList.id);
        setListName(newSelectedList.name);
      } else {
        setSelectedListId(null);
        setListName("");
      }
    }
  };

  if (
    userProfile === undefined ||
    rawLists === undefined ||
    teams === undefined
  ) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (userProfile === null) {
    return <CreateUsername />;
  }

  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-8">no lists yet!</h1>
        <Button onClick={() => handleCreateList()}>create a new list</Button>
      </div>
    );
  }

  const validTeams = teams?.filter(Boolean) as (Doc<"teams"> & { role: string })[] | undefined;

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-heading">personal lists</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => isMobileDrawerOpen ? setIsMobileDrawerOpen(false) : setIsDesktopSidebarOpen(false)}
        >
          <ChevronsLeft className="h-5 w-5" />
        </Button>
      </div>
      <ul>
        {personalLists.map((list, idx) => (
          <li
            key={list.id}
            className={`flex items-center justify-between cursor-pointer p-2 rounded ${
              selectedListId === list.id
                ? "bg-muted/50 text-muted-foreground"
                : ""
            } ${dragOverIdx === idx && draggedIdx !== null && draggedIdx !== idx ? "bg-accent/50" : ""}`}
            onClick={() => {
              setSelectedListId(list.id);
              setListName(list.name);
              setIsMobileDrawerOpen(false);
            }}
            draggable
            onDragStart={(e: React.DragEvent) => {
              setDraggedIdx(idx);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e: React.DragEvent) => {
              e.preventDefault();
              setDragOverIdx(idx);
            }}
            onDrop={(e: React.DragEvent) => {
              e.preventDefault();
              if (draggedIdx !== null && draggedIdx !== idx) {
                void handleReorderLists(draggedIdx, idx);
              }
              setDraggedIdx(null);
              setDragOverIdx(null);
            }}
            onDragEnd={() => {
              setDraggedIdx(null);
              setDragOverIdx(null);
            }}
            style={{
              opacity: draggedIdx === idx ? 0.5 : 1,
              userSelect: "none",
            }}
          >
            <span className="flex-1 truncate">{list.name}</span>
            <GripVertical className="w-4 h-4 text-muted-foreground/50" />
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 w-6"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </DialogTrigger>
              {personalLists.length === 1 ? (
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>You need at least one list</DialogTitle>
                  <DialogDescription>
                    You cannot delete your last remaining list. Please create
                    another list before deleting this one.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            ) : (
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your list and remove its data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => void handleDeleteList(list.id)}
                  >
                    Delete this list
                  </Button>
                </DialogClose>
              </DialogContent>
            )}
            </Dialog>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" onClick={() => handleCreateList()} className="mt-1">
        <Plus className="w-4 h-4 mr-2" />
        new personal list
      </Button>
      {!isSimpleMode && (
        <>
          <hr className="my-4" />
          {validTeams && (
            <TeamManager
              teams={validTeams}
              teamLists={teamLists}
              handleCreateList={handleCreateList}
              handleDeleteList={handleDeleteList}
              setSelectedListId={(id) => {
                setSelectedListId(id);
                setIsMobileDrawerOpen(false);
              }}
              setListName={setListName}
              selectedListId={selectedListId}
            />
          )}
        </>
      )}
    </>
  );

  return (
    <>
      <main className="relative md:flex h-screen">
        {/* Mobile Drawer */}
        <div
          className={clsx(
            "fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden",
            {
              "opacity-100 pointer-events-auto": isMobileDrawerOpen,
              "opacity-0 pointer-events-none": !isMobileDrawerOpen,
            },
          )}
          onClick={() => setIsMobileDrawerOpen(false)}
        />
        <div
          className={clsx(
            "fixed top-0 left-0 h-full bg-background z-30 w-3/4 p-4 border-r overflow-y-auto transition-transform duration-300 md:hidden",
            {
              "translate-x-0": isMobileDrawerOpen,
              "-translate-x-full": !isMobileDrawerOpen,
            },
          )}
        >
          {sidebarContent}
        </div>

        {/* Desktop Sidebar */}
        <div
          className={clsx(
            "hidden md:block border-r h-full overflow-y-auto transition-all duration-300",
            {
              "w-1/4 p-4": isDesktopSidebarOpen,
              "w-0 p-0 border-0": !isDesktopSidebarOpen,
            },
          )}
        >
          {isDesktopSidebarOpen && sidebarContent}
        </div>

        {/* Main Content */}
        <div
          className={clsx(
            "flex flex-col w-full h-full transition-all duration-300",
            {
              "md:w-3/4": isDesktopSidebarOpen,
              "md:w-full": !isDesktopSidebarOpen,
            },
          )}
        >
          <StatusBar
            isDesktopSidebarOpen={isDesktopSidebarOpen}
            setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
            setIsMobileDrawerOpen={setIsMobileDrawerOpen}
            lists={lists}
            selectedListId={selectedListId}
            setSelectedListId={setSelectedListId}
            listName={listName}
            setListName={setListName}
            handleListNameChange={handleListNameChange}
            handleCreateList={() => handleCreateList()}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
          <div className="flex-grow overflow-y-auto px-4 mt-16">
            {selectedList && (viewMode === "list" || isSimpleMode) && (
              <ListEditor
                state={selectedList}
                handleUpdateItem={handleUpdateItem}
                handleAddItem={handleAddItem}
                handleDeleteItem={handleDeleteItem}
                focusedItemId={focusedItemId}
                setFocusedItemId={setFocusedItemId}
              />
            )}
            {selectedListId && viewMode === "gantt" && !isSimpleMode && (
              <GanttView listId={selectedListId} />
            )}
          </div>
        </div>
      </main>
      <AnimatePresence>
        {isSettingsOpen && (
          <Settings
            onClose={() => {
              console.log("onClose called");
              setIsSettingsOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
