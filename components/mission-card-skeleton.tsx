import { Card } from "@/components/ui/card";

export function MissionCardSkeleton() {
  return (
    <Card className="p-6 h-full animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>
      <div className="h-2 bg-muted rounded-full mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-6 bg-muted rounded w-16" />
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    </Card>
  );
}

