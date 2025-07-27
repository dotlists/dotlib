// src/components/TeamMember.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Button } from "./ui/button";
import type { Doc } from "@/lib/convex";

interface TeamMemberProps {
  team: Doc<"teams">;
  viewerRole: string;
}

export function TeamMember({ team, viewerRole }: TeamMemberProps) {
  const members = useQuery(api.teams.getTeamMembers, { teamId: team._id });
  const removeMember = useMutation(api.teams.removeMemberFromTeam);

  const handleRemoveMember = (memberId: string) => {
    removeMember({ teamId: team._id, memberId });
  };

  return (
    <ul className="pl-4 mt-2 space-y-1">
      {members?.map((member) => (
        <li key={member._id} className="flex items-center justify-between">
          <span className="text-sm text-foreground">
            {member.username} ({member.role})
          </span>
          {viewerRole === "admin" && member.userId !== team.ownerId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6"
              onClick={() => handleRemoveMember(member.userId)}
            >
              remove
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
