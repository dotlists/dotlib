import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import type { Id } from "@/lib/convex";
import { ListItem } from "./ListItem";

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

  const sortedNodes = [...state.nodes].sort((a, b) => {
    const stateDiff = stateOrder[a.state] - stateOrder[b.state];
    if (stateDiff !== 0) return stateDiff;
    return a.text.localeCompare(b.text);
  });

  return (
    <motion.ul className="h-[85vh] w-[100vw] pr-3 mb-0 overflow-y-scroll overflow-x-hidden">
      <AnimatePresence>
        {sortedNodes.map((node) => (
          <ListItem
            key={node.uuid}
            node={node}
            handleUpdateItem={handleUpdateItem}
            handleDeleteItem={handleDeleteItem}
          />
        ))}
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
