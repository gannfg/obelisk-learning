"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./progress-bar";

interface Requirement {
  label: string;
  completed: boolean;
}

interface CompletionChecklistProps {
  requirements: Requirement[];
  className?: string;
  showProgress?: boolean;
}

export function CompletionChecklist({
  requirements,
  className,
  showProgress = true,
}: CompletionChecklistProps) {
  const completedCount = requirements.filter((r) => r.completed).length;
  const totalCount = requirements.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={cn("space-y-3", className)}>
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Progress</span>
            <span className="font-semibold">
              {completedCount} / {totalCount} completed
            </span>
          </div>
          <ProgressBar value={progress} showLabel={false} size="sm" />
        </div>
      )}
      <div className="space-y-2">
        {requirements.map((requirement, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-sm",
              requirement.completed
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {requirement.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{requirement.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
