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
    onTaskMove: (taskId: string, newValue: string, field: string) => void;
    onTaskClick?: (task: any) => void;
    onAdd?: (status: string) => void;
    groupBy?: 'status' | 'priority';
    columnOptions?: Record<string, string[]>;
}

export function KanbanBoard({ tasks, onTaskMove, onTaskClick, onAdd, groupBy = 'status', columnOptions }: KanbanBoardProps) {
    const columns = useMemo(() => {
        // Use dynamic options if provided
        if (columnOptions && columnOptions[groupBy]) {
            return columnOptions[groupBy].map(option => ({
                id: option,
                title: option
            }));
        }

        // Fallback defaults
        if (groupBy === 'priority') {
            return [
                { id: "Low", title: "Low" },
                { id: "Medium", title: "Medium" },
                { id: "High", title: "High" },
                { id: "Urgent", title: "Urgent" },
            ];
        }
        return [
            { id: "Open", title: "Open" },
            { id: "Working", title: "Working" },
            { id: "Pending Review", title: "Pending Review" },
            { id: "Completed", title: "Completed" },
            { id: "Cancelled", title: "Cancelled" },
        ];
    }, [groupBy, columnOptions]);

    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    const [activeTask, setActiveTask] = useState<any>(null);

    // Group tasks by status or priority
    const groupedTasks = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        columns.forEach(col => grouped[col.id] = []);

        tasks.forEach(task => {
            const key = task[groupBy] || (groupBy === 'priority' ? 'Medium' : 'Open');
            if (grouped[key]) {
                grouped[key].push(task);
            } else {
                // Fallback for unknown status/priority
                const fallback = groupBy === 'priority' ? 'Medium' : 'Open';
                if (!grouped[fallback]) grouped[fallback] = [];
                grouped[fallback].push(task);
            }
        });
        return grouped;
    }, [tasks, columns, groupBy]);


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
                const newValue = overId as string;
                if (activeTaskData[groupBy] !== newValue) {
                    onTaskMove(activeTaskData.name, newValue, groupBy);
                }
            }
            // If dropped over another task
            else {
                const overTaskComp = event.over?.data?.current;
                if (overTaskComp?.task) {
                    const newValue = overTaskComp.task[groupBy];
                    if (activeTaskData[groupBy] !== newValue) {
                        onTaskMove(activeTaskData.name, newValue, groupBy);
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
                                    tasks={groupedTasks[col.id] || []}
                                    onTaskClick={onTaskClick}
                                    onAdd={groupBy === 'status' ? onAdd : undefined}
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
