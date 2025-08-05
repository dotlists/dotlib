import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { SubtaskItem } from "./SubtaskItem";

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
  const [isSubtasksVisible, setIsSubtasksVisible] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [isMultiLine, setIsMultiLine] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const breakdownTask = useAction(api.gemini.breakdownTask);
  const teamMembers = useQuery(
    api.teams.getTeamMembers,
    teamId ? { teamId } : "skip",
  );
  const subtasks = useQuery(api.subtasks.getSubtasks, { parentId: node.uuid });
  const createSubtask = useMutation(api.subtasks.createSubtask);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const checkMultiLine = () => {
        const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight);
        setIsMultiLine(textarea.scrollHeight > lineHeight + 2);
      };
      const resizeObserver = new ResizeObserver(checkMultiLine);
      resizeObserver.observe(textarea);
      checkMultiLine(); // Initial check
      return () => resizeObserver.disconnect();
    }
  }, [text]);

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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ layout: { duration: 0.2, ease: "easeOut" } }}
      className="flex flex-col transition-all hover:bg-muted/50 rounded-lg my-1 p-1"
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
            "mx-2 transition-all duration-100 cursor-pointer hover:blur-xs flex-shrink-0",
            isMultiLine
              ? "w-6 self-stretch rounded-full"
              : "w-6 h-6 rounded-full",
            colorClass,
          )}
        ></div>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"new task"}
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
                  <div onSelect={(e) => e.preventDefault()} className="focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    set due date
                  </div>
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
      <AnimatePresence initial={false}>
        {isSubtasksVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-12 mt-2 overflow-hidden"
          >
            <ul>
              {subtasks?.map((subtask) => (
                <SubtaskItem key={subtask._id} subtask={subtask} />
              ))}
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
          </motion.div>
        )}
      </AnimatePresence>
      {isCommenting && <CommentSection itemId={node.uuid} />}
    </motion.li>
  );
}
