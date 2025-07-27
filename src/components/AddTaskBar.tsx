// src/components/AddTaskBar.tsx
import { Button } from "./ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Plus } from "lucide-react";
import clsx from "clsx";

interface AddTaskBarProps {
  handleAddItem: () => void;
}

export function AddTaskBar({ handleAddItem }: AddTaskBarProps) {
  const { theme } = useTheme();

  return (
    <div className="px-4 py-2">
      <Button
        onClick={handleAddItem}
        variant="outline"
        className={clsx(
          "w-full justify-start",
          theme === "blue" && "bg-blue-500 text-white hover:bg-blue-600"
        )}
      >
        <Plus className="h-4 w-4 mr-2" />
        add new task
      </Button>
    </div>
  );
}
