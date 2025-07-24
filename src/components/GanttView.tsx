import { useEffect, useRef, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import type { Id } from "@/lib/convex";
import Gantt from "frappe-gantt";
import { Button } from "./ui/button";
import jsPDF from "jspdf";
import { debounce } from "@/lib/utils";

interface GanttViewProps {
  listId: Id<"lists">;
}

export const GanttView = memo(function GanttView({ listId }: GanttViewProps) {
  const ganttRef = useRef<SVGSVGElement | null>(null);
  const ganttInstance = useRef<Gantt | null>(null);
  const tasks = useQuery(api.gantt.getGanttData, { listId });
  const updateItem = useMutation(api.lists.updateItem);
  const createItem = useMutation(api.lists.createItemPublic);

  const debouncedUpdateRef = useRef(
    debounce((taskId: Id<"items">, startDate: number, dueDate: number) => {
      updateItem({
        id: taskId,
        startDate,
        dueDate,
      });
    }, 500),
  );

  useEffect(() => {
    if (ganttRef.current && tasks) {
      const correctedTasks = tasks.map((task) => {
        const start = new Date(task.start);
        const end = new Date(task.end);
        const timezoneOffset = new Date().getTimezoneOffset() * 60000;
        return {
          ...task,
          start: new Date(start.getTime() + timezoneOffset)
            .toISOString()
            .split("T")[0],
          end: new Date(end.getTime() + timezoneOffset)
            .toISOString()
            .split("T")[0],
        };
      });

      if (!ganttInstance.current) {
        // Initialize Gantt chart
        ganttInstance.current = new Gantt(
          ganttRef.current,
          correctedTasks as Gantt.Task[],
          {
            on_date_change: (
              task: Gantt.Task,
              start: Date,
              end: Date,
            ) => {
              debouncedUpdateRef.current(
                task.id as Id<"items">,
                start.getTime(),
                end.getTime(),
              );
            },
            on_click: (_task: Gantt.Task) => {
              // This will be handled by the popup
            },
            custom_popup_html: (task: Gantt.Task) => {
              return `
                <div class="p-2">
                  <h5>${task.name}</h5>
                  <p>Starts: ${task.start}</p>
                  <p>Ends: ${task.end}</p>
                  <p>Progress: ${task.progress}%</p>
                  <div class="flex gap-2 mt-2">
                    <button class="bg-red-500 text-white px-2 py-1 rounded" data-action="delete" data-task-id="${task.id}">Delete</button>
                    <button class="bg-blue-500 text-white px-2 py-1 rounded" data-action="edit" data-task-id="${task.id}">Set Due Date</button>
                  </div>
                </div>
              `;
            },
          } as any,
        );
      } else {
        // Refresh tasks if chart already exists
        ganttInstance.current.refresh(correctedTasks as Gantt.Task[]);
      }
    }
  }, [tasks]);

  const deleteItem = useMutation(api.lists.deleteItemPublic);

  useEffect(() => {
    const ganttElement = ganttRef.current;
    if (!ganttElement) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;
      const taskId = target.dataset.taskId as Id<"items">;

      if (action === "delete" && taskId) {
        if (confirm("Are you sure you want to delete this task?")) {
          deleteItem({ id: taskId });
        }
      }

      if (action === "edit" && taskId) {
        const newDueDate = prompt("Enter new due date (YYYY-MM-DD):");
        if (newDueDate) {
          updateItem({
            id: taskId,
            dueDate: new Date(newDueDate).getTime(),
          });
        }
      }
    };

    ganttElement.addEventListener("click", handleClick);
    return () => {
      ganttElement.removeEventListener("click", handleClick);
    };
  }, [deleteItem, updateItem]);

  const handleExport = () => {
    if (ganttRef.current) {
      const svg = ganttRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const doc = new jsPDF("landscape");
      doc.html(svgData, {
        callback: function (doc) {
          doc.save("gantt-chart.pdf");
        },
        x: 10,
        y: 10,
      });
    }
  };

  const handleAddTask = async () => {
    const taskName = prompt("Enter new task name:");
    if (taskName) {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      await createItem({
        listId,
        text: taskName,
        state: "red",
        startDate: today.getTime(),
        dueDate: tomorrow.getTime(),
      });
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={handleAddTask}>Add Task</Button>
        <Button onClick={handleExport} variant="outline">
          Export to PDF
        </Button>
      </div>
      <svg ref={ganttRef}></svg>
    </div>
  );
});