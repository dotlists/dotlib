import { ChevronsLeft, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { TeamManager } from "./TeamManager";
import type { Doc, Id } from "@/lib/convex";

type ConvexItem = Doc<"items"> & { uuid: Id<"items"> };

interface SidebarProps {
  validTeams: ({
    _id: Id<"teams">;
    _creationTime: number;
    name: string;
    ownerId: string;
  } & {
      role: string;
  })[] | undefined;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (isOpen: boolean) => void;
  setIsDesktopSidebarOpen: (isOpen: boolean) => void;
  personalLists: Array<{
    id: Id<"lists">;
    name: string;
    nodes: Array<ConvexItem>;
  }>;
  teamLists: Doc<"lists">[];
  selectedListId: Id<"lists"> | null;
  setSelectedListId: (id: Id<"lists">) => void;
  setListName: (name: string) => void;
  handleDeleteList: (id: Id<"lists">) => void;
  handleCreateList: () => void;
  isSimpleMode: boolean;
}

export function Sidebar ({
  validTeams,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  setIsDesktopSidebarOpen,
  personalLists,
  teamLists,
  selectedListId,
  setSelectedListId,
  setListName,
  handleDeleteList,
  handleCreateList,
  isSimpleMode
}: SidebarProps) {
  return (
    <>
      <div className="container mb-3 not-last:flex flex-row">
        <div className="container -ml-18 flex items-center">
          <img src="/favicon.ico" alt="logo" className="h-8 w-8 mr-2" />
          <span className="font-bold text-xl font-heading">dotlists</span>
        </div>
        <Button
          className="-mr-7"
          variant="ghost"
          size="icon"
          onClick={() => isMobileDrawerOpen ? setIsMobileDrawerOpen(false) : setIsDesktopSidebarOpen(false)}
        >
          <ChevronsLeft className="h-5 w-5" />
        </Button>
      </div>
      <hr className="my-4 bg-accent h-0.5" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-heading">personal lists</h2>
      </div>
      <ul>
        {personalLists.map((list) => (
          <li
            key={list.id}
            className={`flex items-center justify-between cursor-pointer p-2 rounded ${
              selectedListId === list.id
                ? "bg-muted/50 text-muted-foreground"
                : ""
            }`}
            onClick={() => {
              setSelectedListId(list.id);
              setListName(list.name);
              setIsMobileDrawerOpen(false);
            }}
          >
            <span>{list.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteList(list.id);
              }}
              className="h-6 w-6"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" onClick={() => handleCreateList()} className="mt-1">
        + new personal list <span className="ml-2 text-xs text-muted-foreground">(ctrl+shift+l)</span>
      </Button>
      {!isSimpleMode && (
        <>
          <hr className="my-4 bg-accent h-0.5" />
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
}