import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "./components/StatusBar";
import { ListEditor } from "./components/ListEditor";
import { CreateUsername } from "./components/CreateUsername";
import { GanttView } from "./components/GanttView";
import { Settings } from "./components/Settings/Settings";
import clsx from "clsx";
import { useSettings } from "./contexts/SettingsContext";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { api, type Id, type Doc } from "@/lib/convex";
import { Button } from "./components/ui/button";
import { Sidebar } from "./components/Sidebar";

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

  const handleCreateList = useCallback(async (teamId?: Id<"teams">) => {
    const result = await createList({ name: "New List", teamId });
    if (result) {
      setSelectedListId(result);
      setListName("New List");
      setIsMobileDrawerOpen(false);
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

  // auto open the first list
  useEffect(() => {
    if (lists.length > 0 && (!selectedListId || !lists.some(list => list.id === selectedListId))) {
      setSelectedListId(lists[0].id);
      setListName(lists[0].name);
    }
  }, [lists, selectedListId]);

  // keybinds
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

  // loading screen
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

  // no lists screen
  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-8">no lists yet!</h1>
        <Button onClick={() => handleCreateList()}>create a new list</Button>
      </div>
    );
  }

  // user's valid teams
  const validTeams = teams?.filter(Boolean) as (Doc<"teams"> & { role: string })[] | undefined;

  return (
    <>
      <main className="relative md:flex h-screen">
        {/* mobile drawer (the thing that you click to close the sidebar on mobile) */}
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
        {/* mobile sidebar */}
        <div
          className={clsx(
            "fixed top-0 left-0 h-full bg-background-secondary z-30 w-3/4 p-4 border-r overflow-y-auto transition-transform duration-300 md:hidden",
            {
              "translate-x-0": isMobileDrawerOpen,
              "-translate-x-full": !isMobileDrawerOpen,
            },
          )}
        >
          <Sidebar
            validTeams={validTeams}
            isMobileDrawerOpen={isMobileDrawerOpen}
            setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
            setIsMobileDrawerOpen={setIsMobileDrawerOpen}
            personalLists={personalLists}
            teamLists={teamLists}
            selectedListId={selectedListId}
            setSelectedListId={setSelectedListId}
            setListName={setListName}
            handleDeleteList={handleDeleteList}
            handleCreateList={handleCreateList}
            isSimpleMode={isSimpleMode}
          />
        </div>

        {/* desktop sidebar */}
        <div
          className={clsx(
            "hidden md:block border-r h-full overflow-y-auto transition-all duration-300 bg-tertiary",
            {
              // this is 100x spacing (about 400px), NOT 100% width
              "w-100 p-4": isDesktopSidebarOpen,
              "w-0 p-0 border-0": !isDesktopSidebarOpen,
            },
          )}
        >
          {isDesktopSidebarOpen &&
            <Sidebar
              validTeams={validTeams}
              isMobileDrawerOpen={isMobileDrawerOpen}
              setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
              setIsMobileDrawerOpen={setIsMobileDrawerOpen}
              personalLists={personalLists}
              teamLists={teamLists}
              selectedListId={selectedListId}
              setSelectedListId={setSelectedListId}
              setListName={setListName}
              handleDeleteList={handleDeleteList}
              handleCreateList={handleCreateList}
              isSimpleMode={isSimpleMode}
            />
          }
        </div>

        {/* main content (status bar and list/gantt editor) */}
        <div className="flex flex-col w-full h-full transition-all duration-300 md:w-screen">
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
            selectedListId={selectedListId}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
      <Toaster />
    </>
  );
}
