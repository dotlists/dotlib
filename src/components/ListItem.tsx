import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import type { Doc, Id } from "@/lib/convex";
import { useAction, useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { Sparkles, Calendar as CalendarIcon, User, Trash2, MoreVertical, MessageSquare } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu";
import { format } from "date-fns";
import clsx from "clsx";
import { CommentSection } from "./CommentSection";
import { useSettings } from "@/contexts/SettingsContext";

interface ListItemProps {
  node: Doc<"items"> & { uuid: Id<"items"> };
  handleUpdateItem: (
    id: Id<"items">,
    updates: Partial<Doc<"items">>,
  ) => void;
  handleDeleteItem: (id: Id<"items">) => void;
  focusedItemId: Id<"items"> | null;
  setFocusedItemId: (id: Id<"items"> | null) => void;
  listId: Id<"lists">;
  teamId?: Id<"teams">;
}

const stateOrder = { red: 0, yellow: 1, green: 2 } as const;
const stateOrderReversed = ["red", "yellow", "green"] as const;

export function ListItem({
  node,
  handleUpdateItem,
  handleDeleteItem,
  focusedItemId,
  setFocusedItemId,
  listId,
  teamId,
}: ListItemProps) {
  const { isSimpleMode } = useSettings();
  const [text, setText] = useState(node.text);
  const [isCommenting, setIsCommenting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const breakdownTask = useAction(api.gemini.breakdownTask);
  const teamMembers = useQuery(
    api.teams.getTeamMembers,
    teamId ? { teamId } : "skip",
  );

  const handleBreakdownTask = () => {
    breakdownTask({
      listId,
      taskId: node.uuid,
      taskText: text,
    });
  };

  useEffect(() => {
    if (node.uuid === focusedItemId) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
      setFocusedItemId(null);
    }
  }, [focusedItemId, node.uuid, setFocusedItemId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (text !== node.text) {
        handleUpdateItem(node.uuid, { text });
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [text, node.text, node.uuid, handleUpdateItem]);

  const colorClass =
    node.state === "red"
      ? "bg-red-500"
      : node.state === "yellow"
      ? "bg-yellow-500"
      : "bg-green-500";

  const assignee = teamMembers?.find(
    (member) => member.userId === node.assigneeId,
  );

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col hover:bg-gray-100 rounded-lg my-1 p-1"
      key={node.uuid}
      id={node.uuid}
    >
      <div className="flex items-center">
        <div
          onClick={() => {
            const currentState = node.state as keyof typeof stateOrder;
            const newState = (stateOrder[currentState] + 1) % 3;
            handleUpdateItem(node.uuid, {
              state: stateOrderReversed[newState],
            });
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            const currentState = node.state as keyof typeof stateOrder;
            const newState = (stateOrder[currentState] + 2) % 3;
            handleUpdateItem(node.uuid, {
              state: stateOrderReversed[newState],
            });
          }}
          className={clsx(
            "w-6 h-6 mx-2 rounded-full transition-all duration-100 cursor-pointer hover:blur-xs flex-shrink-0",
            colorClass,
          )}
        ></div>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="text-sm md:text-base self-center focus:outline-none w-full focus:ring-0 border-none bg-transparent resize-none"
          rows={1}
          onInput={(e) => {
            const textarea = e.currentTarget;
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
          }}
          onBlur={(e) => {
            const trimmed = e.currentTarget.value.trim();
            if (trimmed === "") {
              handleDeleteItem(node.uuid);
            } else if (trimmed !== node.text) {
              handleUpdateItem(node.uuid, { text: trimmed });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && text === "") {
              e.preventDefault();
              handleDeleteItem(node.uuid);
            }
          }}
        />
        <div className="flex items-center self-center">
          {node.dueDate && (
            <span className="text-xs text-gray-500 mr-2 whitespace-nowrap">
              {format(new Date(node.dueDate), "MMM d")}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsCommenting(!isCommenting)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {isCommenting ? "Hide Comments" : "Show Comments"}
              </DropdownMenuItem>
              
              {!isSimpleMode && teamId && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <User className="mr-2 h-4 w-4" />
                    {assignee ? `Assign: ${assignee.username}` : "Assign"}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                      <DropdownMenuItem onSelect={() => handleUpdateItem(node.uuid, { assigneeId: undefined })}>
                        Unassigned
                      </DropdownMenuItem>
                      {teamMembers?.map((member) => (
                        <DropdownMenuItem
                          key={member.userId}
                          onSelect={() => handleUpdateItem(node.uuid, { assigneeId: member.userId })}
                        >
                          {member.username}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Set Due Date
                  </DropdownMenuItem>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <DayPicker
                    mode="single"
                    selected={node.dueDate ? new Date(node.dueDate) : undefined}
                    onSelect={(date) =>
                      handleUpdateItem(node.uuid, { dueDate: date?.getTime() })
                    }
                  />
                </PopoverContent>
              </Popover>
              
              {!isSimpleMode && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleBreakdownTask}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Breakdown Task
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDeleteItem(node.uuid)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isCommenting && <CommentSection itemId={node.uuid} />}
    </motion.li>
  );
}
