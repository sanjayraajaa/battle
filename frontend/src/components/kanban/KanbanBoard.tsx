import {
    DndContext,
    DragOverlay,
    useSensors,
    useSensor,
    PointerSensor,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
    closestCorners,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

interface KanbanBoardProps {
    tasks: any[];
    onTaskMove: (taskId: string, newStatus: string) => void;
}

export function KanbanBoard({ tasks, onTaskMove }: KanbanBoardProps) {
    const columns = useMemo(() => [
        { id: "Open", title: "Open" },
        { id: "Working", title: "Working" },
        { id: "Pending Review", title: "Pending Review" },
        { id: "Completed", title: "Completed" },
        { id: "Cancelled", title: "Cancelled" },
    ], []);

    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    const [activeTask, setActiveTask] = useState<any>(null);

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        columns.forEach(col => grouped[col.id] = []);

        tasks.forEach(task => {
            const status = task.status || "Open";
            if (grouped[status]) {
                grouped[status].push(task);
            } else {
                // Fallback for unknown status
                if (!grouped["Open"]) grouped["Open"] = [];
                grouped["Open"].push(task);
            }
        });
        return grouped;
    }, [tasks, columns]);


    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10, // 10px movement required before drag starts
            },
        })
    );

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveTask(null);
        const { over } = event;

        if (!over) return;

        const overId = over.id;

        // Use string IDs directly
        const activeTaskData = event.active.data.current?.task;

        if (activeTaskData) {
            // If dropped over a column
            if (columns.some(col => col.id === overId)) {
                const newStatus = overId as string;
                if (activeTaskData.status !== newStatus) {
                    onTaskMove(activeTaskData.name, newStatus);
                }
            }
            // If dropped over another task
            else {
                const overTaskComp = event.over?.data?.current;
                if (overTaskComp?.task) {
                    const newStatus = overTaskComp.task.status;
                    if (activeTaskData.status !== newStatus) {
                        onTaskMove(activeTaskData.name, newStatus);
                    }
                }
            }
        }
    }

    function onDragOver(event: DragOverEvent) {
        const { over } = event;
        if (!over) return;

        // This is mainly for visual feedback during drag, actual "move" logic is in onDragEnd for simplicity with API
        // Advanced implementations handle reordering locally first.
    }

    return (
        <div className="h-full w-full overflow-x-auto overflow-y-hidden pb-2">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
            >
                <div className="flex gap-4 h-full min-w-full w-max px-1">
                    <SortableContext items={columnsId}>
                        {columns.map((col) => (
                            <div key={col.id} className="w-[280px] h-full flex-shrink-0">
                                <KanbanColumn
                                    column={col}
                                    tasks={tasksByStatus[col.id] || []}
                                />
                            </div>
                        ))}
                    </SortableContext>
                </div>

                {createPortal(
                    <DragOverlay>
                        {activeTask && (
                            <div className="opacity-80 rotate-2 scale-105 cursor-grabbing">
                                <KanbanCard task={activeTask} />
                            </div>
                        )}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    );
}
