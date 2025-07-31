import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Doc } from "@/lib/convex";
import { ChevronDown, ChevronRight, List, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamManagerProps {
  teams: (Doc<"teams"> & { role: string })[];
  teamLists: Doc<"lists">[];
  handleCreateList: (teamId: Doc<"teams">["_id"]) => void;
  handleDeleteList: (listId: Doc<"lists">["_id"]) => void;
  setSelectedListId: (listId: Doc<"lists">["_id"]) => void;
  setListName: (name: string) => void;
  selectedListId: Doc<"lists">["_id"] | null;
}

export function TeamManager({
  teams,
  teamLists,
  handleCreateList,
  handleDeleteList,
  setSelectedListId,
  setListName,
  selectedListId,
}: TeamManagerProps) {
  const createTeam = useMutation(api.teams.createTeam);
  const deleteTeam = useMutation(api.teams.deleteTeam);
  const sendInvitation = useMutation(api.teams.sendInvitation);
  const [expandedTeamIds, setExpandedTeamIds] = useState<Set<string>>(new Set());
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteeUsername, setInviteeUsername] = useState("");
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<
    Doc<"teams">["_id"] | null
  >(null);

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeamIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const handleCreateTeam = async () => {
    if (newTeamName.trim() !== "") {
      await createTeam({ name: newTeamName.trim() });
      setNewTeamName("");
    }
  };

  const handleDeleteTeam = async (teamId: Doc<"teams">["_id"]) => {
    await deleteTeam({ teamId });
  };

  const handleSendInvitation = async (teamId: Doc<"teams">["_id"]) => {
    if (inviteeUsername.trim() !== "") {
      try {
        await sendInvitation({
          teamId,
          inviteeUsername: inviteeUsername.trim(),
        });
        setInviteeUsername("");
        setSelectedTeamForInvite(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div>
      {teams.map((team) =>
        team ? (
          <div key={team._id} className="mb-0">
            <div 
              className="flex items-center justify-start text-start cursor-pointer p-1.5 m-0 rounded hover:bg-accent/30"
              onClick={() => toggleTeamExpand(team._id)}
            >
              {expandedTeamIds.has(team._id)  ? (
                <ChevronDown className="size-4 mr-3" />
              ) : (
                <ChevronRight className="size-4 mr-3" />
              )}
              <span className="text-sm">{team.name}</span>
              {team.role === "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTeam(team._id)}
                  className="h-6 w-6 ml-auto"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {expandedTeamIds.has(team._id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="m-0 p-0"
                >
                  <ul className="m-0">
                    {teamLists
                      .filter((list) => list.teamId === team._id)
                      .map((list) => (
                        <li
                          key={list._id}
                          className={`flex items-center justify-start text-start cursor-pointer p-1.5 m-0 ml-7 rounded hover:bg-accent/30 ${
                            selectedListId === list._id
                              ? "bg-muted/50 text-muted-foreground"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedListId(list._id);
                            setListName(list.name);
                          }}
                        >
                          <List className="size-4 mr-3" />
                          <span className="text-sm">{list.name}</span>
                          {team.role === "admin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteList(list._id);
                              }}
                              className="h-6 w-6 ml-auto"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </li>
                      ))}
                    <li
                      className="flex items-center justify-start text-start cursor-pointer p-1.5 m-0 ml-7 rounded hover:bg-accent/30"
                      onClick={() => handleCreateList(team._id)}
                    >
                      <Plus className="size-4 mr-3" />
                      <span className="text-sm">add a team list</span>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
            {team.role === "admin" && (
              <div className="mt-2 ml-7">
                <Input
                  value={
                    selectedTeamForInvite === team._id ? inviteeUsername : ""
                  }
                  onChange={(e) => {
                    setSelectedTeamForInvite(team._id);
                    setInviteeUsername(e.target.value);
                  }}
                  placeholder="invite user..."
                  className="h-8 bg-input/30"
                />
                <Button
                  onClick={() => handleSendInvitation(team._id)}
                  size="sm"
                  className="mt-1"
                >
                  invite
                </Button>
              </div>
            )}
          </div>
        ) : null,
      )}
      <Input
        value={newTeamName}
        onChange={(e) => setNewTeamName(e.target.value)}
        placeholder="new team name..."
        className="my-2 bg-input/30"
      />
      <div
        className="flex items-center justify-start text-start cursor-pointer p-1.5 m-0 rounded hover:bg-accent/30"
        onClick={handleCreateTeam}
      >
        <Plus className="size-4 mr-3" />
        <span className="text-sm">create a new team</span>
      </div>
    </div>
  );
}

