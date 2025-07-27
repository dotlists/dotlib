// src/components/SubtaskItem.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import type { Doc } from "@/lib/convex";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Trash2 } from "lucide-react";
import clsx from "clsx";

const subtaskStateOrder = { todo: 0, "in progress": 1, done: 2 } as const;
const subtaskStateOrderReversed = ["todo", "in progress", "done"] as const;

interface SubtaskItemProps {
  subtask: Doc<"subtasks">;
}

export function SubtaskItem({ subtask }: SubtaskItemProps) {
  const updateSubtask = useMutation(api.subtasks.updateSubtask);
  const deleteSubtask = useMutation(api.subtasks.deleteSubtask);
  const [text, setText] = useState(subtask.text);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (text !== subtask.text) {
        updateSubtask({ subtaskId: subtask._id, text });
      }
    }, 500); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [text, subtask.text, subtask._id, updateSubtask]);

  const subtaskColorClass =
    subtask.state === "todo"
      ? "bg-red-500"
      : subtask.state === "in progress"
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center"
    >
      <div
        onClick={() => {
          const currentState = subtask.state as keyof typeof subtaskStateOrder;
          const newState = (subtaskStateOrder[currentState] + 1) % 3;
          updateSubtask({
            subtaskId: subtask._id,
            state: subtaskStateOrderReversed[newState],
          });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const currentState = subtask.state as keyof typeof subtaskStateOrder;
          const newState = (subtaskStateOrder[currentState] + 2) % 3;
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
        value={text}
        onChange={(e) => setText(e.target.value)}
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
    </motion.li>
  );
}
