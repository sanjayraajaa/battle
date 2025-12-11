"use client";

import type { ChangeEvent, ChangeEventHandler } from "react";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DayPicker } from "react-day-picker";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const CalendarStandard2 = ({ ...props }: CalendarProps) => {
  const handleCalendarChange = (
    value: string | number,
    event: ChangeEventHandler<HTMLSelectElement>,
  ) => {
    const newEvent = {
      target: {
        value: String(value),
      },
    } as ChangeEvent<HTMLSelectElement>;
    event(newEvent);
  };

  return (
    <Calendar
      captionLayout="dropdown"
      className="p-3 shadow-none border-0"
      components={{
        MonthCaption: (props) => <>{props.children}</>,
        DropdownNav: (props) => (
          <div className="flex w-full items-center gap-2">{props.children}</div>
        ),
        Dropdown: (props) => (
          <Select
            onValueChange={(value) => {
              if (props.onChange) {
                handleCalendarChange(value, props.onChange);
              }
            }}
            value={String(props.value)}
          >
            <SelectTrigger className="h-7 w-full border-0 p-0 font-medium shadow-none focus:ring-0 focus:ring-offset-0 bg-transparent hover:bg-accent hover:text-accent-foreground px-2 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {props.options?.map((option) => (
                <SelectItem
                  disabled={option.disabled}
                  key={option.value}
                  value={String(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      }}
      hideNavigation
      {...props}
    />
  );
};

export default CalendarStandard2;
