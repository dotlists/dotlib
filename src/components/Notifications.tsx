// src/components/Notifications.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";

export function Notifications() {
  const data = useQuery(api.notifications.getNotifications);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const acceptInvitation = useMutation(api.teams.acceptInvitation);
  const declineInvitation = useMutation(api.teams.declineInvitation);

  const notifications = data?.notifications ?? [];
  const invitations = data?.invitations ?? [];
  const unreadCount = notifications.length + invitations.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        {unreadCount === 0 && (
          <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
        )}
        {notifications.map((n) => (
          <DropdownMenuItem
            key={n._id}
            onClick={() => markAsRead({ notificationId: n._id })}
          >
            <div className="text-sm">
              <span className="font-semibold">{n.actorName}</span>
              {n.type === "assignment" && " assigned a task to you."}
              {n.type === "comment" && " commented on a task."}
            </div>
          </DropdownMenuItem>
        ))}
        {invitations.length > 0 && notifications.length > 0 && <DropdownMenuSeparator />}
        {invitations.map((inv) => (
          <div key={inv._id} className="p-2 text-sm">
            <p>
              <span className="font-semibold">{inv.inviterName}</span> invited you to join{" "}
              <span className="font-semibold">{inv.teamName}</span>.
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => declineInvitation({ invitationId: inv._id })}
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => acceptInvitation({ invitationId: inv._id })}
              >
                Accept
              </Button>
            </div>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}