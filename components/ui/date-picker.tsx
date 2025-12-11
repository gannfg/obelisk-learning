"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date | string | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  required?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  name,
  required = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Convert value to Date if it's a string
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    if (date) {
      setOpen(false);
    }
  };

  // Format date for display
  const displayValue = dateValue ? format(dateValue, "dd/MM/yyyy") : "";

  // Hidden input for form submission
  const hiddenInputValue = dateValue
    ? format(dateValue, "yyyy-MM-dd")
    : "";

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !dateValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue || <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            initialFocus
            showOutsideDays={true}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2030}
            className="p-3"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-3",
              caption: "flex justify-center pt-1 relative items-center mb-3",
              caption_label: "text-sm font-medium flex items-center gap-1",
              caption_dropdowns: "flex items-center gap-1",
              dropdown: "text-sm font-medium bg-background border border-border rounded px-2 py-1",
              dropdown_month: "mr-1",
              dropdown_year: "ml-1",
              dropdown_icon: "ml-1 h-3 w-3",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 rounded",
                "inline-flex items-center justify-center",
                "border border-border bg-background",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
                "transition-colors cursor-pointer"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex mb-1",
              head_cell: "text-muted-foreground rounded w-9 font-normal text-xs",
              row: "flex w-full mt-0.5",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "h-9 w-9 p-0 font-normal",
                "inline-flex items-center justify-center rounded text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "aria-selected:bg-blue-500 aria-selected:text-white"
              ),
              day_selected: "bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-500 focus:text-white font-medium rounded",
              day_today: "bg-accent/30 text-accent-foreground font-medium",
              day_outside: "day-outside text-muted-foreground opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
          <div className="flex justify-between p-3 border-t bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange?.(undefined);
                setOpen(false);
              }}
              className="text-sm hover:bg-destructive/10 hover:text-destructive"
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                onChange?.(today);
                setOpen(false);
              }}
              className="text-sm hover:bg-primary/10 hover:text-primary"
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={hiddenInputValue}
        required={required}
      />
    </div>
  );
}

