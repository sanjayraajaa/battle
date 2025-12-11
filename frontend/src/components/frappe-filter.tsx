
import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type FilterOperator = "=" | "!=" | "like" | "not like" | "in" | "not in" | ">" | "<" | ">=" | "<=" | "Between";
export type Filter = [string, FilterOperator, any];

export interface FieldDefinition {
    label: string;
    value: string;
    type: string;
    options?: string;
}

interface FrappeFilterProps {
    fields: FieldDefinition[];
    filters: Filter[];
    onFiltersChange: (filters: Filter[]) => void;
    onApply: () => void;
    onClear: () => void;
}

const OPERATORS = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "Like", value: "like" },
    { label: "Not Like", value: "not like" },
    { label: "In", value: "in" },
    { label: "Not In", value: "not in" },
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" },
    { label: "Less Than or Equal To", value: "<=" },
    { label: "Between", value: "Between" },
];

export function FrappeFilter({ fields, filters, onFiltersChange, onApply, onClear }: FrappeFilterProps) {
    const addFilterRow = () => {
        // Default to first field if available
        const defaultField = fields.length > 0 ? fields[0].value : "";
        onFiltersChange([...filters, [defaultField, "=", ""]]);
    };

    const removeFilterRow = (index: number) => {
        const newFilters = [...filters];
        newFilters.splice(index, 1);
        onFiltersChange(newFilters);
    };

    const updateFilterRow = (index: number, position: 0 | 1 | 2, value: any) => {
        const newFilters = [...filters];
        newFilters[index][position] = value;

        // precise handling: if field changes, reset value and operator
        if (position === 0) {
            newFilters[index][2] = "";
            newFilters[index][1] = "=";
        }

        onFiltersChange(newFilters);
    };

    const renderValueInput = (filter: Filter, index: number) => {
        const [fieldName, operator, value] = filter;
        const fieldDef = fields.find((f) => f.value === fieldName);

        if (!fieldDef) {
            return (
                <Input
                    value={value}
                    onChange={(e) => updateFilterRow(index, 2, e.target.value)}
                    className="h-8 w-full"
                    placeholder="Value..."
                />
            );
        }

        if (fieldDef.type === "Select" && fieldDef.options) {
            const opts = fieldDef.options.split("\n").filter((o) => o);
            return (
                <Select
                    value={value}
                    onValueChange={(val) => updateFilterRow(index, 2, val)}
                >
                    <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {opts.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        if (fieldDef.type === "Date" || fieldDef.type === "Datetime") {
            if (operator === "Between") {
                const [start, end] = Array.isArray(value) ? value : ["", ""];
                return (
                    <div className="flex gap-2 w-full">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "h-8 flex-1 justify-start text-left font-normal px-2",
                                        !start && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {start ? format(new Date(start), "MM/dd/yy") : <span>Start</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={start ? new Date(start) : undefined}
                                    onSelect={(date) => {
                                        const newStart = date ? format(date, "yyyy-MM-dd") : "";
                                        updateFilterRow(index, 2, [newStart, end]);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "h-8 flex-1 justify-start text-left font-normal px-2",
                                        !end && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {end ? format(new Date(end), "MM/dd/yy") : <span>End</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={end ? new Date(end) : undefined}
                                    onSelect={(date) => {
                                        const newEnd = date ? format(date, "yyyy-MM-dd") : "";
                                        updateFilterRow(index, 2, [start, newEnd]);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                );
            }

            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "h-8 w-full justify-start text-left font-normal",
                                !value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={value ? new Date(value) : undefined}
                            onSelect={(date) => updateFilterRow(index, 2, date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            );
        }

        return (
            <Input
                value={value}
                onChange={(e) => updateFilterRow(index, 2, e.target.value)}
                className="h-8 w-full"
                placeholder="Value..."
            />
        );
    };

    return (
        <div className="grid gap-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Advanced Filters</h4>
                <p className="text-sm text-muted-foreground">
                    Filter by specific conditions.
                </p>
            </div>

            <div className="grid gap-2">
                {filters.map((filter, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 items-center"
                    >
                        {/* Field Selector */}
                        <Select
                            value={filter[0]}
                            onValueChange={(val) => updateFilterRow(index, 0, val)}
                        >
                            <SelectTrigger className="h-8 w-full">
                                <SelectValue placeholder="Field" />
                            </SelectTrigger>
                            <SelectContent>
                                {fields.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>
                                        {f.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Operator Selector */}
                        <Select
                            value={filter[1]}
                            onValueChange={(val) => updateFilterRow(index, 1, val)}
                        >
                            <SelectTrigger className="h-8 w-full">
                                <SelectValue placeholder="Op" />
                            </SelectTrigger>
                            <SelectContent>
                                {OPERATORS.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                        {op.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Value Input (Flexible Width) */}
                        <div className="flex-1 w-full">
                            {renderValueInput(filter, index)}
                        </div>

                        {/* Remove Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeFilterRow(index)}
                        >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </div>
                ))}

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-dashed"
                    onClick={addFilterRow}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Filter
                </Button>
            </div>

            <div className="flex justify-between pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={onClear}>
                    Clear All
                </Button>
                <Button size="sm" onClick={onApply}>
                    Apply Filters
                </Button>
            </div>
        </div>
    );
}
