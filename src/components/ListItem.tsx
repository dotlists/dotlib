import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import type { Doc, Id } from "@/lib/convex";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  Sparkles,
  Calendar as CalendarIcon,
  User,
  Trash2,
  MoreVertical,
  MessageSquare,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
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
import { Input } from "./ui/input";

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

const subtaskStateOrder = { todo: 0, "in progress": 1, done: 2 } as const;
const subtaskStateOrderReversed = ["todo", "in progress", "done"] as const;

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
  const [isSubtasksVisible, setIsSubtasksVisible] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const breakdownTask = useAction(api.gemini.breakdownTask);
  const teamMembers = useQuery(
    api.teams.getTeamMembers,
    teamId ? { teamId } : "skip",
  );
  const subtasks = useQuery(api.subtasks.getSubtasks, { parentId: node.uuid });
  const createSubtask = useMutation(api.subtasks.createSubtask);
  const updateSubtask = useMutation(api.subtasks.updateSubtask);
  const deleteSubtask = useMutation(api.subtasks.deleteSubtask);

  const handleBreakdownTask = async () => {
    const subtaskStrings = await breakdownTask({
      listId,
      taskId: node.uuid,
      taskText: text,
    });
    if (subtaskStrings && subtaskStrings.length > 0) {
      for (const subtaskText of subtaskStrings) {
        await createSubtask({
          parentId: node.uuid,
          text: subtaskText,
          state: "todo",
        });
      }
      setIsSubtasksVisible(true);
    }
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

  const handleCreateSubtask = async () => {
    if (newSubtaskText.trim() !== "") {
      await createSubtask({
        parentId: node.uuid,
        text: newSubtaskText.trim(),
        state: "todo",
      });
      setNewSubtaskText("");
    }
  };

  let statusColor = node.state;
  if (subtasks && subtasks.length > 0) {
    const doneCount = subtasks.filter((s) => s.state === "done").length;
    const inProgressCount = subtasks.filter(
      (s) => s.state === "in progress",
    ).length;

    if (doneCount === subtasks.length) {
      statusColor = "green";
    } else if (doneCount > 0 || inProgressCount > 0) {
      statusColor = "yellow";
    } else {
      statusColor = "red";
    }
  }

  const colorClass =
    statusColor === "red"
      ? "bg-red-500"
      : statusColor === "yellow"
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
      className="flex flex-col hover:bg-muted/50 rounded-lg my-1 p-1"
      key={node.uuid}
      id={node.uuid}
    >
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsSubtasksVisible(!isSubtasksVisible)}
        >
          {isSubtasksVisible ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleDeleteItem(node.uuid)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsCommenting(!isCommenting)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {isCommenting ? "hide comments" : "show comments"}
              </DropdownMenuItem>

              {!isSimpleMode && teamId && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <User className="mr-2 h-4 w-4" />
                    {assignee ? `assign: ${assignee.username}` : "assign"}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onSelect={() =>
                        handleUpdateItem(node.uuid, { assigneeId: undefined })
                      }
                    >
                      unassigned
                    </DropdownMenuItem>
                    {teamMembers?.map((member) => (
                      <DropdownMenuItem
                        key={member.userId}
                        onSelect={() =>
                          handleUpdateItem(node.uuid, {
                            assigneeId: member.userId,
                          })
                        }
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
                    set due date
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
                    breakdown task
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isSubtasksVisible && (
        <div className="ml-12 mt-2">
          <ul>
            {subtasks?.map((subtask) => {
              const subtaskColorClass =
                subtask.state === "todo"
                  ? "bg-red-500"
                  : subtask.state === "in progress"
                  ? "bg-yellow-500"
                  : "bg-green-500";

              return (
                <li key={subtask._id} className="flex items-center">
                  <div
                    onClick={() => {
                      const currentState =
                        subtask.state as keyof typeof subtaskStateOrder;
                      const newState =
                        (subtaskStateOrder[currentState] + 1) % 3;
                      updateSubtask({
                        subtaskId: subtask._id,
                        state: subtaskStateOrderReversed[newState],
                      });
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const currentState =
                        subtask.state as keyof typeof subtaskStateOrder;
                      const newState =
                        (subtaskStateOrder[currentState] + 2) % 3;
                      updateSubtask({
                        subtaskId: subtask._id,
                        state: subtaskStateOrderReversed[newState],
                      });
                    }}
                    className={clsx(
                      "w-4 h-4 mx-2 rounded-full transition-all duration-100 cursor-pointer hover:blur-xs flex-shrink-0",
                      subtaskColorClass,
                    )}
                  ></div>
                  <Input
                    value={subtask.text}
                    onChange={(e) =>
                      updateSubtask({
                        subtaskId: subtask._id,
                        text: e.target.value,
                      })
                    }
                    className="h-8 border-none bg-transparent focus:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSubtask({ subtaskId: subtask._id })}
                    className="h-6 w-6"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center mt-2">
            <Input
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              placeholder="new subtask..."
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateSubtask();
                }
              }}
            />
            <Button onClick={handleCreateSubtask} size="sm" className="ml-2">
              add
            </Button>
          </div>
        </div>
      )}
      {isCommenting && <CommentSection itemId={node.uuid} />}
    </motion.li>
  );
}

