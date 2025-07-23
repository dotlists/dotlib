import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "./components/StatusBar";
import { ListEditor } from "./components/ListEditor";

import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";
import { Button } from "./components/ui/button";

type ConvexItem = {
  uuid: Id<"items">;
  text: string;
  state: "red" | "yellow" | "green";
};

type ConvexList = {
  id: Id<"lists">;
  name: string;
  nodes: ConvexItem[];
};

export default function AuthenticatedApp() {
  const rawLists = useQuery(api.lists.getLists);

  const createList = useMutation(api.lists.createList);
  const updateList = useMutation(api.lists.updateList);
  const deleteList = useMutation(api.lists.deleteList);
  const createItem = useMutation(api.lists.createItem);
  const updateItem = useMutation(api.lists.updateItem);
  const deleteItem = useMutation(api.lists.deleteItem);

  const lists: ConvexList[] = (rawLists === undefined || rawLists === null || !Array.isArray(rawLists))
    ? []
    : rawLists
        .filter(Boolean) // Ensure each list is not null or undefined
        .map((list: any) => {
          const mappedList = {
            id: list._id ? list._id.toString() : `invalid-id-${idx}`, // Ensure id is always a string, with fallback
            ...list, // Spread original list first
            nodes: (list && Array.isArray(list.nodes)) ? list.nodes.map((node: any) => ({
              ...node,
              state: node.state as "red" | "yellow" | "green",
            })) : [], // Ensure nodes is always an array and its items are mapped
          };
          console.log('AuthenticatedApp: mapped list for StatusBar', mappedList, 'original _id:', list._id, 'mapped id:', mappedList.id);
          return mappedList;
        });

  const [selectedListId, setSelectedListId] = useState<Id<"lists"> | null>(
    null,
  );
  const [listName, setListName] = useState<string>("");
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const selectedList = lists.find((list: ConvexList) => list.id === selectedListId);

  useEffect(() => {
    console.log('AuthenticatedApp useEffect: lists', lists, 'selectedListId', selectedListId);
    if (lists.length === 0) {
      if (selectedListId !== null) {
        setSelectedListId(null);
        setListName("");
      }
    } else {
      if (!selectedListId || !lists.some(list => list.id === selectedListId)) {
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

  const handleCreateList = async () => {
    const result = await createList({ name: "New List" });
    if (result) {
      setSelectedListId(result);
      setListName("New List");
    }
  };

  const handleDeleteList = async () => {
    if (lists.length <= 1 || !selectedListId) return;
    await deleteList({ id: selectedListId });
    if (lists.length > 0) {
      const newSelectedList = lists.find(
        (l: ConvexList) => l.id !== selectedListId,
      );
      if (newSelectedList) {
        setSelectedListId(newSelectedList.id);
        setListName(newSelectedList.name);
      }
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

  const handleReorderLists = async (_fromIdx: number, _toIdx: number) => {
    // Note: List reordering will be implemented later with a separate order field
  };

  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-8">No lists yet!</h1>
        <Button onClick={handleCreateList}>Create a new list</Button>
      </div>
    );
  }

  return (
    <main className="flex flex-col fixed overflow-y-hidden">
      <StatusBar
        lists={lists}
        selectedListId={selectedListId}
        setSelectedListId={setSelectedListId}
        listName={listName}
        setListName={setListName}
        handleListNameChange={handleListNameChange}
        handleCreateList={handleCreateList}
        handleDeleteList={handleDeleteList}
        handleReorderLists={handleReorderLists}
        dragOverIdx={dragOverIdx}
        setDragOverIdx={setDragOverIdx}
      />
      {selectedList && (
        <ListEditor
          state={selectedList}
          handleUpdateItem={handleUpdateItem}
          handleAddItem={handleAddItem}
          handleDeleteItem={handleDeleteItem}
        />
      )}
    </main>
  );
}