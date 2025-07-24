import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Doc } from "@/lib/convex";

interface TeamManagerProps {
  teams: Doc<"teams">[];
  teamLists: Doc<"lists">[];
  handleCreateList: (teamId: Doc<"teams">["_id"]) => void;
  setSelectedListId: (listId: Doc<"lists">["_id"]) => void;
  setListName: (name: string) => void;
  selectedListId: Doc<"lists">["_id"] | null;
}

export function TeamManager({
  teams,
  teamLists,
  handleCreateList,
  setSelectedListId,
  setListName,
  selectedListId,
}: TeamManagerProps) {
  const createTeam = useMutation(api.teams.createTeam);
  const sendInvitation = useMutation(api.teams.sendInvitation);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteeUsername, setInviteeUsername] = useState("");
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<
    Doc<"teams">["_id"] | null
  >(null);

  const handleCreateTeam = async () => {
    if (newTeamName.trim() !== "") {
      await createTeam({ name: newTeamName.trim() });
      setNewTeamName("");
    }
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
      <h2 className="text-xl font-bold mb-4">Teams</h2>
      {teams.map((team) => (
        <div key={team._id} className="mb-4">
          <h3 className="font-bold">{team.name}</h3>
          <ul>
            {teamLists
              .filter((list) => list.teamId === team._id)
              .map((list) => (
                <li
                  key={list._id}
                  className={`cursor-pointer p-2 rounded ${
                    selectedListId === list._id
                      ? "bg-muted/50 text-muted-foreground"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedListId(list._id);
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
            onClick={() => handleCreateList(team._id)}
            className="mt-1"
          >
            + New Team List
          </Button>
          <div className="mt-2">
            <Input
              value={
                selectedTeamForInvite === team._id ? inviteeUsername : ""
              }
              onChange={(e) => {
                setSelectedTeamForInvite(team._id);
                setInviteeUsername(e.target.value);
              }}
              placeholder="Invite user..."
              className="h-8"
            />
            <Button
              onClick={() => handleSendInvitation(team._id)}
              size="sm"
              className="mt-1"
            >
              Invite
            </Button>
          </div>
        </div>
      ))}
      <div className="mt-4 pt-4 border-t">
        <Input
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="New team name..."
          className="mb-2"
        />
        <Button onClick={handleCreateTeam} size="sm">
          Create Team
        </Button>
      </div>
    </div>
  );
}
