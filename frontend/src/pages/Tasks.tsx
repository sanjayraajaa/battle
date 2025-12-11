import { useFrappeGetDocList, useFrappeGetDoc, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Search, Filter, X, Kanban, LayoutGrid, List, Calendar, CheckSquare, MoreHorizontal } from 'lucide-react';
import { TaskForm } from '@/components/task-form';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FrappeFilter } from "@/components/frappe-filter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { DataTable } from "@/components/data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Tasks = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentView = searchParams.get('view') as 'card' | 'list' | 'board' || 'board';
    const [viewMode, setViewMode] = useState<'card' | 'list' | 'board'>(currentView);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<any[]>([]);
    const [tempFilters, setTempFilters] = useState<any[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Sync view mode with URL
    const handleViewChange = (v: 'card' | 'list' | 'board') => {
        setViewMode(v);
        setSearchParams(prev => {
            prev.set('view', v);
            return prev;
        });
    };

    const { data: tasks, isLoading, error, mutate } = useFrappeGetDocList('Task', {
        fields: ['name', 'subject', 'status', 'priority', 'project', 'exp_end_date', 'description', 'type', 'color'],
        filters: filters.map(f => [f.field, f.operator, f.value]),
        orderBy: { field: 'modified', order: 'desc' },
        limit: 100
    }, `tasks-${refreshKey}-${JSON.stringify(filters)}`);

    const { data: taskMeta } = useFrappeGetDoc('DocType', 'Task');
    const { updateDoc } = useFrappeUpdateDoc();

    const availableFields = taskMeta?.fields?.filter((f: any) =>
        !['Section Break', 'Column Break', 'Tab Break', 'Table', 'HTML', 'Button'].includes(f.fieldtype) &&
        !f.hidden
    ).map((f: any) => ({
        label: f.label,
        value: f.fieldname,
        type: f.fieldtype,
        options: f.options
    })) || [];

    const handleCreate = () => {
        setEditingTask(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (task: any) => {
        setEditingTask({ ...task });
        setIsSheetOpen(true);
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
    };

    const handleSuccess = () => {
        mutate();
        setRefreshKey(prev => prev + 1);
        handleSheetClose();
    };

    const handleOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) {
            setTimeout(() => {
                setEditingTask(null);
            }, 150);
        }
    };

    const handleFilterOpenChange = (open: boolean) => {
        setIsFilterOpen(open);
        if (open) {
            setTempFilters([...filters]);
        }
    };

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setFilters([]);
        setSearchQuery('');
        setTempFilters([]);
    };

    const handleTaskMove = async (taskId: string, newStatus: string) => {
        try {
            await updateDoc('Task', taskId, { status: newStatus });
            mutate();
        } catch (error) {
            console.error("Failed to update task status", error);
        }
    };

    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        if (!searchQuery) return tasks;
        return tasks.filter((task: any) =>
            task.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.project && task.project.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [tasks, searchQuery]);


    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "subject",
            header: "Subject",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium cursor-pointer hover:underline" onClick={() => handleEdit(row.original)}>
                        {row.getValue("subject")}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: "project",
            header: "Project",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
        },
        {
            accessorKey: "priority",
            header: "Priority",
            cell: ({ row }) => {
                const priority = row.getValue("priority") as string;
                return (
                    <span className={`font-medium ${priority === 'High' || priority === 'Urgent' ? 'text-orange-500' :
                        priority === 'Medium' ? 'text-blue-500' :
                            'text-green-500'
                        }`}>
                        {priority || 'Medium'}
                    </span>
                );
            },
        },
        {
            accessorKey: "exp_end_date",
            header: "Due Date",
            cell: ({ row }) => {
                const date = row.getValue("exp_end_date") as string;
                if (!date) return <span className="text-muted-foreground">-</span>;
                return new Date(date).toLocaleDateString();
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.name)}>
                                Copy ID
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-8 h-full max-h-screen overflow-hidden min-w-0">
            <div className="flex-none flex items-center justify-between">

                <div className="flex items-center gap-2">
                    <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
                        <SheetTrigger asChild>
                            <Button onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" /> Create Task
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>{editingTask ? 'Edit Task' : 'Create Task'}</SheetTitle>
                                <SheetDescription>
                                    {editingTask ? 'Make changes to your task here.' : 'Add a new task to your workspace.'}
                                </SheetDescription>
                            </SheetHeader>
                            <TaskForm
                                key={editingTask?.name || `new-${refreshKey}`}
                                initialData={editingTask}
                                onSuccess={handleSuccess}
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Filters Bar - Fixed */}
            <div className="flex-none flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:w-auto items-stretch md:items-center">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Popover open={isFilterOpen} onOpenChange={handleFilterOpenChange}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="border-dashed flex-1 md:flex-none justify-start md:justify-center">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filters
                                    {filters.length > 0 && (
                                        <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                                            {filters.length}
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[calc(100vw-2rem)] md:w-[600px]" align="start">
                                <FrappeFilter
                                    fields={availableFields}
                                    filters={tempFilters}
                                    onFiltersChange={setTempFilters}
                                    onApply={handleApplyFilters}
                                    onClear={handleClearFilters}
                                />
                            </PopoverContent>
                        </Popover>

                        {(filters.length > 0 || searchQuery) && (
                            <Button variant="ghost" size="icon" onClick={handleClearFilters} title="Clear Filters" className="shrink-0">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={viewMode} onValueChange={(v: 'card' | 'list' | 'board') => handleViewChange(v)}>
                        <SelectTrigger className="w-full md:w-[140px]">
                            <SelectValue placeholder="View" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="board">
                                <div className="flex items-center">
                                    <Kanban className="mr-2 h-4 w-4" />
                                    <span>Board View</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="card">
                                <div className="flex items-center">
                                    <LayoutGrid className="mr-2 h-4 w-4" />
                                    <span>Card View</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="list">
                                <div className="flex items-center">
                                    <List className="mr-2 h-4 w-4" />
                                    <span>List View</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 min-h-0 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500">
                        Error loading tasks: {error.message}
                    </div>
                ) : !filteredTasks || filteredTasks.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                        <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                        <h3 className="text-lg font-medium">No tasks found</h3>
                        <p className="text-muted-foreground">
                            {(filters.length > 0 || searchQuery) ? "Try adjusting your filters" : "You have no tasks assigned."}
                        </p>
                        {(filters.length > 0 || searchQuery) && (
                            <Button variant="link" onClick={handleClearFilters} className="mt-2">
                                Clear all filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'board' ? (
                            <KanbanBoard tasks={filteredTasks} onTaskMove={handleTaskMove} />
                        ) : viewMode === 'card' ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredTasks.map((task: any) => (
                                    <Card key={task.name} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEdit(task)}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="mr-2">
                                                    <CardTitle className="text-lg font-semibold line-clamp-1" title={task.subject}>
                                                        {task.subject}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs mt-1 font-mono">
                                                        {task.project}
                                                    </CardDescription>
                                                    <CardDescription className="text-xs mt-0.5 font-mono">
                                                        {task.name}
                                                    </CardDescription>
                                                </div>
                                                <StatusBadge status={task.status} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2">
                                            <div className="space-y-4 mt-2">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted-foreground">Priority</span>
                                                        <span className={`font-medium capitalize ${task.priority === 'High' || task.priority === 'Urgent' ? 'text-orange-500' :
                                                            task.priority === 'Medium' ? 'text-blue-500' :
                                                                'text-green-500'
                                                            }`}>{task.priority || 'Medium'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-2 border-t mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {task.exp_end_date ? new Date(task.exp_end_date).toLocaleDateString() : 'No Deadline'}
                                            </div>
                                            <div className="flex -space-x-2">
                                                <Avatar className="h-6 w-6 border-2 border-background">
                                                    <AvatarFallback className="text-[9px]">U</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                                <DataTable
                                    data={filteredTasks}
                                    columns={columns}
                                />
                            </div>
                        )}
                    </>
                )
                }

            </div>
        </div >
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = "bg-secondary text-secondary-foreground";
    if (status === 'Open' || status === 'Working') colorClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (status === 'Completed') colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (status === 'Cancelled') colorClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (status === 'Pending Review' || status === 'Overdue') colorClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${colorClass} border-transparent`}>
            {status}
        </span>
    );
};

export default Tasks;
