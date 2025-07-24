import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import type { Id } from "@/lib/convex";

interface ListItemProps {
  node: {
    uuid: Id<"items">;
    text: string;
    state: "red" | "yellow" | "green";
  };
  handleUpdateItem: (
    id: Id<"items">,
    updates: { text?: string; state?: "red" | "yellow" | "green" },
  ) => void;
  handleDeleteItem: (id: Id<"items">) => void;
  focusedItemId: Id<"items"> | null;
  setFocusedItemId: (id: Id<"items"> | null) => void;
}

const stateOrder = { red: 0, yellow: 1, green: 2 } as const;
const stateOrderReversed = ["red", "yellow", "green"] as const;

export function ListItem({
  node,
  handleUpdateItem,
  handleDeleteItem,
  focusedItemId,
  setFocusedItemId,
}: ListItemProps) {
  const [text, setText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (node.uuid === focusedItemId) {
      textareaRef.current?.focus();
      textareaRef.current?.select(); // Select the text for easy renaming
      setFocusedItemId(null);
    }
  }, [focusedItemId, node.uuid, setFocusedItemId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (text !== node.text) {
        handleUpdateItem(node.uuid, { text });
      }
    }, 500); // 500ms debounce delay

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

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex hover:bg-gray-100 rounded-xl my-2 py-2"
      key={node.uuid}
      id={node.uuid}
    >
      <div
        onClick={() => {
          const newState = (stateOrder[node.state] + 1) % 3;
          handleUpdateItem(node.uuid, {
            state: stateOrderReversed[newState],
          });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const newState = (stateOrder[node.state] + 2) % 3;
          handleUpdateItem(node.uuid, {
            state: stateOrderReversed[newState],
          });
        }}
        className={`w-10 min-h-[100%] mr-5 rounded-full hover:blur-xs transition-all duration-100 cursor-pointer ${colorClass}`}
      ></div>
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="text-xl focus:outline-none w-full focus:ring-none"
        style={{ resize: "none", overflowY: "auto" }}
        rows={1}
        onInput={(e) => {
          const textarea = e.currentTarget;
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
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
      <Button
        onClick={() => handleDeleteItem(node.uuid)}
        variant="destructive"
        className="h-7 rounded-full cursor-pointer mr-3"
      >
        Delete
      </Button>
    </motion.li>
  );
}
