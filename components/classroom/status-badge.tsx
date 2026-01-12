"use client";

import { CheckCircle2, RefreshCw, Clock, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType = "completed" | "in-progress" | "pending" | "locked" | "overdue";

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    colors: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20",
    defaultLabel: "Completed",
  },
  "in-progress": {
    icon: RefreshCw,
    colors: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20",
    defaultLabel: "In Progress",
  },
  pending: {
    icon: Clock,
    colors: "bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/20",
    defaultLabel: "Pending",
  },
  locked: {
    icon: Lock,
    colors: "bg-muted text-muted-foreground border-border",
    defaultLabel: "Locked",
  },
  overdue: {
    icon: AlertCircle,
    colors: "bg-red-500/10 text-red-700 dark:text-red-600 border-red-500/20",
    defaultLabel: "Overdue",
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-0.5 text-xs",
    icon: "h-3 w-3",
  },
  md: {
    container: "px-2.5 py-1 text-sm",
    icon: "h-4 w-4",
  },
  lg: {
    container: "px-3 py-1.5 text-base",
    icon: "h-5 w-5",
  },
};

export function StatusBadge({
  status,
  size = "md",
  className,
  showIcon = true,
  label,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.colors,
        sizeStyles.container,
        className
      )}
    >
      {showIcon && <Icon className={sizeStyles.icon} />}
      {displayLabel}
    </span>
  );
}
