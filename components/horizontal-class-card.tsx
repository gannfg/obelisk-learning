import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Class } from "@/types";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";

interface HorizontalClassCardProps {
  classItem: Class;
}

export function HorizontalClassCard({ classItem }: HorizontalClassCardProps) {
  return (
    <Link 
      href={`/academy/classes/${classItem.id}`}
      className="block w-full group"
    >
      <Card className="overflow-hidden w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Small Image/Icon on Left */}
            <div className="flex-shrink-0">
              {classItem.thumbnail ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    src={classItem.thumbnail}
                    alt={classItem.title}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate mb-1">
                    {classItem.title}
                  </h3>
                  {classItem.category && (
                    <p className="text-xs text-muted-foreground truncate">
                      {classItem.category}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    classItem.status === "ongoing"
                      ? "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                      : classItem.status === "upcoming"
                      ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                      : classItem.status === "completed"
                      ? "bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {classItem.status}
                  </span>
                </div>
              </div>
              
              {/* Tags/Metadata */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                {classItem.semester && (
                  <>
                    <span>{classItem.semester}</span>
                    <span>•</span>
                  </>
                )}
                <span>Starts {format(classItem.startDate, "MMM d")}</span>
                {classItem.maxCapacity && (
                  <>
                    <span>•</span>
                    <span>{classItem.maxCapacity} students</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

