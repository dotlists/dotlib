import { useRef, memo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import type { Id } from "@/lib/convex";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "./ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "./ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  MoreVertical, 
  Download, 
  Plus, 
  Edit2, 
  Trash2,
  CalendarIcon 
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface GanttViewProps {
  listId: Id<"lists">;
}

interface Task {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  custom_class: string;
  subtasks?: any[];
}

interface TaskDialogData {
  open: boolean;
  task?: Task;
  mode: 'edit' | 'create';
}

export const GanttView = memo(function GanttView({ listId }: GanttViewProps) {
  const ganttRef = useRef<HTMLDivElement | null>(null);
  const [taskDialog, setTaskDialog] = useState<TaskDialogData>({ open: false, mode: 'create' });
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; taskId?: string }>({ open: false });
  
  const tasks = useQuery(api.gantt.getGanttData, { listId });
  const updateItem = useMutation(api.lists.updateItem);
  const createItem = useMutation(api.lists.createItemPublic);
  const deleteItem = useMutation(api.lists.deleteItemPublic);

  // Calculate timeline and layout
  const getTimelineData = () => {
    if (!tasks || tasks.length === 0) return { days: [], minDate: new Date(), maxDate: new Date() };
    
    const dates = tasks.flatMap(task => [new Date(task.start), new Date(task.end)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 7);
    
    const days = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return { days, minDate, maxDate };
  };

  const calculateTaskPosition = (task: Task, minDate: Date, totalDays: number) => {
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);
    const startOffset = Math.floor((taskStart.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000));
    const duration = Math.floor((taskEnd.getTime() - taskStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  const getStateColor = (customClass: string) => {
    if (customClass.includes('red')) return 'bg-red-500';
    if (customClass.includes('yellow')) return 'bg-yellow-500';
    if (customClass.includes('green')) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const handleTaskClick = (task: Task) => {
    setTaskDialog({ open: true, task, mode: 'edit' });
    setTaskName(task.name);
    setStartDate(new Date(task.start));
    setEndDate(new Date(task.end));
  };

  const handleCreateTask = () => {
    setTaskDialog({ open: true, mode: 'create' });
    setTaskName("");
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  };

  const handleSaveTask = async () => {
    if (!taskName || !startDate || !endDate) return;

    if (taskDialog.mode === 'create') {
      await createItem({
        listId,
        text: taskName,
        state: "red",
        startDate: startDate.getTime(),
        dueDate: endDate.getTime(),
      });
    } else if (taskDialog.task) {
      await updateItem({
        id: taskDialog.task.id as Id<"items">,
        text: taskName,
        startDate: startDate.getTime(),
        dueDate: endDate.getTime(),
      });
    }
    
    setTaskDialog({ open: false, mode: 'create' });
  };

  const handleDeleteTask = async () => {
    if (deleteConfirm.taskId) {
      await deleteItem({ id: deleteConfirm.taskId as Id<"items"> });
      setDeleteConfirm({ open: false });
    }
  };

  const handleExport = async () => {
    if (!ganttRef.current) return;

    try {
      const canvas = await html2canvas(ganttRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('gantt-chart.pdf');
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const { days, minDate } = getTimelineData();

  return (
    <div className="p-6 space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Project Timeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your project tasks and deadlines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateTask} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div ref={ganttRef} className="bg-card border border-border rounded-lg overflow-hidden">
        {tasks && tasks.length > 0 ? (
          <div className="min-h-[400px]">
            {/* Timeline Header */}
            <div className="bg-muted/50 border-b border-border p-4">
              <div className="grid grid-cols-[200px_1fr] gap-4">
                <div className="font-medium text-foreground">Task</div>
                <div className="overflow-x-auto">
                  <div className="flex min-w-[800px]">
                    {days.slice(0, Math.min(days.length, 30)).map((day, index) => (
                      <div 
                        key={index} 
                        className="flex-1 text-center py-2 text-xs text-muted-foreground border-r border-border last:border-r-0"
                      >
                        <div className="font-medium">{format(day, 'MMM d')}</div>
                        <div className="text-xs opacity-60">{format(day, 'EEE')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-border">
              <AnimatePresence>
                {tasks.map((task, index) => {
                  const position = calculateTaskPosition(task, minDate, Math.min(days.length, 30));
                  const stateColor = getStateColor(task.custom_class);
                  
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="grid grid-cols-[200px_1fr] gap-4 p-4 hover:bg-muted/30 transition-colors"
                    >
                      {/* Task Info */}
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-foreground truncate">
                            {task.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(task.start), 'MMM d')} - {format(new Date(task.end), 'MMM d')}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${stateColor}`} />
                            <span className="text-xs text-muted-foreground">
                              {task.progress}% complete
                            </span>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTaskClick(task)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirm({ open: true, taskId: task.id })}
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Timeline Bar */}
                      <div className="relative overflow-x-auto">
                        <div className="min-w-[800px] h-12 relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: position.width }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`absolute top-2 h-8 ${stateColor} rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                            style={{ left: position.left }}
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="h-full bg-gradient-to-r from-white/20 to-transparent rounded-md" />
                            {/* Progress indicator */}
                            <div 
                              className="absolute top-0 left-0 h-full bg-black/20 rounded-l-md transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first task to start building your project timeline
            </p>
            <Button onClick={handleCreateTask} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        )}
      </div>

      {/* Task Dialog */}
      <Dialog open={taskDialog.open} onOpenChange={(open) => setTaskDialog({ ...taskDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {taskDialog.mode === 'create' ? 'Create New Task' : 'Edit Task'}
            </DialogTitle>
            <DialogDescription>
              {taskDialog.mode === 'create' 
                ? 'Add a new task to your project timeline' 
                : 'Update the task details below'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name..."
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DayPicker
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DayPicker
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialog({ ...taskDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask} disabled={!taskName || !startDate || !endDate}>
              {taskDialog.mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
