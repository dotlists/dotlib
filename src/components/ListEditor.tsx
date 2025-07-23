import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import type { Id } from "#convex/_generated/dataModel";

interface ListEditorProps {
  state: {
    id: Id<"lists">;
    name: string;
    nodes: Array<{
      uuid: Id<"items">;
      text: string;
      state: "red" | "yellow" | "green";
    }>;
  };
  handleUpdateItem: (
    id: Id<"items">,
    updates: { text?: string; state?: "red" | "yellow" | "green" },
  ) => void;
  handleAddItem: (text: string, state?: "red" | "yellow" | "green") => void;
  handleDeleteItem: (id: Id<"items">) => void;
}

export function ListEditor({
  state,
  handleUpdateItem,
  handleAddItem,
  handleDeleteItem,
}: ListEditorProps) {
  const stateOrder = { red: 0, yellow: 1, green: 2 } as const;
  const stateOrderReversed = ["red", "yellow", "green"] as const;

  const sortedNodes = [...state.nodes].sort((a, b) => {
    const stateDiff = stateOrder[a.state] - stateOrder[b.state];
    if (stateDiff !== 0) return stateDiff;
    return a.text.localeCompare(b.text);
  });

  return (
    <motion.ul className="h-[90vh] w-[100vw] pr-3 mb-0 overflow-y-scroll overflow-x-hidden">
      <AnimatePresence>
        {sortedNodes.map((node) => {
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
                  if (node.uuid) {
                    const newState = (stateOrder[node.state] + 1) % 3;
                    handleUpdateItem(node.uuid, {
                      state: stateOrderReversed[newState],
                    });
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (node.uuid) {
                    const newState = (stateOrder[node.state] + 2) % 3;
                    handleUpdateItem(node.uuid, {
                      state: stateOrderReversed[newState],
                    });
                  }
                }}
                className={`w-10 min-h-[100%] mr-5 rounded-full hover:blur-xs transition-all duration-100 ${colorClass}`}
              ></div>
              <Textarea
                value={node.text}
                onChange={(e) => {
                  if (node.uuid) {
                    handleUpdateItem(node.uuid, { text: e.target.value });
                  }
                }}
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
                  if (node.uuid) {
                    if (trimmed === "") {
                      handleDeleteItem(node.uuid);
                    } else if (trimmed !== node.text) {
                      handleUpdateItem(node.uuid, { text: trimmed });
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (node.uuid) {
                    if (e.key === "Backspace" && node.text === "") {
                      e.preventDefault();
                      handleDeleteItem(node.uuid);
                    }
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (node.uuid) {
                    handleDeleteItem(node.uuid);
                  }
                }}
                variant="destructive"
                className="h-7 rounded-full cursor-pointer mr-3"
              >
                Delete
              </Button>
            </motion.li>
          );
        })}
        <motion.li
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex justify-center my-4"
        >
          <Button
            onClick={() => handleAddItem("New task", "red")}
            variant="outline"
            className="px-8"
          >
            Add new task
          </Button>
        </motion.li>
      </AnimatePresence>
    </motion.ul>
  );
}
