import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "./components/StatusBar";
import { ListEditor } from "./components/ListEditor";
import { TeamManager } from "./components/TeamManager";
import { CreateUsername } from "./components/CreateUsername";
import { GanttView } from "./components/GanttView";
import { ChevronsLeft } from "lucide-react";
import clsx from "clsx";

import { api, type Id, type Doc } from "@/lib/convex";
import { Button } from "./components/ui/button";

type ConvexItem = Doc<"items"> & { uuid: Id<"items"> };

type ConvexList = Doc<"lists"> & {
  id: Id<"lists">;
  nodes: ConvexItem[];
};

type ViewMode = "list" | "gantt";

export default function AuthenticatedApp() {
  const userProfile = useQuery(api.users.getMyUserProfile);
  const rawLists = useQuery(api.lists.getLists);
  const teams = useQuery(api.teams.getTeams);

  const createList = useMutation(api.lists.createListPublic);
  const updateList = useMutation(api.lists.updateList);
  const createItem = useMutation(api.lists.createItemPublic);
  const updateItem = useMutation(api.lists.updateItem);
  const deleteItem = useMutation(api.lists.deleteItemPublic);

  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const lists: ConvexList[] = useMemo(
    () =>
      rawLists?.map((list) => ({
        ...list,
        id: list._id,
        nodes:
          list.nodes?.map((node) => ({
            ...node,
            uuid: node._id,
          })) ?? [],
      })) ?? [],
    [rawLists],
  );

  const personalLists = lists.filter((list) => !list.teamId);
  const teamLists = lists.filter((list) => list.teamId);

  const [selectedListId, setSelectedListId] = useState<Id<"lists"> | null>(
    null,
  );
  const [listName, setListName] = useState<string>("");
  const [focusedItemId, setFocusedItemId] = useState<Id<"items"> | null>(null);

  const selectedList = lists.find(
    (list: ConvexList) => list.id === selectedListId,
  );

  useEffect(() => {
    if (lists.length > 0 && (!selectedListId || !lists.some(list => list.id === selectedListId))) {
      setSelectedListId(lists[0].id);
      setListName(lists[0].name);
    }
  }, [lists, selectedListId]);

  const handleListNameChange = (name: string) => {
    if (selectedListId && name) {
      updateList({ id: selectedListId, name });
    }
  };

  const handleCreateList = async (teamId?: Id<"teams">) => {
    const result = await createList({ name: "New List", teamId });
    if (result) {
      setSelectedListId(result);
      setListName("New List");
      setIsMobileDrawerOpen(false);
    }
  };

  const handleAddItem = async (
    text: string,
    state: "red" | "yellow" | "green" = "red",
  ) => {
    if (selectedListId) {
      const newItemId = await createItem({ listId: selectedListId, text, state });
      setFocusedItemId(newItemId);
    }
  };

  const handleUpdateItem = async (
    id: Id<"items">,
    updates: Partial<Doc<"items">>,
  ) => {
    await updateItem({ id, ...updates });
  };

  const handleDeleteItem = async (id: Id<"items">) => {
    await deleteItem({ id });
  };

  if (userProfile === undefined || rawLists === undefined || teams === undefined) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (userProfile === null) {
    return <CreateUsername />;
  }

  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-8">No lists yet!</h1>
        <Button onClick={() => handleCreateList()}>Create a new list</Button>
      </div>
    );
  }

  const validTeams = teams?.filter(Boolean) as (Doc<"teams"> & { role: string })[] | undefined;

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-heading">Personal Lists</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => isMobileDrawerOpen ? setIsMobileDrawerOpen(false) : setIsDesktopSidebarOpen(false)}
        >
          <ChevronsLeft className="h-5 w-5" />
        </Button>
      </div>
      <ul>
        {personalLists.map((list) => (
          <li
            key={list.id}
            className={`cursor-pointer p-2 rounded ${selectedListId === list.id ? "bg-muted/50 text-muted-foreground" : ""}`}
            onClick={() => {
              setSelectedListId(list.id);
              setListName(list.name);
              setIsMobileDrawerOpen(false);
            }}
          >
            {list.name}
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" onClick={() => handleCreateList()} className="mt-1">
        + New Personal List
      </Button>
      <hr className="my-4" />
      {validTeams && (
        <TeamManager
          teams={validTeams}
          teamLists={teamLists}
          handleCreateList={handleCreateList}
          setSelectedListId={(id) => {
            setSelectedListId(id);
            setIsMobileDrawerOpen(false);
          }}
          setListName={setListName}
          selectedListId={selectedListId}
        />
      )}
    </>
  );

  return (
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
        className={clsx("flex flex-col w-full h-full transition-all duration-300", {
          "md:w-3/4": isDesktopSidebarOpen,
          "md:w-full": !isDesktopSidebarOpen,
        })}
      >
        <StatusBar
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
          lists={lists}
          selectedListId={selectedListId}
          listName={listName}
          setListName={setListName}
          handleListNameChange={handleListNameChange}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <div className="flex-grow overflow-y-auto px-4 mt-16">
          {selectedList && viewMode === "list" && (
            <ListEditor
              state={selectedList}
              handleUpdateItem={handleUpdateItem}
              handleAddItem={handleAddItem}
              handleDeleteItem={handleDeleteItem}
              focusedItemId={focusedItemId}
              setFocusedItemId={setFocusedItemId}
            />
          )}
          {selectedListId && viewMode === "gantt" && (
            <GanttView listId={selectedListId} />
          )}
        </div>
      </div>
    </main>
  );
}