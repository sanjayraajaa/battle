import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeGetDocList, useFrappeGetDoc } from "frappe-react-sdk"
import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import Calendar from "./calendar-standard-2"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Schema definition
const projectSchema = z.object({
    project_name: z.string().min(2, "Project name must be at least 2 characters"),
    project_type: z.string().optional(),
    status: z.string().min(1, "Please select a status"),
    priority: z.string().min(1, "Please select a priority"),
    expected_start_date: z.string().optional(),
    expected_end_date: z.string().optional(),
    is_active: z.boolean().default(true),
    department: z.string().optional(),
    notes: z.string().optional(),
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
    const { data: departments } = useFrappeGetDocList('Department', {
        fields: ['name']
    })



    const isLoading = creating || updating

    const { data: docType } = useFrappeGetDoc("DocType", "Project")

    const getOptions = (fieldname: string) => {
        if (!docType?.fields) return []
        const field = docType.fields.find((f: any) => f.fieldname === fieldname)
        return field?.options?.split("\n").filter(Boolean) || []
    }

    // Prepare default values based on initialData
    // We do this here instead of in useEffect to ensure the form initializes with data immediately
    // This avoids race conditions where reset() might be called too early or late
    const formDefaultValues: ProjectFormValues = {
        project_name: initialData?.project_name || "",
        project_type: initialData?.project_type || "",
        status: initialData?.status || "",
        priority: initialData?.priority || "",
        expected_start_date: initialData?.expected_start_date || "",
        expected_end_date: initialData?.expected_end_date || "",
        is_active: initialData ? (initialData.is_active === "Yes" || initialData.is_active === true || initialData.is_active === 1) : true,
        department: initialData?.department || "",
        notes: initialData?.notes || "",
    };

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: formDefaultValues,
    })

    // Only used for setting defaults from DocType when creating a New Project
    useEffect(() => {
        if (!initialData && docType) {
            form.reset({
                ...form.getValues(), // Keep any user input
                project_type: form.getValues("project_type") || getDefault("project_type"),
                status: form.getValues("status") || getDefault("status"),
                priority: form.getValues("priority") || getDefault("priority"),
            });
        }
    }, [docType, initialData, form]);

    const getDefault = (fieldname: string) => {
        if (!docType?.fields) return ""
        const field = docType.fields.find((f: any) => f.fieldname === fieldname)
        return field?.default || ""
    }

    const onSubmit = async (data: ProjectFormValues) => {
        const formData = {
            ...data,
            is_active: data.is_active ? "Yes" : "No"
        }
        try {
            if (initialData) {
                // Update mode
                await updateDoc('Project', initialData.name, formData)
            } else {
                // Create mode
                await createDoc('Project', formData)
            }
            onSuccess()
            toast.success(`Project ${initialData ? 'updated' : 'created'} successfully`)
        } catch (error: any) {
            console.error("Failed to save project", error)

            if (error?.exception?.includes("UniqueValidationError") && error?.exception?.includes("project_name")) {
                form.setError("project_name", {
                    type: "manual",
                    message: "Project Name must be unique"
                })
                toast.error("Project Name must be unique")
            } else {
                toast.error("Failed to save project. Please try again.")
            }
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField<ProjectFormValues, "project_name">
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
                    <FormField<ProjectFormValues, "department">
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {field.value && !departments?.some((d: any) => d.name === field.value) && (
                                            <SelectItem value={field.value}>{field.value}</SelectItem>
                                        )}
                                        {departments?.map((dept: any) => (
                                            <SelectItem key={dept.name} value={dept.name}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField<ProjectFormValues, "project_type">
                        control={form.control}
                        name="project_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {field.value && !projectTypes?.some((t: any) => t.name === field.value) && (
                                            <SelectItem value={field.value}>{field.value}</SelectItem>
                                        )}
                                        {projectTypes?.map((type: any) => (
                                            <SelectItem key={type.name} value={type.name}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField<ProjectFormValues, "priority">
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {field.value && !getOptions("priority").includes(field.value) && (
                                            <SelectItem value={field.value}>{field.value}</SelectItem>
                                        )}
                                        {getOptions("priority").map((option: string) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField<ProjectFormValues, "status">
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {field.value && !getOptions("status").includes(field.value) && (
                                        <SelectItem value={field.value}>{field.value}</SelectItem>
                                    )}
                                    {getOptions("status").map((option: string) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField<ProjectFormValues, "expected_start_date">
                        control={form.control}
                        name="expected_start_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Expected Start Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(new Date(field.value), "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : undefined}
                                            onSelect={(date: Date | undefined) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField<ProjectFormValues, "expected_end_date">
                        control={form.control}
                        name="expected_end_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Expected End Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(new Date(field.value), "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : undefined}
                                            onSelect={(date: Date | undefined) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField<ProjectFormValues, "notes">
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Add any additional notes here..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField<ProjectFormValues, "is_active">
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Active Project
                                </FormLabel>
                                <FormDescription>
                                    Is this project currently active?
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

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
