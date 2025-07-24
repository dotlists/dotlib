// src/components/InvitationDropdown.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { BellIcon } from "lucide-react";

export function InvitationDropdown() {
  const invitations = useQuery(api.teams.getPendingInvitations);
  const acceptInvitation = useMutation(api.teams.acceptInvitation);
  const declineInvitation = useMutation(api.teams.declineInvitation);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {invitations && invitations.length > 0 && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        {invitations && invitations.length > 0 ? (
          invitations.map((invitation) => (
            <DropdownMenuItem
              key={invitation._id}
              className="flex flex-col items-start p-2"
            >
              <p className="font-semibold">
                Invite to {invitation.teamName}
              </p>
              <p className="text-sm text-muted-foreground">
                From: {invitation.inviterName}
              </p>
              <div className="flex gap-2 mt-2 self-end">
                <Button
                  size="sm"
                  onClick={() =>
                    acceptInvitation({ invitationId: invitation._id })
                  }
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    declineInvitation({ invitationId: invitation._id })
                  }
                >
                  Decline
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem>No new invitations</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
