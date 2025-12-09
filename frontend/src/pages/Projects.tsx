import { useFrappeGetDocList } from 'frappe-react-sdk';
import { useState } from 'react';
import { LayoutGrid, List, FolderKanban, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { DataTable } from '@/components/data-table/data-table';
import { columns } from '@/components/data-table/columns';
import { ProjectForm } from '@/components/project-form';

const Projects = () => {
    const { data: projects, isLoading, error, mutate } = useFrappeGetDocList('Project', {
        fields: ['name', 'project_name', 'status', 'priority', 'percent_complete', 'expected_end_date', 'project_type'],
        orderBy: { field: 'modified', order: 'desc' }
    });

    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);

    const handleEdit = (project: any) => {
        setEditingProject(project);
        setIsSheetOpen(true);
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
        setEditingProject(null);
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
        <div className="flex flex-col gap-6 p-8 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">Manage and track your ongoing projects.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button onClick={() => setEditingProject(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Create Project
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[540px]">
                            <SheetHeader>
                                <SheetTitle>{editingProject ? 'Edit Project' : 'Create Project'}</SheetTitle>
                                <SheetDescription>
                                    {editingProject ? 'Make changes to your project here.' : 'Add a new project to your workspace.'}
                                </SheetDescription>
                            </SheetHeader>
                            <ProjectForm
                                initialData={editingProject}
                                onSuccess={handleSuccess}
                            />
                        </SheetContent>
                    </Sheet>

                    <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border ml-2">
                        <Button
                            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('card')}
                            className="px-3"
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Card
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="px-3"
                        >
                            <List className="h-4 w-4 mr-2" />
                            List
                        </Button>
                    </div>
                </div>
            </div>

            {!projects || projects.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                    <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">No projects found</h3>
                    <p className="text-muted-foreground">Get started by creating a new project in ERPNext.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {projects.map((project: any) => (
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
                                                        style={{ width: `${project.percent_complete || 0}%` }}
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
                                data={projects}
                                columns={columns}
                                meta={{ onEdit: handleEdit }}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
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
