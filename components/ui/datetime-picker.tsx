"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

export interface DateTimePickerProps {
  value?: Date | string | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  required?: boolean;
  minDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date and time",
  disabled = false,
  className,
  name,
  required = false,
  minDate,
}: DateTimePickerProps) {
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

  // State for time inputs
  const [hours, setHours] = React.useState(() => 
    dateValue ? String(dateValue.getHours()).padStart(2, '0') : '09'
  );
  const [minutes, setMinutes] = React.useState(() => 
    dateValue ? String(dateValue.getMinutes()).padStart(2, '0') : '00'
  );

  // Update time inputs when dateValue changes
  React.useEffect(() => {
    if (dateValue) {
      setHours(String(dateValue.getHours()).padStart(2, '0'));
      setMinutes(String(dateValue.getMinutes()).padStart(2, '0'));
    }
  }, [dateValue]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(undefined);
      return;
    }
    
    // Create new date with selected time
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours || '0'));
    newDate.setMinutes(parseInt(minutes || '0'));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    onChange?.(newDate);
  };

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    if (!dateValue) return;
    
    const newDate = new Date(dateValue);
    newDate.setHours(parseInt(newHours || '0'));
    newDate.setMinutes(parseInt(newMinutes || '0'));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    onChange?.(newDate);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) value = value.slice(0, 2);
    const numValue = parseInt(value || '0');
    if (numValue > 23) value = '23';
    setHours(value);
    if (value.length === 2) {
      handleTimeChange(value, minutes);
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) value = value.slice(0, 2);
    const numValue = parseInt(value || '0');
    if (numValue > 59) value = '59';
    setMinutes(value);
    if (value.length === 2) {
      handleTimeChange(hours, value);
    }
  };

  const handleHoursBlur = () => {
    const paddedHours = hours.padStart(2, '0');
    setHours(paddedHours);
    if (dateValue) {
      handleTimeChange(paddedHours, minutes);
    }
  };

  const handleMinutesBlur = () => {
    const paddedMinutes = minutes.padStart(2, '0');
    setMinutes(paddedMinutes);
    if (dateValue) {
      handleTimeChange(hours, paddedMinutes);
    }
  };

  // Format date for display
  const displayValue = dateValue 
    ? format(dateValue, "MMM d, yyyy 'at' h:mm a") 
    : "";

  // ISO string for form submission
  const hiddenInputValue = dateValue
    ? dateValue.toISOString()
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
              "w-full justify-start text-left font-normal h-11",
              !dateValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{displayValue || <span>{placeholder}</span>}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            disabled={minDate ? { before: minDate } : undefined}
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
                "aria-selected:bg-primary aria-selected:text-primary-foreground"
              ),
              day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-medium rounded",
              day_today: "bg-accent text-accent-foreground font-medium",
              day_outside: "day-outside text-muted-foreground opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
          
          {/* Time Selection */}
          <div className="border-t p-4 space-y-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Time</Label>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Input
                type="text"
                inputMode="numeric"
                value={hours}
                onChange={handleHoursChange}
                onBlur={handleHoursBlur}
                placeholder="HH"
                maxLength={2}
                className="w-16 text-center text-base font-medium h-11"
              />
              <span className="text-2xl font-semibold">:</span>
              <Input
                type="text"
                inputMode="numeric"
                value={minutes}
                onChange={handleMinutesChange}
                onBlur={handleMinutesBlur}
                placeholder="MM"
                maxLength={2}
                className="w-16 text-center text-base font-medium h-11"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              24-hour format (HH:MM)
            </p>
          </div>

          {/* Actions */}
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
                const now = new Date();
                onChange?.(now);
                setHours(String(now.getHours()).padStart(2, '0'));
                setMinutes(String(now.getMinutes()).padStart(2, '0'));
                setOpen(false);
              }}
              className="text-sm hover:bg-primary/10 hover:text-primary"
            >
              Now
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
