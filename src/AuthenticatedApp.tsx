import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "./components/StatusBar";
import { ListEditor } from "./components/ListEditor";
import { TeamManager } from "./components/TeamManager";
import { CreateUsername } from "./components/CreateUsername";

import { api, type Id, type Doc } from "@/lib/convex";
import { Button } from "./components/ui/button";

type ConvexItem = {
  uuid: Id<"items">;
  text: string;
  state: "red" | "yellow" | "green";
};

type ConvexList = Doc<"lists"> & {
  id: Id<"lists">;
  nodes: ConvexItem[];
};

export default function AuthenticatedApp() {
  const userProfile = useQuery(api.users.getMyUserProfile);
  const rawLists = useQuery(api.lists.getLists);
  const teams = useQuery(api.teams.getTeams);

  const createList = useMutation(api.lists.createList);
  const updateList = useMutation(api.lists.updateList);
  const createItem = useMutation(api.lists.createItem);
  const updateItem = useMutation(api.lists.updateItem);
  const deleteItem = useMutation(api.lists.deleteItem);

  const lists: ConvexList[] = useMemo(
    () =>
      rawLists?.map((list) => ({
        ...list,
        id: list._id,
        nodes:
          list.nodes?.map((node) => ({
            ...node,
            uuid: node._id,
            state: node.state as "red" | "yellow" | "green",
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

  const selectedList = lists.find(
    (list: ConvexList) => list.id === selectedListId,
  );

  useEffect(() => {
    if (lists.length === 0) {
      if (selectedListId !== null) {
        setSelectedListId(null);
        setListName("");
      }
    } else {
      if (!selectedListId || !lists.some((list) => list.id === selectedListId)) {
        setSelectedListId(lists[0].id);
        setListName(lists[0].name);
      }
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
    }
  };

  const handleAddItem = async (
    text: string,
    state: "red" | "yellow" | "green" = "red",
  ) => {
    if (selectedListId) {
      await createItem({ listId: selectedListId, text, state });
    }
  };

  const handleUpdateItem = async (
    id: Id<"items">,
    updates: { text?: string; state?: "red" | "yellow" | "green" },
  ) => {
    await updateItem({ id, ...updates });
  };

  const handleDeleteItem = async (id: Id<"items">) => {
    await deleteItem({ id });
  };

  if (
    userProfile === undefined ||
    rawLists === undefined ||
    teams === undefined
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
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

  const validTeams = teams.filter(Boolean);

  return (
    <main className="flex">
      <div className="w-1/4 p-4 border-r h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Personal Lists</h2>
        <ul>
          {personalLists.map((list) => (
            <li
              key={list.id}
              className={`cursor-pointer p-2 rounded ${
                selectedListId === list.id
                  ? "bg-muted/50 text-muted-foreground"
                  : ""
              }`}
              onClick={() => {
                setSelectedListId(list.id);
                setListName(list.name);
              }}
            >
              {list.name}
            </li>
          ))}
        </ul>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCreateList()}
          className="mt-1"
        >
          + New Personal List
        </Button>
        <hr className="my-4" />
        <TeamManager
          teams={validTeams}
          teamLists={teamLists}
          handleCreateList={handleCreateList}
          setSelectedListId={setSelectedListId}
          setListName={setListName}
          selectedListId={selectedListId}
        />
      </div>
      <div className="w-3/4 flex flex-col right-0">
        <StatusBar
          lists={lists}
          selectedListId={selectedListId}
          listName={listName}
          setListName={setListName}
          handleListNameChange={handleListNameChange}
        />
        <div className="mt-8 px-4">
          {selectedList && (
            <ListEditor
              state={selectedList}
              handleUpdateItem={handleUpdateItem}
              handleAddItem={handleAddItem}
              handleDeleteItem={handleDeleteItem}
            />
          )}
        </div>
      </div>
    </main>
  );
}
