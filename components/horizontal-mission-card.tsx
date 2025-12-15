import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Mission } from "@/types";
import { Target, Clock, Code2 } from "lucide-react";

interface HorizontalMissionCardProps {
  mission: Mission;
}

export function HorizontalMissionCard({ mission }: HorizontalMissionCardProps) {
  return (
    <Link 
      href={`/missions/${mission.id}`}
      className="block w-full group"
    >
      <Card className="overflow-hidden w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
        <CardContent className="p-2.5 lg:p-4">
          <div className="flex items-center gap-2.5 lg:gap-4">
            {/* Small Image/Icon on Left */}
            <div className="flex-shrink-0">
              {mission.imageUrl ? (
                <div className="relative w-12 h-12 lg:w-16 lg:h-16 rounded-lg overflow-hidden">
                  <Image
                    src={mission.imageUrl}
                    alt={mission.title}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Target className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 lg:gap-4 mb-0.5 lg:mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm lg:text-base font-semibold truncate mb-0.5 lg:mb-1">
                    {mission.title}
                  </h3>
                  {mission.goal && (
                    <p className="text-[10px] lg:text-xs text-muted-foreground line-clamp-1">
                      {mission.goal}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-0.5 lg:gap-1">
                  <span className={`px-1.5 py-0.5 lg:px-2 text-[10px] lg:text-xs font-medium rounded-full capitalize ${
                    mission.difficulty === "beginner"
                      ? "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                      : mission.difficulty === "intermediate"
                      ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                      : "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                  }`}>
                    {mission.difficulty}
                  </span>
                </div>
              </div>
              
              {/* Tags/Metadata */}
              <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap text-[10px] lg:text-xs text-muted-foreground">
                {mission.stackType && (
                  <>
                    <div className="flex items-center gap-0.5 lg:gap-1">
                      <Code2 className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                      <span className="capitalize">{mission.stackType}</span>
                    </div>
                    {mission.submissionDeadline && <span>•</span>}
                  </>
                )}
                {mission.submissionDeadline && (
                  <div className="flex items-center gap-0.5 lg:gap-1">
                    <Clock className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                    <span>{mission.submissionDeadline.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}



