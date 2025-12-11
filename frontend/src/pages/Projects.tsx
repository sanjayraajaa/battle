import { useFrappeGetDocList, useFrappeGetDoc } from 'frappe-react-sdk';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, FolderKanban, Calendar, Plus, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { DataTable } from '@/components/data-table/data-table';
import { columns } from '@/components/data-table/columns';
import { ProjectForm } from '@/components/project-form';
import { FrappeFilter, type Filter as FilterType } from '@/components/frappe-filter';

const Projects = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Advanced Filters State - Derived from URL
    const filters: FilterType[] = (() => {
        try {
            const f = searchParams.get("filters");
            return f ? JSON.parse(f) : [];
        } catch (e) {
            return [];
        }
    })();

    const viewMode = (searchParams.get("view") as 'card' | 'list') || 'card';

    const setViewMode = (mode: 'card' | 'list') => {
        setSearchParams(prev => {
            prev.set("view", mode);
            return prev;
        });
    };

    const [searchQuery, setSearchQuery] = useState("");

    const { data: projects, isLoading, error, mutate } = useFrappeGetDocList('Project', {
        fields: [
            'name',
            'project_name',
            'project_type',
            'status',
            'priority',
            'expected_start_date',
            'expected_end_date',
            'is_active',
            'department',
            'notes',
            'percent_complete',
            'modified'
        ],
        filters: filters as any,
        orderBy: { field: 'modified', order: 'desc' },
        limit: 100
    });

    const { data: projectMeta } = useFrappeGetDoc('DocType', 'Project');

    // Temporary filters for the Popover (buffer)
    const [tempFilters, setTempFilters] = useState<FilterType[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const ALLOWED_FILTER_FIELDS = [
        'project_name',
        'project_type',
        'status',
        'priority',
        'expected_start_date',
        'expected_end_date',
        'department',
        'is_active',
        'percent_complete'
    ];

    const availableFields = projectMeta?.fields?.filter((f: any) =>
        ALLOWED_FILTER_FIELDS.includes(f.fieldname)
    ).map((f: any) => ({
        label: f.label,
        value: f.fieldname,
        type: f.fieldtype,
        options: f.options
    })) || [];

    // Fallback if meta not loaded yet
    if (availableFields.length === 0 && projectMeta) {
        availableFields.push({ label: 'Name', value: 'name', type: 'Data' });
        availableFields.push({ label: 'Owner', value: 'owner', type: 'Data' });
        availableFields.push({ label: 'Creation', value: 'creation', type: 'Datetime' });
        availableFields.push({ label: 'Modified', value: 'modified', type: 'Datetime' });
        availableFields.push({ label: 'Status', value: 'status', type: 'Select', options: "Open\nCompleted\nCancelled" });
    }

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleApplyFilters = () => {
        setSearchParams(prev => {
            if (tempFilters.length > 0) {
                prev.set("filters", JSON.stringify(tempFilters));
            } else {
                prev.delete("filters");
            }
            return prev;
        });
        setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setTempFilters([]);
        setSearchParams(prev => {
            prev.delete("filters");
            return prev;
        });
        setSearchQuery("");
        setIsFilterOpen(false);
    };

    const handleFilterOpenChange = (open: boolean) => {
        setIsFilterOpen(open);
        if (open) {
            setTempFilters([...filters]); // Sync on open
            if (filters.length === 0) {
                // Add one empty row by default if empty, using the component logic will handle empty state if we want,
                // but let's init with one empty row if truly empty for better UX in the component?
                // Actually the component has an "Add" button, so starting empty is fine.
                // But let's add one for convenience.
                // We need to know available fields to set a valid default, so maybe leave empty and let user click Add.
                // Or just set basic status filter
                setTempFilters([['status', '=', 'Open']]);
            }
        }
    };

    // Client-side search (still applied on top of server results for quick text search)
    const filteredProjects = projects?.filter((project: any) => {
        if (!searchQuery) return true;
        return project.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }) || [];

    const handleEdit = (project: any) => {
        setEditingProject({ ...project });
        setIsSheetOpen(true);
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) {
            setTimeout(() => {
                setEditingProject(null);
            }, 150);
        }
    };

    const handleCreate = () => {
        setEditingProject(null);
        setRefreshKey(prev => prev + 1);
    };

    const handleSuccess = () => {
        mutate();
        handleSheetClose();
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-48 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                Error loading projects: {error.message}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-8 h-full overflow-y-auto">


            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:w-auto items-stretch md:items-center">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search projects..."
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
                    <Select value={viewMode} onValueChange={(v: 'card' | 'list') => setViewMode(v)}>
                        <SelectTrigger className="w-full md:w-[140px]">
                            <SelectValue placeholder="View" />
                        </SelectTrigger>
                        <SelectContent>
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

                    <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
                        <SheetTrigger asChild>
                            <Button onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" /> Create Project
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>{editingProject ? 'Edit Project' : 'Create Project'}</SheetTitle>
                                <SheetDescription>
                                    {editingProject ? 'Make changes to your project here.' : 'Add a new project to your workspace.'}
                                </SheetDescription>
                            </SheetHeader>
                            <ProjectForm
                                key={editingProject?.name || `new-${refreshKey}`}
                                initialData={editingProject}
                                onSuccess={handleSuccess}
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {
                !filteredProjects || filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                        <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                        <h3 className="text-lg font-medium">No projects found</h3>
                        <p className="text-muted-foreground">
                            {(filters.length > 0 || searchQuery) ? "Try adjusting your filters" : "Get started by creating a new project in ERPNext."}
                        </p>
                        {(filters.length > 0 || searchQuery) && (
                            <Button variant="link" onClick={handleClearFilters} className="mt-2">
                                Clear all filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'card' ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredProjects.map((project: any) => (
                                    <Card key={project.name} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEdit(project)}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="mr-2">
                                                    <CardTitle className="text-lg font-semibold line-clamp-1" title={project.project_name}>
                                                        {project.project_name}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs mt-1 font-mono">
                                                        {project.name}
                                                    </CardDescription>
                                                </div>
                                                <StatusBadge status={project.status} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2">
                                            <div className="space-y-4 mt-2">
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-muted-foreground">Progress</span>
                                                        <span className="font-medium">{Math.round(project.percent_complete || 0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-500 ease-in-out"
                                                            style={{ width: `${project.percent_complete || 0}% ` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted-foreground">Type</span>
                                                        <span className="font-medium capitalize">{project.project_type || 'Internal'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted-foreground">Priority</span>
                                                        <span className={`font-medium capitalize ${project.priority === 'High' ? 'text-orange-500' :
                                                            project.priority === 'Medium' ? 'text-blue-500' :
                                                                'text-green-500'
                                                            }`}>{project.priority || 'Medium'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-2 border-t mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {project.expected_end_date || 'No Deadline'}
                                            </div>
                                            <div className="flex -space-x-2">
                                                {/* Placeholder for avatars, as ERPNext API might not return user images easily in list view without join */}
                                                <Avatar className="h-6 w-6 border-2 border-background">
                                                    <AvatarFallback className="text-[9px]">JD</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                                <DataTable
                                    data={filteredProjects}
                                    columns={columns}
                                    meta={{ onEdit: handleEdit }}
                                />
                            </div>
                        )}
                    </>
                )
            }
        </div >
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = "bg-secondary text-secondary-foreground";
    if (status === 'Open' || status === 'Active') colorClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (status === 'Completed') colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (status === 'Cancelled') colorClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (status === 'On Hold') colorClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${colorClass} border-transparent`}>
            {status}
        </span>
    );
};

export default Projects;
