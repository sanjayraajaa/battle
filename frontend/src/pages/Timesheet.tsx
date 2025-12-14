import { useState, useEffect, useRef, useCallback } from "react";
import { startOfWeek, endOfWeek, format, isSameDay } from "date-fns";
import { DateRangeNavigator } from "@/components/timesheet/DateRangeNavigator";
import { TimesheetGrid, type TimesheetRowData, decimalToDuration, durationToDecimal } from "@/components/timesheet/TimesheetGrid";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function Timesheet() {
    // Default to current week
    const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [endDate, setEndDate] = useState(() => endOfWeek(new Date(), { weekStartsOn: 1 }));

    const [rows, setRows] = useState<TimesheetRowData[]>([]);
    const [lastSavedRows, setLastSavedRows] = useState<string>("[]"); // To avoid saving if no changes
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

    const { data, isLoading, mutate } = useFrappeGetCall(
        "battle.api.timesheet_api.get_weekly_timesheet",
        {
            start_date: format(startDate, "yyyy-MM-dd"),
            end_date: format(endDate, "yyyy-MM-dd"),
        },
        "get_weekly_timesheet"
    );

    const { call: saveTimesheet } = useFrappePostCall(
        "battle.api.timesheet_api.save_weekly_timesheet"
    );

    useEffect(() => {
        if (data?.rows) {
            // Map API rows (decimal) to UI rows (hh:mm string)
            const mappedRows = data.rows.map((r: any) => {
                const hoursByDate: Record<string, string> = {};
                Object.entries(r.hours_by_date || {}).forEach(([date, hours]) => {
                    hoursByDate[date] = decimalToDuration(hours as number);
                });

                return {
                    id: Math.random().toString(36).substr(2, 9),
                    project: r.project,
                    task: r.task,
                    activity_type: r.activity_type,
                    description: r.description,
                    hours_by_date: hoursByDate
                };
            });
            setRows(mappedRows);
            setLastSavedRows(JSON.stringify(mappedRows));
        } else {
            setRows([]);
            setLastSavedRows("[]");
        }
    }, [data]);

    const handleRangeChange = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
    };

    const handleToday = () => {
        setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
        setEndDate(endOfWeek(new Date(), { weekStartsOn: 1 }));
    };

    const saveToBackend = async (currentRows: TimesheetRowData[], submit = false) => {
        if (!submit) setSaveStatus("saving");
        try {
            // Convert UI rows (hh:mm) back to API rows (decimal) locally for sending
            const apiRows = currentRows.map(r => {
                const hoursByDate: Record<string, number> = {};
                Object.entries(r.hours_by_date).forEach(([date, duration]) => {
                    const dec = durationToDecimal(duration);
                    if (dec > 0) hoursByDate[date] = dec;
                });
                return {
                    project: r.project,
                    task: r.task,
                    activity_type: r.activity_type,
                    description: r.description,
                    hours_by_date: hoursByDate
                };
            });

            await saveTimesheet({
                week_start: format(startDate, "yyyy-MM-dd"),
                week_end: format(endDate, "yyyy-MM-dd"),
                rows: apiRows,
                action: submit ? "Submit" : "Save"
            });

            if (submit) {
                toast.success("Timesheet submitted successfully");
                mutate();
            } else {
                setSaveStatus("saved");
                setLastSavedRows(JSON.stringify(currentRows));
                // Reset saved status after a bit
                setTimeout(() => setSaveStatus("idle"), 3000);
            }
        } catch (e) {
            if (!submit) setSaveStatus("error");
            toast.error("Failed to save timesheet");
            console.error(e);
        }
    };

    // Auto-save effect
    useEffect(() => {
        // Don't auto-save if submitted or loading
        if (isLoading || data?.docstatus === 1) return;

        const currentRowsString = JSON.stringify(rows);
        if (currentRowsString === lastSavedRows) return;

        const timer = setTimeout(() => {
            saveToBackend(rows);
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [rows, lastSavedRows, isLoading, data?.docstatus]);

    const handleSubmit = () => {
        saveToBackend(rows, true);
    };

    const isSubmitted = data?.docstatus === 1;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Timesheet</h1>
                    {/* Save Status Indicator */}
                    {!isSubmitted && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {saveStatus === "saving" && (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Saving...
                                </>
                            )}
                            {saveStatus === "saved" && (
                                <>
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    All changes saved
                                </>
                            )}
                            {saveStatus === "error" && (
                                <span className="text-destructive">Error saving</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="space-x-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={saveStatus === "saving" || isSubmitted || isLoading}
                    >
                        {isSubmitted ? "Submitted" : "Submit Week"}
                    </Button>
                </div>
            </div>

            <DateRangeNavigator
                startDate={startDate}
                endDate={endDate}
                onChange={handleRangeChange}
                onToday={handleToday}
            />

            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-base">Activities</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : (
                        <TimesheetGrid
                            rows={rows}
                            weekStart={startDate}
                            weekEnd={endDate}
                            onChange={setRows}
                            readOnly={isSubmitted}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
