import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { useFrappeGetDocList } from "frappe-react-sdk";

// Helpers
const decimalToDuration = (decimal: number): string => {
    if (!decimal && decimal !== 0) return "";
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const durationToDecimal = (duration: string): number => {
    if (!duration) return 0;
    // Handle "HH:MM"
    if (duration.includes(":")) {
        const [h, m] = duration.split(":").map(Number);
        if (isNaN(h)) return 0;
        const mins = m || 0;
        return h + (mins / 60);
    }
    // Handle simple number "8" or "1.5" logic if user types decimal?
    // User requested "hh:mm only", but fallback is good.
    const floatVal = parseFloat(duration);
    return isNaN(floatVal) ? 0 : floatVal;
};

// Types
export interface TimesheetRowData {
    id: string; // Internal ID for React keys
    project: string;
    task: string;
    activity_type: string;
    description: string;
    // Map date string (YYYY-MM-DD) to hours string "HH:MM"
    hours_by_date: Record<string, string>;
}

interface TimesheetGridProps {
    rows: TimesheetRowData[];
    weekStart: Date;
    weekEnd: Date;
    onChange: (rows: TimesheetRowData[]) => void;
    readOnly?: boolean;
}

export function TimesheetGrid({ rows, weekStart, weekEnd, onChange, readOnly = false }: TimesheetGridProps) {
    // Generate days of the week based on range
    const daysCount = differenceInCalendarDays(weekEnd, weekStart) + 1;
    const days = Array.from({ length: Math.max(1, daysCount) }, (_, i) => addDays(weekStart, i));

    // Fetch options
    const { data: projects } = useFrappeGetDocList("Project", {
        fields: ["name", "project_name"],
        filters: [["status", "=", "Open"]]
    });

    const { data: activityTypes } = useFrappeGetDocList("Activity Type", {
        fields: ["name"]
    });

    // We need tasks for each project. 
    // Optimization: fetch all open tasks? Or strictly filter? 
    // Fetching all might be heavy. 
    // Let's rely on tasks being fetched per row? Or just fetch all relevant tasks.
    // For now, let's fetch all open tasks. If too many, we'd need a dynamic select component.
    const { data: tasks } = useFrappeGetDocList("Task", {
        fields: ["name", "subject", "project"],
        filters: [["status", "=", "Open"]]
    });

    const handleAddRow = () => {
        const newRow: TimesheetRowData = {
            id: Math.random().toString(36).substr(2, 9),
            project: "",
            task: "",
            activity_type: "",
            description: "",
            hours_by_date: {}
        };
        onChange([...rows, newRow]);
    };

    const handleRemoveRow = (index: number) => {
        const newRows = [...rows];
        newRows.splice(index, 1);
        onChange(newRows);
    };

    const updateRow = (index: number, field: keyof TimesheetRowData, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        onChange(newRows);
    };

    const updateHours = (index: number, dateStr: string, value: string) => {
        const newRows = [...rows];
        newRows[index].hours_by_date[dateStr] = value;
        onChange(newRows);
    };

    const handleBlurHours = (index: number, dateStr: string, value: string) => {
        // Auto-format on blur?
        // If user typed "8", make it "08:00"
        // If "1:3", make it "01:30"
        if (!value) return;

        let normalized = value;
        if (!value.includes(":")) {
            // Assume hours if no colon
            if (!isNaN(parseFloat(value))) {
                normalized = decimalToDuration(parseFloat(value));
            }
        } else {
            // Re-format likely "8:5" -> "08:05" ? Or "1:3" -> "1:30"?
            // Simple pass: convert to decimal then back
            const decimal = durationToDecimal(value);
            normalized = decimalToDuration(decimal);
        }

        if (normalized !== value) {
            updateHours(index, dateStr, normalized);
        }
    };

    // Calculate totals
    const getDailyTotal = (dateStr: string) => {
        const totalDec = rows.reduce((sum, row) => sum + durationToDecimal(row.hours_by_date[dateStr] || ""), 0);
        return decimalToDuration(totalDec);
    };

    const getRowTotal = (row: TimesheetRowData) => {
        const totalDec = Object.values(row.hours_by_date).reduce((sum, h) => sum + durationToDecimal(h || ""), 0);
        return decimalToDuration(totalDec);
    };

    const grandTotalDec = days.reduce((sum, day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        return sum + rows.reduce((dSum, row) => dSum + durationToDecimal(row.hours_by_date[dateStr] || ""), 0);
    }, 0);
    const grandTotal = decimalToDuration(grandTotalDec);

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">Project</TableHead>
                        <TableHead className="w-[150px]">Task</TableHead>
                        <TableHead className="w-[150px]">Activity</TableHead>
                        <TableHead className="w-[200px]">Description</TableHead>
                        {days.map(day => (
                            <TableHead key={day.toString()} className="text-center w-[80px]">
                                <div>{format(day, "EEE")}</div>
                                <div className="text-xs text-muted-foreground">{format(day, "d")}</div>
                            </TableHead>
                        ))}
                        <TableHead className="text-center w-[80px] font-bold">Total</TableHead>
                        {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, index) => (
                        <TableRow key={row.id}>
                            <TableCell>
                                <select
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                    value={row.project}
                                    onChange={(e) => updateRow(index, 'project', e.target.value)}
                                    disabled={readOnly}
                                >
                                    <option value="">Select Project</option>
                                    {projects?.map((p: any) => (
                                        <option key={p.name} value={p.name}>{p.project_name || p.name}</option>
                                    ))}
                                </select>
                            </TableCell>
                            <TableCell>
                                <select
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                    value={row.task}
                                    onChange={(e) => updateRow(index, 'task', e.target.value)}
                                    disabled={readOnly || !row.project}
                                >
                                    <option value="">Select Task</option>
                                    {tasks
                                        ?.filter((t: any) => t.project === row.project)
                                        .map((t: any) => (
                                            <option key={t.name} value={t.name}>{t.subject || t.name}</option>
                                        ))
                                    }
                                </select>
                            </TableCell>
                            <TableCell>
                                <select
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                    value={row.activity_type}
                                    onChange={(e) => updateRow(index, 'activity_type', e.target.value)}
                                    disabled={readOnly}
                                >
                                    <option value="">Select Activity</option>
                                    {activityTypes?.map((a: any) => (
                                        <option key={a.name} value={a.name}>{a.name}</option>
                                    ))}
                                </select>
                            </TableCell>
                            <TableCell>
                                <Input
                                    value={row.description}
                                    onChange={(e) => updateRow(index, 'description', e.target.value)}
                                    className="border-none shadow-none focus-visible:ring-0 px-0"
                                    placeholder="Description..."
                                    readOnly={readOnly}
                                />
                            </TableCell>
                            {days.map(day => {
                                const dateStr = format(day, "yyyy-MM-dd");
                                return (
                                    <TableCell key={dateStr} className="p-1">
                                        <Input
                                            type="text"
                                            className="text-center h-8 border-transparent hover:border-input focus:border-ring"
                                            placeholder="00:00"
                                            value={row.hours_by_date[dateStr] || ""}
                                            onChange={(e) => updateHours(index, dateStr, e.target.value)}
                                            onBlur={(e) => handleBlurHours(index, dateStr, e.target.value)}
                                            readOnly={readOnly}
                                        />
                                    </TableCell>
                                );
                            })}
                            <TableCell className="text-center font-bold">
                                {getRowTotal(row)}
                            </TableCell>
                            {!readOnly && (
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4}>
                            {!readOnly && (
                                <Button variant="ghost" className="text-primary hover:text-primary/90" onClick={handleAddRow}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Line
                                </Button>
                            )}
                        </TableCell>
                        {days.map(day => (
                            <TableCell key={day.toString()} className="text-center font-bold">
                                {getDailyTotal(format(day, "yyyy-MM-dd"))}
                            </TableCell>
                        ))}
                        <TableCell className="text-center font-bold text-lg">{grandTotal}</TableCell>
                        {!readOnly && <TableCell></TableCell>}
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}

// Export for usage in parent
export { durationToDecimal, decimalToDuration };
