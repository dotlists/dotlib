import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "@/components/StatusBar";
import { CreateUsername } from "@/components/CreateUsername";
import clsx from "clsx";
import { useSettings } from "@/contexts/SettingsContext";
import { Toaster } from "sonner";
import { api, type Id, type Doc } from "@/lib/convex";
import { Sidebar } from "@/components/Sidebar";
import { createFileRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router';
import { useConvexAuth } from 'convex/react';
import { LandingPage } from '@/components/LandingPage';

type ViewMode = "list" | "gantt";

export const Route = createFileRoute('/app')({
  component: AppLayout,
});

type ConvexItem = Doc<"items"> & { uuid: Id<"items"> };

type ConvexList = Doc<"lists"> & {
  id: Id<"lists">;
  nodes: ConvexItem[];
};

interface AppContextType {
  lists: ConvexList[];
  selectedList: ConvexList | undefined;
  handleUpdateItem: (id: Id<"items">, updates: Partial<Doc<"items">>) => Promise<void>;
  handleAddItem: (text: string, state?: "red" | "yellow" | "green") => Promise<void>;
  handleDeleteItem: (id: Id<"items">) => Promise<void>;
  focusedItemId: Id<"items"> | null;
  setFocusedItemId: (id: Id<"items"> | null) => void;
  handleCreateList: (teamId?: Id<"teams">) => Promise<void>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const AppContext = React.createContext<AppContextType>(null!);

function AppLayout() {
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const selectedListId = params?.listId as Id<"lists"> | null ?? null;

  const { isSimpleMode } = useSettings();
  const userProfile = useQuery(api.main.getMyUserProfile);
  const rawLists = useQuery(api.lists.getLists);
  const teams = useQuery(api.teams.getTeams);

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
  const [focusedItemId, setFocusedItemId] = useState<Id<"items"> | null>(null);

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

  const selectedList = lists.find(
    (list: ConvexList) => list.id === selectedListId,
  );

  useEffect(() => {
    if (selectedList) {
      setListName(selectedList.name);
    }
  }, [selectedList]);

  const handleListNameChange = (name: string) => {
    if (selectedListId && name) {
      updateList({ id: selectedListId, name });
    }
  };

  const handleCreateList = useCallback(async (teamId?: Id<"teams">) => {
    const result = await createList({ name: "New List", teamId });
    if (result) {
      navigate({ to: '/app/list/$listId', params: { listId: result } });
      setIsMobileDrawerOpen(false);
    }
  }, [createList, navigate]);

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
        navigate({ to: '/app/list/$listId', params: { listId: newSelectedList.id } });
      } else {
        navigate({ to: '/app' });
      }
    }
  };

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

  if (!isAuthenticated) {
    return <LandingPage />;
  }

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

  const validTeams = teams?.filter(Boolean) as (Doc<"teams"> & { role: string })[] | undefined;

  return (
    <AppContext.Provider value={{ lists, selectedList, handleUpdateItem, handleAddItem, handleDeleteItem, focusedItemId, setFocusedItemId, handleCreateList, viewMode, setViewMode }}>
      <main className="relative md:flex h-screen">
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
            setSelectedListId={(id) => navigate({ to: '/app/list/$listId', params: { listId: id }})}
            setListName={setListName}
            handleDeleteList={handleDeleteList}
            handleCreateList={handleCreateList}
            isSimpleMode={isSimpleMode}
            onSettingsClick={() => navigate({ to: '/app/settings' })}
          />
        </div>

        <div
          className={clsx(
            "hidden md:block border-r h-full overflow-y-auto transition-all duration-300 bg-tertiary",
            {
              "w-80 p-4": isDesktopSidebarOpen,
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
              setSelectedListId={(id) => navigate({ to: '/app/list/$listId', params: { listId: id }})}
              setListName={setListName}
              handleDeleteList={handleDeleteList}
              handleCreateList={handleCreateList}
              isSimpleMode={isSimpleMode}
              onSettingsClick={() => navigate({ to: '/app/settings' })}
            />
          }
        </div>

        <div 
          className={clsx(
            "flex flex-col w-full h-full transition-all duration-300",
            {
              "md:w-[calc(100%-20rem)]": isDesktopSidebarOpen,
              "md:w-screen": !isDesktopSidebarOpen,
            },
          )}
        >
          <StatusBar
            isDesktopSidebarOpen={isDesktopSidebarOpen}
            setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
            setIsMobileDrawerOpen={setIsMobileDrawerOpen}
            lists={lists}
            selectedListId={selectedListId}
            setSelectedListId={(id) => navigate({ to: '/app/list/$listId', params: { listId: id }})}
            listName={listName}
            setListName={setListName}
            handleListNameChange={handleListNameChange}
            handleCreateList={() => handleCreateList()}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          <div className="flex-grow overflow-y-auto px-4 mt-16">
            <Outlet />
          </div>
        </div>
      </main>
      <Toaster />
    </AppContext.Provider>
  );
}
