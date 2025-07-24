import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import type { Doc, Id } from "@/lib/convex";
import { ListItem } from "./ListItem";

type ConvexItem = Doc<"items"> & { uuid: Id<"items"> };

interface ListEditorProps {
  state: {
    id: Id<"lists">;
    name: string;
    nodes: Array<ConvexItem>;
    teamId?: Id<"teams">;
  };
  handleUpdateItem: (
    id: Id<"items">,
    updates: Partial<Doc<"items">>,
  ) => void;
  handleAddItem: (text: string, state?: "red" | "yellow" | "green") => void;
  handleDeleteItem: (id: Id<"items">) => void;
  focusedItemId: Id<"items"> | null;
  setFocusedItemId: (id: Id<"items"> | null) => void;
}

export function ListEditor({
  state,
  handleUpdateItem,
  handleAddItem,
  handleDeleteItem,
  focusedItemId,
  setFocusedItemId,
}: ListEditorProps) {
  const stateOrder = { red: 0, yellow: 1, green: 2 } as const;

  const sortedNodes = [...state.nodes].sort((a, b) => {
    const stateA = a.state as keyof typeof stateOrder;
    const stateB = b.state as keyof typeof stateOrder;
    const stateDiff = stateOrder[stateA] - stateOrder[stateB];
    if (stateDiff !== 0) return stateDiff;
    return a.text.localeCompare(b.text);
  });

  return (
    <motion.ul className="h-[85vh] pr-3 mb-0 overflow-y-scroll overflow-x-hidden">
      <AnimatePresence>
        {sortedNodes.map((node) => (
          <ListItem
            key={node.uuid}
            node={node}
            handleUpdateItem={handleUpdateItem}
            handleDeleteItem={handleDeleteItem}
            focusedItemId={focusedItemId}
            setFocusedItemId={setFocusedItemId}
            listId={state.id}
            teamId={state.teamId}
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
