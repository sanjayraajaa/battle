import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeGetDocList } from "frappe-react-sdk"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SheetClose, SheetFooter } from "@/components/ui/sheet"

// Schema definition
const projectSchema = z.object({
    project_name: z.string().min(2, "Project name must be at least 2 characters"),
    project_type: z.string().optional(),
    status: z.string().min(1, "Please select a status"),
    priority: z.string().min(1, "Please select a priority"),
    expected_start_date: z.string().optional(),
    expected_end_date: z.string().optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
    initialData?: any // Pass checks if in edit mode
    onSuccess: () => void
}

export function ProjectForm({ initialData, onSuccess }: ProjectFormProps) {
    const { createDoc, loading: creating } = useFrappeCreateDoc()
    const { updateDoc, loading: updating } = useFrappeUpdateDoc()
    // Fetch Project Types for the dropdown
    const { data: projectTypes } = useFrappeGetDocList('Project Type', {
        fields: ['name']
    })

    const isLoading = creating || updating

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            project_name: "",
            project_type: "Internal",
            status: "Open",
            priority: "Medium",
            expected_end_date: "",
        },
    })

    // Reset form with initial data when editing
    useEffect(() => {
        if (initialData) {
            form.reset({
                project_name: initialData.project_name,
                project_type: initialData.project_type || "Internal",
                status: initialData.status,
                priority: initialData.priority,
                expected_start_date: initialData.expected_start_date,
                expected_end_date: initialData.expected_end_date,
            })
        } else {
            form.reset({
                project_name: "",
                project_type: "Internal",
                status: "Open",
                priority: "Medium",
                expected_start_date: "",
                expected_end_date: "",
            })
        }
    }, [initialData, form])

    const onSubmit = async (data: ProjectFormValues) => {
        try {
            if (initialData) {
                // Update mode
                await updateDoc('Project', initialData.name, data)
            } else {
                // Create mode
                await createDoc('Project', data)
            }
            onSuccess()
        } catch (error) {
            console.error("Failed to save project", error)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                    control={form.control}
                    name="project_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Website Redesign" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="project_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {projectTypes?.map((type: any) => (
                                            <SelectItem key={type.name} value={type.name}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                        {!projectTypes?.length && <SelectItem value="Internal">Internal</SelectItem>}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="expected_start_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Expected Start Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="expected_end_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Expected End Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <SheetFooter className="pt-4">
                    <SheetClose asChild>
                        <Button variant="outline" type="button">Cancel</Button>
                    </SheetClose>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Save Changes" : "Create Project"}
                    </Button>
                </SheetFooter>
            </form>
        </Form>
    )
}
