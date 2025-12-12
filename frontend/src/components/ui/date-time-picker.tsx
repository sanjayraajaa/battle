"use client";

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";

interface DateTimePickerProps {
    date?: Date;
    setDate: (date: Date | undefined) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Initialize time state from the provided date prop
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);

    useEffect(() => {
        // When the prop changes, sync internal state if different
        if (date) {
            setSelectedDate(date);
        }
    }, [date]);


    function handleDateSelect(newDate: Date | undefined) {
        if (newDate) {
            const currentDate = selectedDate || new Date();
            // Preserve time from current selection
            newDate.setHours(currentDate.getHours());
            newDate.setMinutes(currentDate.getMinutes());
            newDate.setSeconds(currentDate.getSeconds()); // Optional

            setSelectedDate(newDate);
            setDate(newDate);
        } else {
            setSelectedDate(undefined);
            setDate(undefined);
        }
    }

    function handleTimeChange(type: "hour" | "minute" | "ampm", value: string) {
        const currentDate = selectedDate || new Date();
        const newDate = new Date(currentDate);

        if (type === "hour") {
            const hour = parseInt(value, 10);
            const currentHour = newDate.getHours();
            // Handle 12-hour logic carefully
            const isPM = currentHour >= 12;

            let newHour = hour;
            if (hour === 12) {
                // If selecting 12, it's 12 PM if previously PM, else 0 (12 AM) if previously AM
                // BUT standard logic:
                // 12 (clicked) -> if was AM/PM?
                // Let's assume the button values are 1-12.
                if (isPM) {
                    newHour = 12; // 12 PM = 12
                } else {
                    newHour = 0;  // 12 AM = 0
                }
            } else {
                // 1-11
                if (isPM) newHour += 12;
            }

            // Simplification: Just set based on ampm state logic which might be better
            // Resetting to base 12h:
            let baseHour = hour % 12; // 12->0, 1->1 ... 11->11
            if (isPM) baseHour += 12;

            // BUT waittt, if I click "1" and it was "1 PM", I want "1 PM" (13).
            // If I click "1" and it was "1 AM", I want "1 AM" (1).
            // The snippet provided in prompt had logic:
            // newDate.setHours(newDate.getHours() >= 12 ? hour + 12 : hour);
            // This is slightly buggy for 12? 12 + 12 = 24!

            // Let's re-implement robustly.
            // We want to set the hour to `value` (1-12) while preserving AM/PM.
            const currentHours = newDate.getHours();
            const isPm = currentHours >= 12;

            let targetHour = parseInt(value, 10) % 12; // 12->0, 11->11
            if (isPm) targetHour += 12;

            newDate.setHours(targetHour);

        } else if (type === "minute") {
            newDate.setMinutes(parseInt(value, 10));
        } else if (type === "ampm") {
            const hours = newDate.getHours();
            if (value === "AM" && hours >= 12) {
                newDate.setHours(hours - 12);
            } else if (value === "PM" && hours < 12) {
                newDate.setHours(hours + 12);
            }
        }

        setSelectedDate(newDate);
        setDate(newDate);
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full pl-3 text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    {date ? (
                        format(date, "MM/dd/yyyy hh:mm aa")
                    ) : (
                        <span>MM/DD/YYYY hh:mm aa</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="sm:flex">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                    <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 12 }, (_, i) => i + 1)
                                    .reverse()
                                    .map((hour) => (
                                        <Button
                                            key={hour}
                                            size="icon"
                                            variant={
                                                selectedDate &&
                                                    ((selectedDate.getHours() % 12) || 12) === hour
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            className="sm:w-full shrink-0 aspect-square"
                                            onClick={() =>
                                                handleTimeChange("hour", hour.toString())
                                            }
                                        >
                                            {hour}
                                        </Button>
                                    ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                    <Button
                                        key={minute}
                                        size="icon"
                                        variant={
                                            selectedDate && selectedDate.getMinutes() === minute
                                                ? "default"
                                                : "ghost"
                                        }
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() =>
                                            handleTimeChange("minute", minute.toString())
                                        }
                                    >
                                        {minute.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>
                        <ScrollArea className="">
                            <div className="flex sm:flex-col p-2">
                                {["AM", "PM"].map((ampm) => (
                                    <Button
                                        key={ampm}
                                        size="icon"
                                        variant={
                                            selectedDate &&
                                                ((ampm === "AM" && selectedDate.getHours() < 12) ||
                                                    (ampm === "PM" && selectedDate.getHours() >= 12))
                                                ? "default"
                                                : "ghost"
                                        }
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() => handleTimeChange("ampm", ampm)}
                                    >
                                        {ampm}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
