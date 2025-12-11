import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KanbanCardProps {
    task: any;
}

export function KanbanCard({ task }: KanbanCardProps) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.name,
        data: {
            type: "Task",
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 min-h-[150px] p-2 bg-muted/50 rounded-lg border-2 border-dashed border-primary/50"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none"
        >
            <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                <CardHeader className="p-3 pb-2 space-y-0">
                    <div className="flex justify-between items-start">
                        <Badge variant="outline" className={`mb-2 text-[10px] uppercase font-bold tracking-wider ${task.priority === 'High' || task.priority === 'Urgent' ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/20' :
                            task.priority === 'Medium' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20' :
                                'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20'
                            }`}>
                            {task.priority || 'Medium'}
                        </Badge>
                        {task.project && (
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                {task.project}
                            </span>
                        )}
                    </div>
                    <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                        {task.subject}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono mt-1">
                        {task.name}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="p-3 pt-2 flex items-center justify-between text-xs text-muted-foreground border-t bg-muted/10 h-8 mt-2">
                    <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {task.exp_end_date ? new Date(task.exp_end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                    </div>
                    <Avatar className="h-5 w-5 border border-background">
                        <AvatarFallback className="text-[8px]">U</AvatarFallback>
                    </Avatar>
                </CardFooter>
            </Card>
        </div>
    );
}
