import { ChevronsLeft, List, MoreVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { TeamManager } from "./TeamManager";
import type { Doc, Id } from "@/lib/convex";
import clsx from "clsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";

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
      <div className="container mb-2 -mt-1 not-last:flex flex-row">
        <div className="container -ml-17 flex items-center">
          <img src="/favicon.ico" alt="logo" className="size-7 mr-2" />
          <span className="font-bold text-lg font-heading pt-0.5">dotlists</span>
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
      <hr className="mt-2 mb-0 bg-accent border-accent border-b max-h-0.5" />
      <div className="flex items-center justify-between pt-3">
        <h2 className="text-base font-subheading">personal lists</h2>
      </div>
      <ul>
        {personalLists.map((list) => (
          <li
            key={list.id}
            className={clsx("flex transition-all items-center justify-start text-start cursor-pointer p-1.5 m-0 rounded",
              selectedListId === list.id
                ? "bg-muted/50 text-muted-foreground"
                : "hover:bg-accent/30"
            )}
            onClick={() => {
              setSelectedListId(list.id);
              setListName(list.name);
              setIsMobileDrawerOpen(false);
            }}
          >
            <List className="size-4 mr-3" />
            <span className="text-sm">{list.name}</span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(list.id);
                  }}
                  className="text-red-500 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-red-500">delete list</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
        <li
          className="transition-all flex items-center justify-start text-start cursor-pointer p-1.5 m-0 rounded hover:bg-accent/30"
          onClick={() => handleCreateList()}
        >
          <Plus className="size-4 mr-3" />
          <span className="text-sm">add a list <span className="ml-2 text-xs text-muted-foreground">(ctrl+shift+l)</span></span>
        </li>
      </ul>
      
      {/* team sidebar */}
      {!isSimpleMode && (
        <>
          <hr className="mt-2 mb-0 bg-accent border-accent border-b max-h-0.5" />
          <div className="flex items-center justify-between pt-3 mb-2.5">
            <h2 className="text-base font-subheading">teams</h2>
          </div>
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