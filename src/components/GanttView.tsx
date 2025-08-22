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
    debounce((taskId: string, startDate: number, dueDate: number) => {
      updateItem({
        id: taskId as Id<"items">,
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
          dependencies: "", // Add this line
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
            on_click: () => {
              // This will be handled by the popup
            },
            custom_popup_html: (task: Gantt.Task) => {
              return `
                <div class="p-2">
                  <h5>${task.name}</h5>
                  <p>starts: ${task.start}</p>
                  <p>ends: ${task.end}</p>
                  <p>progress: ${task.progress}%</p>
                  <div class="flex gap-2 mt-2">
                    <button class="bg-red-500 text-white px-2 py-1 rounded" data-action="delete" data-task-id="${task.id}">delete</button>
                    <button class="bg-blue-500 text-white px-2 py-1 rounded" data-action="edit" data-task-id="${task.id}">set due date</button>
                  </div>
                </div>
              `;
            },
          } as unknown as Gantt.Options,
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
        if (confirm("are you sure you want to delete this task?")) {
          deleteItem({ id: taskId });
        }
      }

      if (action === "edit" && taskId) {
        const newDueDate = prompt("enter new due date (yyyy-mm-dd):");
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

  const handleExport = async () => {
    if (ganttRef.current) {
      const svg = ganttRef.current;
      
      // Get SVG dimensions
      const svgRect = svg.getBoundingClientRect();
      const svgWidth = svgRect.width || 800;
      const svgHeight = svgRect.height || 600;
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }
      
      // Set canvas size with scale factor for better quality
      const scale = 2;
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      ctx.scale(scale, scale);
      
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create an image element and load the SVG
      const img = new Image();
      
      img.onload = () => {
        // Draw the image on canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, svgWidth, svgHeight);
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
        
        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png');
        
        // Create PDF
        const doc = new jsPDF('landscape');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        
        // Calculate scaling to fit the page while maintaining aspect ratio
        const imgAspectRatio = svgWidth / svgHeight;
        const pdfAspectRatio = pdfWidth / pdfHeight;
        
        let finalWidth, finalHeight;
        if (imgAspectRatio > pdfAspectRatio) {
          // Image is wider, scale by width
          finalWidth = pdfWidth - 20; // 10px margin on each side
          finalHeight = finalWidth / imgAspectRatio;
        } else {
          // Image is taller, scale by height
          finalHeight = pdfHeight - 20; // 10px margin on top and bottom
          finalWidth = finalHeight * imgAspectRatio;
        }
        
        // Center the image
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;
        
        // Add image to PDF
        doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        doc.save('gantt-chart.pdf');
        
        // Clean up
        URL.revokeObjectURL(svgUrl);
      };
      
      img.onerror = () => {
        console.error('Failed to load SVG image');
        URL.revokeObjectURL(svgUrl);
      };
      
      img.src = svgUrl;
    }
  };

  const handleAddTask = async () => {
    const taskName = prompt("enter new task name:");
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
        <Button onClick={handleAddTask}>add task</Button>
        <Button onClick={handleExport} variant="outline">
          export to pdf
        </Button>
      </div>
      <svg ref={ganttRef}></svg>
    </div>
  );
});
