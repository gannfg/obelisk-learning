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
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Small Image/Icon on Left */}
            <div className="flex-shrink-0">
              {mission.imageUrl ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    src={mission.imageUrl}
                    alt={mission.title}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate mb-1">
                    {mission.title}
                  </h3>
                  {mission.goal && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {mission.goal}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Tags/Metadata */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                {mission.stackType && (
                  <>
                    <div className="flex items-center gap-1">
                      <Code2 className="h-3 w-3" />
                      <span className="capitalize">{mission.stackType}</span>
                    </div>
                    {mission.submissionDeadline && <span>•</span>}
                  </>
                )}
                {mission.submissionDeadline && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
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



