import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useMemo } from "react";
import { KanbanCard } from "./KanbanCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
    column: {
        id: string;
        title: string;
    };
    tasks: any[];
    onTaskClick?: (task: any) => void;
    onAdd?: (status: string) => void;
}

export function KanbanColumn({ column, tasks, onTaskClick, onAdd }: KanbanColumnProps) {
    const tasksIds = useMemo(() => {
        return tasks.map((task) => task.name);
    }, [tasks]);

    const { setNodeRef, isOver } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-lg h-full max-h-full transition-colors ${isOver ? "bg-muted/70 ring-2 ring-primary/20" : "bg-muted/30"}`}
        >
            <div className={`p-3 font-semibold text-sm flex items-center justify-between border-b bg-muted/40 rounded-t-lg sticky top-0 z-10 backdrop-blur-sm group`}>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${column.title === 'Open' ? 'bg-gray-400' :
                        column.title === 'Working' ? 'bg-blue-500' :
                            column.title === 'Pending Review' ? 'bg-orange-500' :
                                column.title === 'Completed' ? 'bg-green-500' :
                                    'bg-red-500'
                        }`} />
                    {column.title}
                </div>
                <div className="flex items-center gap-1">
                    <span className="bg-background border rounded-full px-2 py-0.5 text-xs text-muted-foreground shadow-sm">
                        {tasks.length}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onAdd?.(column.id)}>
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 p-2 gap-3 flex flex-col overflow-y-auto">
                <SortableContext items={tasksIds}>
                    {tasks.map((task) => (
                        <KanbanCard key={task.name} task={task} onClick={onTaskClick} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-muted-foreground/10 rounded-lg flex items-center justify-center text-xs text-muted-foreground italic">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}
