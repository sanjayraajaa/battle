import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface WeekSelectorProps {
    startDate: Date;
    endDate: Date;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
}

export function WeekSelector({
    startDate,
    endDate,
    onPrev,
    onNext,
    onToday,
}: WeekSelectorProps) {
    return (
        <div className="flex items-center space-x-4 mb-4">
            <Button variant="outline" size="sm" onClick={onToday}>
                Today
            </Button>
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={onPrev}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-medium">
                    {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                </div>
                <Button variant="ghost" size="icon" onClick={onNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
