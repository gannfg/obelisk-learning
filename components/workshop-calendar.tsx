"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Workshop } from "@/types/workshops";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths } from "date-fns";

interface WorkshopCalendarProps {
  workshops: Workshop[];
  selectedDate?: Date | null;
  onDateSelect?: (date: Date | null) => void;
  filter: "upcoming" | "past";
  onFilterChange?: (filter: "upcoming" | "past") => void;
}

export function WorkshopCalendar({
  workshops,
  selectedDate,
  onDateSelect,
  filter,
  onFilterChange,
}: WorkshopCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get workshops for a specific date
  const getWorkshopsForDate = (date: Date): Workshop[] => {
    return workshops.filter((workshop) => {
      const workshopDate = new Date(workshop.datetime);
      return isSameDay(workshopDate, date);
    });
  };

  // Get all dates that have workshops
  const getDatesWithWorkshops = (): Set<string> => {
    const dates = new Set<string>();
    workshops.forEach((workshop) => {
      const date = new Date(workshop.datetime);
      dates.add(format(date, "yyyy-MM-dd"));
    });
    return dates;
  };

  const datesWithWorkshops = getDatesWithWorkshops();

  // Calendar setup
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = getDay(monthStart);
  
  // Create calendar grid
  const calendarDays: (Date | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  daysInMonth.forEach((day) => {
    calendarDays.push(day);
  });

  // Add days after month ends to fill the grid (6 rows × 7 days = 42 cells)
  const remainingCells = 42 - calendarDays.length;
  const nextMonth = addMonths(currentMonth, 1);
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i));
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date | null) => {
    if (date && isSameMonth(date, currentMonth)) {
      onDateSelect?.(date);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">{format(currentMonth, "MMMM")}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
          <div key={idx} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="aspect-square" />;
          }

          const dayKey = format(day, "yyyy-MM-dd");
          const hasWorkshops = datesWithWorkshops.has(dayKey);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={idx}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square rounded-md text-sm transition-colors
                ${!isCurrentMonth ? "text-muted-foreground/50" : "text-foreground"}
                ${isSelected ? "bg-primary text-primary-foreground font-semibold" : ""}
                ${!isSelected && isCurrentMonth && hasWorkshops ? "bg-primary/20 hover:bg-primary/30" : ""}
                ${!isSelected && isCurrentMonth && !hasWorkshops ? "hover:bg-muted" : ""}
                ${isToday && !isSelected ? "ring-2 ring-primary/50" : ""}
                flex flex-col items-center justify-center relative
              `}
            >
              <span>{format(day, "d")}</span>
              {hasWorkshops && isCurrentMonth && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Tabs */}
      {onFilterChange && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("upcoming")}
            className="flex-1"
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "past" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("past")}
            className="flex-1"
          >
            Past
          </Button>
        </div>
      )}
    </div>
  );
}

