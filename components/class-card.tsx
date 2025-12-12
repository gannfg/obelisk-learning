import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Class } from "@/types";
import { format } from "date-fns";

interface ClassCardProps {
  classItem: Class;
  priority?: boolean;
  compact?: boolean;
  moduleCount?: number;
  studentCount?: number;
}

export function ClassCard({ classItem, priority, compact, moduleCount, studentCount }: ClassCardProps) {
  const now = new Date();
  const isEnded = classItem.endDate < now;
  const status = isEnded ? "Ended" : "Active";

  return (
    <Link 
      href={`/academy/classes/${classItem.id}`}
      className="block w-full group"
    >
      <Card className="overflow-hidden w-full h-full flex flex-col transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-2 hover:shadow-2xl active:scale-105">
        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Top Section: Logo/Thumbnail on left, Title and info on right */}
          <div className="flex items-start gap-4 mb-4">
            {/* Circular Logo/Thumbnail */}
            <div className="flex-shrink-0">
              {classItem.thumbnail ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={classItem.thumbnail}
                    alt={classItem.title}
                    fill
                    sizes="64px"
                    priority={priority}
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
              )}
            </div>
            
            {/* Title and Key Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-1 truncate">{classItem.title}</h3>
              {classItem.category && (
                <p className="text-sm text-muted-foreground truncate">{classItem.category}</p>
              )}
            </div>
          </div>

          {/* Bottom Section: Three columns with structured info */}
          {!compact && (
            <div className="grid grid-cols-3 gap-4 mt-auto pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className={`text-sm font-medium ${
                  isEnded 
                    ? "text-red-700 dark:text-red-600" 
                    : "text-green-700 dark:text-green-600"
                }`}>
                  {status}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modules</p>
                <p className="text-sm font-medium">
                  {moduleCount !== undefined ? `${moduleCount}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Students</p>
                <p className="text-sm font-medium">
                  {studentCount !== undefined ? `${studentCount}` : "—"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

