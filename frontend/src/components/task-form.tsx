
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeGetDocList, useFrappeGetDoc } from "frappe-react-sdk"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,

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
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ColorPicker } from "./ui/color-picker"
import { DateTimePicker } from "./ui/date-time-picker"
import { MultiSelect } from "./ui/multi-select"
import { Separator } from "@/components/ui/separator"

// Schema definition
const taskSchema = z.object({
    subject: z.string().min(2, "Subject must be at least 2 characters"),
    status: z.string().min(1, "Please select a status"),
    project: z.string().optional(),
    priority: z.string().optional(),
    type: z.string().optional(),
    color: z.string().optional(),
    is_group: z.boolean().default(false),
    exp_start_date: z.string().optional(),
    exp_end_date: z.string().optional(),
    expected_time: z.number().optional().or(z.string().transform((val) => (val === "" ? undefined : Number(val)))),
    is_milestone: z.boolean().default(false),
    description: z.string().optional(),
    dependent_tasks: z.array(z.string()).optional(),
})

type TaskFormValues = z.infer<typeof taskSchema>

interface TaskFormProps {
    initialData?: any
    onSuccess: () => void
}

export function TaskForm({ initialData, onSuccess }: TaskFormProps) {
    const { createDoc, loading: creating } = useFrappeCreateDoc()
    const { updateDoc, loading: updating } = useFrappeUpdateDoc()

    // Fetch dependent data
    const { data: projects } = useFrappeGetDocList('Project', {
        fields: ['name', 'project_name']
    })

    // Fetch tasks for dependency selection
    const { data: tasks } = useFrappeGetDocList('Task', {
        fields: ['name', 'subject'],
        filters: initialData ? [['name', '!=', initialData.name]] : undefined
    })

    const isLoading = creating || updating

    const { data: docType } = useFrappeGetDoc("DocType", "Task")


    const formDefaultValues: TaskFormValues = {
        subject: initialData?.subject || "",
        status: initialData?.status || "Open",
        project: initialData?.project || "",
        priority: initialData?.priority || "Medium",
        type: initialData?.type || "",
        color: initialData?.color || "",
        is_group: initialData ? (initialData.is_group === 1 || initialData.is_group === true) : false,
        exp_start_date: initialData?.exp_start_date || "",
        exp_end_date: initialData?.exp_end_date || "",
        expected_time: initialData?.expected_time || undefined,
        is_milestone: initialData ? (initialData.is_milestone === 1 || initialData.is_milestone === true) : false,
        description: initialData?.description || "",
        dependent_tasks: initialData?.depends_on?.map((d: any) => d.task) || []
    };

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: formDefaultValues,
    })

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset({
                subject: initialData.subject || "",
                status: initialData.status || "Open",
                project: initialData.project || "",
                priority: initialData.priority || "Medium",
                type: initialData.type || "",
                color: initialData.color || "",
                is_group: (initialData.is_group === 1 || initialData.is_group === true),
                exp_start_date: initialData.exp_start_date || "",
                exp_end_date: initialData.exp_end_date || "",
                expected_time: initialData.expected_time || undefined,
                is_milestone: (initialData.is_milestone === 1 || initialData.is_milestone === true),
                description: initialData.description || "",
                dependent_tasks: initialData.depends_on?.map((d: any) => d.task) || []
            })
        }
    }, [initialData, form]);


    const onSubmit = async (data: TaskFormValues) => {
        const formData = {
            ...data,
            is_group: data.is_group ? 1 : 0,
            is_milestone: data.is_milestone ? 1 : 0,
            depends_on: data.dependent_tasks?.map(task => ({ task })) || []
        }
        delete (formData as any).dependent_tasks; // Remove frontend-only field

        try {
            if (initialData) {
                await updateDoc('Task', initialData.name, formData)
            } else {
                await createDoc('Task', formData)
            }
            onSuccess()
            toast.success(`Task ${initialData ? 'updated' : 'created'} successfully`)
        } catch (error: any) {
            console.error("Failed to save task", error)
            toast.error("Failed to save task. Please try again.")
        }
    }

    const taskOptions = tasks?.map((t: any) => ({
        label: t.subject,
        value: t.name
    })) || []

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

                {/* Overview Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overview</h3>
                    <FormField<TaskFormValues, "subject">
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                    <Input placeholder="Task subject..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField<TaskFormValues, "project">
                            control={form.control}
                            name="project"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Project" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {projects?.map((proj: any) => (
                                                <SelectItem key={proj.name} value={proj.name}>
                                                    {proj.project_name || proj.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField<TaskFormValues, "status">
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {["Open", "Working", "Pending Review", "Completed", "Cancelled"].map(opt => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Details Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField<TaskFormValues, "priority">
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Priority" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {["Low", "Medium", "High", "Urgent"].map(opt => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField<TaskFormValues, "type">
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Input placeholder="Task Type" {...field} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField<TaskFormValues, "description">
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Task details..." className="min-h-[100px] resize-none" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField<TaskFormValues, "color">
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <FormControl>
                                        <ColorPicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField<TaskFormValues, "expected_time">
                            control={form.control}
                            name="expected_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Expected Time (Hours)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.5" placeholder="0.0" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex gap-6">
                        <FormField<TaskFormValues, "is_group">
                            control={form.control}
                            name="is_group"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel className="font-normal">Is Group</FormLabel>
                                </FormItem>
                            )}
                        />
                        <FormField<TaskFormValues, "is_milestone">
                            control={form.control}
                            name="is_milestone"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel className="font-normal">Is Milestone</FormLabel>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Schedule & Dependencies */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Schedule & Dependencies</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField<TaskFormValues, "exp_start_date">
                            control={form.control}
                            name="exp_start_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Exp. Start Date</FormLabel>
                                    <FormControl>
                                        <DateTimePicker
                                            date={field.value ? new Date(field.value) : undefined}
                                            setDate={(date) => field.onChange(date ? format(date, "yyyy-MM-dd HH:mm:ss") : "")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField<TaskFormValues, "exp_end_date">
                            control={form.control}
                            name="exp_end_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Exp. End Date</FormLabel>
                                    <FormControl>
                                        <DateTimePicker
                                            date={field.value ? new Date(field.value) : undefined}
                                            setDate={(date) => field.onChange(date ? format(date, "yyyy-MM-dd HH:mm:ss") : "")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField<TaskFormValues, "dependent_tasks">
                        control={form.control}
                        name="dependent_tasks"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dependent Tasks</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={taskOptions}
                                        selected={field.value || []}
                                        onChange={field.onChange}
                                        placeholder="Select dependent tasks..."
                                    />
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
                        {initialData ? "Save Changes" : "Create Task"}
                    </Button>
                </SheetFooter>
            </form>
        </Form>
    )
}
