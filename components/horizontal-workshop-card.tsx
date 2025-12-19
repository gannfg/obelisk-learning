import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Workshop } from "@/types/workshops";
import { Calendar, MapPin, Video, Users } from "lucide-react";
import { format } from "date-fns";

interface HorizontalWorkshopCardProps {
  workshop: Workshop;
}

export function HorizontalWorkshopCard({ workshop }: HorizontalWorkshopCardProps) {
  const isPast = workshop.datetime < new Date();

  return (
    <Link 
      href={`/workshops/${workshop.id}`}
      className="block w-full group"
    >
      <Card className="overflow-hidden w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
        <CardContent className="p-2.5 lg:p-4">
          <div className="flex items-center gap-2.5 lg:gap-4">
            {/* Small Image/Icon on Left */}
            <div className="flex-shrink-0">
              {workshop.imageUrl ? (
                <div className="relative w-12 h-12 lg:w-16 lg:h-16 rounded-lg overflow-hidden">
                  <Image
                    src={workshop.imageUrl}
                    alt={workshop.title}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Users className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 lg:gap-4 mb-0.5 lg:mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm lg:text-base font-semibold truncate mb-0.5 lg:mb-1">
                    {workshop.title}
                  </h3>
                  <p className="text-[10px] lg:text-xs text-muted-foreground line-clamp-1">
                    By {workshop.hostName}
                  </p>
                </div>
                {isPast && (
                  <span className="text-[9px] lg:text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    Past
                  </span>
                )}
              </div>
              
              {/* Tags/Metadata */}
              <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap text-[10px] lg:text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5 lg:gap-1">
                  <Calendar className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                  <span>{format(workshop.datetime, "MMM d, h:mm a")}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-0.5 lg:gap-1">
                  {workshop.locationType === "online" ? (
                    <>
                      <Video className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                      <span>{workshop.venueName || "Offline"}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
