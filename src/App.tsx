import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "./components/ui/textarea";
import { Button } from "./components/ui/button";
import { v4 as randomUUID } from "uuid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { ChevronDown, List } from "lucide-react";
import "react";
import { Input } from "./components/ui/input";
import { SignIn } from "./components/auth/SignIn";
import { useConvexAuth } from "convex/react";

// types
type Color = "red" | "yellow" | "green";
type Node = { text: string; state: Color; uuid: string };
type List = { id: number; name: string; nodes: Node[] };

const stateOrder = { red: 0, yellow: 1, green: 2 };
const stateOrderReversed: Color[] = ["red", "yellow", "green"];

function StatusBar({
  state,
  setState,
  lists,
  selectedListId,
  setSelectedListId,
  listName,
  setListName,
  handleListNameChange,
  handleCreateList,
  handleDeleteList,
  handleReorderLists,
  dragOverIdx,
  setDragOverIdx,
}: {
  state: List;
  setState: (_: List) => void;
  lists: List[];
  selectedListId: number;
  setSelectedListId: (id: number) => void;
  listName: string;
  setListName: (name: string) => void;
  handleListNameChange: (name: string) => void;
  handleCreateList: () => void;
  handleDeleteList: () => void;
  handleReorderLists: (fromIdx: number, toIdx: number) => void;
  dragOverIdx: number | null;
  setDragOverIdx: (idx: number | null) => void;
}) {
  const addNode = useCallback(() => {
    // clear any currently empty nodes
    const newNodes = state.nodes.filter((n) => n.text.trim() !== "");
    const newNode: Node = { text: "", state: "red", uuid: randomUUID() };
    setState({ ...state, nodes: [...newNodes, newNode] });
    setTimeout(() => {
      const el = document.getElementById(newNode.uuid);
      if (el) {
        const textarea = el.querySelector("textarea");
        if (textarea) {
          textarea.focus();
        }
      }
    }, 30);
  }, [state, setState]);
  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.metaKey && e.key === "Enter") {
        e.preventDefault();
        addNode();
      }
    });
  }, [addNode]);
  const nodes = state.nodes;
  const total = nodes.length || 1;
  const redCount = nodes.filter((n) => n.state === "red").length;
  const yellowCount = nodes.filter((n) => n.state === "yellow").length;
  const greenCount = nodes.filter((n) => n.state === "green").length;
  const redPct = (redCount / total) * 100;
  const yellowPct = (yellowCount / total) * 100;
  const greenPct = (greenCount / total) * 100;

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  return (
    <div className="w-[100vw] h-[10vh] p-3">
      <div className="rounded-b-2xl rounded-t-lg border-3 overflow-hidden">
        <div className="flex px-3 py-1">
          <Input
            id="list-name-input"
            className="font-lora w-full text-xl px-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            onBlur={(e) => handleListNameChange(e.target.value)}
            style={{
              fontFamily: "'Lora', serif",
              fontWeight: 500,
            }}
            autoComplete="off"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="!ring-none !border-none !outline-none" size="icon" tabIndex={-1}>
                <ChevronDown className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white p-3 rounded-lg">
              {lists.map((list, idx) => (
                <DropdownMenuItem
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  draggable
                  onDragStart={(e) => {
                    setDraggedIdx(idx);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(idx);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIdx !== null && draggedIdx !== idx) {
                      handleReorderLists(draggedIdx, idx);
                    }
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={`cursor-grab select-none ${draggedIdx === idx ? "opacity-50" : "opacity-100"} ${selectedListId === list.id ? "font-bold " : ""} ${
                    dragOverIdx === idx &&
                    draggedIdx !== null &&
                    draggedIdx !== idx
                      ? " bg-accent"
                      : ""
                  }`}
                >
                  <span className="mr-auto">
                    {list.name || (
                      <span className="italic text-muted-foreground">
                        Untitled
                      </span>
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={handleCreateList}>
                + create new list
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteList}
                className="text-red-500"
              >
                delete current list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" className="ml-auto" onClick={addNode}>
            Add item
          </Button>
        </div>
        <div className="flex h-12 w-full">
          <div
            className="transition-all duration-100"
            style={{
              width: `${redPct}%`,
              backgroundColor: redCount > 0 ? "#ef4444" : "transparent",
              transition: "width 0.3s",
            }}
          />
          <div
            className="transition-all duration-100"
            style={{
              width: `${yellowPct}%`,
              backgroundColor: yellowCount > 0 ? "#fde047" : "transparent",
              transition: "width 0.3s",
            }}
          />
          <div
            className="transition-all duration-100"
            style={{
              width: `${greenPct}%`,
              backgroundColor: greenCount > 0 ? "#4ade80" : "transparent",
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>
    </div>
  );
}
function ListEditor({
  state,
  setState,
}: {
  state: List;
  setState: (_: List) => void;
}) {
  const sortedNodes = state.nodes.slice().sort((a, b) => {
    const stateDiff = stateOrder[a.state] - stateOrder[b.state];
    if (stateDiff !== 0) return stateDiff;
    return a.text.localeCompare(b.text);
  });
  const setNode = (index: number, newNode: Node) => {
    const newNodes = [...state.nodes];
    newNodes[index] = newNode;
    setState({ ...state, nodes: newNodes });
  };
  const deleteNode = (index: number) => {
    const newNodes = [...state.nodes];
    newNodes.splice(index, 1);
    setState({ ...state, nodes: newNodes });
  };
  return (
    <motion.ul className="h-[90vh] w-[100vw] pr-3 mb-0 overflow-y-scroll overflow-x-hidden">
      <AnimatePresence>
        {sortedNodes.map((node) => {
          const colorClass =
            node.state === "red"
              ? "bg-red-500"
              : node.state === "yellow"
                ? "bg-yellow-500"
                : "bg-green-500";
          const index = state.nodes.findIndex((n) => n == node);
          return (
            <motion.li
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex hover:bg-gray-100 rounded-xl my-2 py-2"
              key={index}
              id={node.uuid}
            >
              <div
                onClick={() => {
                  const newState = (stateOrder[node.state] + 1) % 3;
                  setNode(index, {
                    ...node,
                    state: stateOrderReversed[newState],
                  });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const newState = (stateOrder[node.state] + 2) % 3;
                  setNode(index, {
                    ...node,
                    state: stateOrderReversed[newState],
                  });
                }}
                className={`w-10 min-h-[100%] mr-5 rounded-full hover:blur-xs transition-all duration-100 ${colorClass}`}
              ></div>
              <Textarea
                id={`item-${index}`}
                value={node.text}
                onChange={(e) => {
                  const newNode = { ...node, text: e.target.value };
                  setNode(index, newNode);
                }}
                className="text-xl focus:outline-none w-full focus:ring-none"
                style={{ resize: "none", overflowY: "auto" }}
                rows={1}
                ref={(el) => {
                  // This ref callback runs on mount. We can trigger the resize here.
                  if (el) {
                    el.style.height = "auto"; // Reset height
                    el.style.height = el.scrollHeight + "px"; // Set to content height
                  }
                }}
                onLoad={(e) => {
                  const textarea = e.currentTarget;
                  textarea.rows = null as unknown as number;
                }}
                onInput={(e) => {
                  const textarea = e.currentTarget;
                  textarea.style.height = "auto"; // Reset height to recalculate scrollHeight
                  textarea.style.height = textarea.scrollHeight + "px"; // Set height to match content
                }}
                onBlur={(e) => {
                  const trimmed = e.currentTarget.value.trim();
                  if (trimmed === "") {
                    deleteNode(index);
                  } else if (trimmed !== node.text) {
                    setNode(index, { ...node, text: trimmed });
                  }
                  const textarea = e.currentTarget;
                  textarea.style.height = "auto";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && node.text === "") {
                    e.preventDefault();
                    deleteNode(index);
                  }
                }}
              />
              <Button
                onClick={() => deleteNode(index)}
                variant="destructive"
                className="h-7 rounded-full cursor-pointer mr-3"
              >
                Delete
              </Button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  );
}

export default function App() {
  const { isAuthenticated } = useConvexAuth();

  const [selectedListId, setSelectedListId] = useState<number>(1);
  const [listName, setListName] = useState<string>("");
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [lists, setLists] = useState<List[]>([
    {
      id: 1,
      name: "Todo",
      nodes: [
        { text: "Can't stop thinking about if and when I die", state: "red" },
        {
          text: "For now I see that 'if' and 'when' are truly different cries",
          state: "yellow",
        },
        {
          text: "For if is purely panic and when is solemn sorrow",
          state: "yellow",
        },
        {
          text: "And one invades today while the other spies tomorrow",
          state: "green",
        },
        { text: "We're surrounded and we're hounded", state: "red" },
        { text: "There's no above, or under, or around it", state: "yellow" },
        {
          text: "For above is blind belief and under is sword to sleeve",
          state: "yellow",
        },
        {
          text: "And around is scientific miracle, let's pick above and see",
          state: "green",
        },
        {
          text: "For if and when we go above, the question still remains",
          state: "red",
        },
        {
          text: "Are we still in love and is it possible we feel the same?",
          state: "yellow",
        },
        {
          text: "And that's when going under starts to take my wonder",
          state: "yellow",
        },
        { text: "But until that time, I'll try to sing this", state: "green" },
        { text: "If I keep moving, they won't know", state: "red" },
        { text: "I'll morph to someone else", state: "yellow" },
        { text: "Defense mechanism mode", state: "green" },
        { text: "I'll morph to someone else", state: "yellow" },
        { text: "Defense mechanism mode", state: "green" },
        {
          text: "For now I see that 'if' and 'when' are truly different cries",
          state: "yellow",
        },
        {
          text: "For if is purely panic and when is solemn sorrow",
          state: "yellow",
        },
        {
          text: "And one invades today while the other spies tomorrow",
          state: "green",
        },
        { text: "We're surrounded and we're hounded", state: "red" },
        { text: "There's no above, or under, or around it", state: "yellow" },
        {
          text: "For above is blind belief and under is sword to sleeve",
          state: "yellow",
        },
        {
          text: "And around is scientific miracle, let's pick above and see",
          state: "green",
        },
        {
          text: "For if and when we go above, the question still remains",
          state: "red",
        },
        {
          text: "Are we still in love and is it possible we feel the same?",
          state: "yellow",
        },
        {
          text: "And that's when going under starts to take my wonder",
          state: "yellow",
        },
        { text: "But until that time, I'll try to sing this", state: "green" },
        { text: "If I keep moving, they won't know", state: "red" },
        { text: "I'll morph to someone else", state: "yellow" },
        { text: "Defense mechanism mode", state: "green" },
        { text: "I'll morph to someone else", state: "yellow" },
        { text: "Defense mechanism mode", state: "green" },
      ].map((e) => ({ ...e, uuid: randomUUID() }) as Node),
    },
    {
      id: 2,
      name: "In Progress",
      nodes: [
        { text: "Write report", state: "yellow" },
        { text: "Fix bug #42", state: "red" },
      ].map((e) => ({ ...e, uuid: randomUUID() }) as Node),
    },
    {
      id: 3,
      name: "Done",
      nodes: [{ text: "Submit taxes", state: "green" }].map(
        (e) => ({ ...e, uuid: randomUUID() }) as Node,
      ),
    },
  ]);

  const selectedList =
    lists.find((list) => list.id === selectedListId) || lists[0];

  const handleListNameChange = (name: string) => {
    setLists(
      lists.map((list) =>
        list.id === selectedListId ? { ...list, name } : list,
      ),
    );
  };

  const handleCreateList = () => {
    const newId = Math.max(...lists.map((l) => l.id)) + 1;
    const newList: List = {
      id: newId,
      name: "New List",
      nodes: [],
    };
    setLists([...lists, newList]);
    setSelectedListId(newId);
    setListName("New List");
  };

  const handleDeleteList = () => {
    if (lists.length <= 1) return;
    const filteredLists = lists.filter((list) => list.id !== selectedListId);
    setLists(filteredLists);
    setSelectedListId(filteredLists[0].id);
    setListName(filteredLists[0].name);
  };

  const handleReorderLists = (fromIdx: number, toIdx: number) => {
    const newLists = [...lists];
    const [movedList] = newLists.splice(fromIdx, 1);
    newLists.splice(toIdx, 0, movedList);
    setLists(newLists);
  };

  // Update listName when selectedListId changes
  React.useEffect(() => {
    const selected = lists.find((list) => list.id === selectedListId);
    if (selected) {
      setListName(selected.name);
    }
  }, [selectedListId, lists]);

  return (
    <>
      {isAuthenticated ? (
        <main className="flex flex-col fixed overflow-y-hidden">
          <StatusBar
            state={selectedList}
            setState={(newState) => {
              setLists(
                lists.map((list) => (list.id === newState.id ? newState : list)),
              );
            }}
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
          <ListEditor
            state={selectedList}
            setState={(newList) => {
              setLists(
                lists.map((list) => (list.id === newList.id ? newList : list)),
              );
            }}
          />
        </main>
      ) : (
        <SignIn />
      )}
    </>
  );
}
