import type { Id } from "#convex/_generated/dataModel";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

interface StatusBarProps {
  lists: Array<{
    id: Id<"lists">;
    name: string;
    nodes: Array<{
      uuid: Id<"items">;
      text: string;
      state: "red" | "yellow" | "green";
    }>;
  }>;
  selectedListId: Id<"lists"> | null;
  setSelectedListId: (id: Id<"lists">) => void;
  listName: string;
  setListName: (name: string) => void;
  handleListNameChange: (name: string) => void;
  handleCreateList: () => void;
  handleDeleteList: () => void;
  handleReorderLists: (fromIdx: number, toIdx: number) => void;
  dragOverIdx: number | null;
  setDragOverIdx: (idx: number | null) => void;
}

export function StatusBar({
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
}: StatusBarProps) {
  const { signOut } = useAuthActions();
  const selectedList = lists.find((list) => list.id === selectedListId);

  if (!selectedList) {
    return (
      <div className="w-[100vw] h-[10vh] p-3">
        <div className="rounded-b-2xl rounded-t-lg border-3 overflow-hidden">
          <div className="flex px-3 py-1 items-center">
            <p className="text-lg text-muted-foreground">No list selected.</p>
            <Button onClick={handleCreateList} className="ml-auto">
              Create New List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const nodes = selectedList.nodes;
  const total = nodes.length || 1;
  const redCount = nodes.filter((n) => n.state === "red").length;
  const yellowCount = nodes.filter((n) => n.state === "yellow").length;
  const greenCount = nodes.filter((n) => n.state === "green").length;
  const redPct = (redCount / total) * 100;
  const yellowPct = (yellowCount / total) * 100;
  const greenPct = (greenCount / total) * 100;

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
              <Button
                variant="ghost"
                className="!ring-none !border-none !outline-none"
                size="icon"
                tabIndex={-1}
              >
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
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(idx);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragOverIdx !== null && dragOverIdx !== idx) {
                      handleReorderLists(dragOverIdx, idx);
                    }
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => {
                    setDragOverIdx(null);
                  }}
                  className={`cursor-grab select-none ${dragOverIdx === idx ? "opacity-50" : "opacity-100"} ${
                    selectedListId === list.id ? "font-bold " : ""
                  } ${dragOverIdx === idx ? " bg-accent" : ""}`}
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
              <DropdownMenuItem onClick={signOut}>
                log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
