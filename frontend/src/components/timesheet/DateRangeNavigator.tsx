import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, differenceInDays, addDays, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangeNavigatorProps {
    startDate: Date;
    endDate: Date;
    onChange: (start: Date, end: Date) => void;
    onToday: () => void;
}

export function DateRangeNavigator({
    startDate,
    endDate,
    onChange,
    onToday,
}: DateRangeNavigatorProps) {

    const handlePrev = () => {
        // Shift range backwards by range duration
        const duration = differenceInDays(endDate, startDate) + 1;
        onChange(subDays(startDate, duration), subDays(endDate, duration));
    };

    const handleNext = () => {
        // Shift range forwards by range duration
        const duration = differenceInDays(endDate, startDate) + 1;
        onChange(addDays(startDate, duration), addDays(endDate, duration));
    };

    // Helper to update just start or end
    const setStart = (date: Date | undefined) => {
        if (!date) return;
        // Ensure start <= end. If not, push end.
        if (date > endDate) {
            onChange(date, date);
        } else {
            onChange(date, endDate);
        }
    };

    const setEnd = (date: Date | undefined) => {
        if (!date) return;
        // Ensure end >= start. If not, push start.
        if (date < startDate) {
            onChange(date, date);
        } else {
            onChange(startDate, date);
        }
    };

    return (
        <div className="flex items-center space-x-4 mb-4">
            <Button variant="outline" size="sm" onClick={onToday}>
                Today
            </Button>

            <div className="flex items-center space-x-2 border rounded-md p-1">
                <Button variant="ghost" size="icon" onClick={handlePrev}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-2">
                    <DatePickerWithIcon date={startDate} onSelect={setStart} />
                    <span className="text-muted-foreground">-</span>
                    <DatePickerWithIcon date={endDate} onSelect={setEnd} />
                </div>

                <Button variant="ghost" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function DatePickerWithIcon({ date, onSelect }: { date: Date, onSelect: (d: Date | undefined) => void }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"ghost"}
                    className={cn(
                        "w-[140px] justify-start text-left font-normal h-8 px-2",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM dd, yyyy") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={onSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
