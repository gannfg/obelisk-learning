import { Card } from "@/components/ui/card";

export function MissionCardSkeleton() {
  return (
    <Card className="h-full animate-pulse overflow-hidden aspect-square">
      <div className="p-4 sm:p-5">
        {/* Top Section - Icon and Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>

        {/* Statistics Row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-10 bg-muted rounded" />
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full mb-2" />

        {/* Completion Status */}
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    </Card>
  );
}

