import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Class } from "@/types";
import { format } from "date-fns";

interface ClassCardProps {
  classItem: Class;
  priority?: boolean;
}

export function ClassCard({ classItem, priority }: ClassCardProps) {
  return (
    <Link 
      href={`/academy/classes/${classItem.id}`}
      className="block w-full group"
    >
      <Card className="overflow-hidden w-full transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-2 hover:shadow-2xl active:scale-105">
        {classItem.thumbnail ? (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={classItem.thumbnail}
              alt={classItem.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-4xl">📚</span>
          </div>
        )}
        <CardContent className="p-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            {classItem.category && (
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {classItem.category}
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
          <h3 className="mb-2 text-xl font-semibold">{classItem.title}</h3>
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {classItem.description || "No description available."}
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-medium">Semester:</span> {classItem.semester}
            </p>
            <p>
              <span className="font-medium">Starts:</span> {format(classItem.startDate, "MMM d, yyyy")}
            </p>
            {classItem.maxCapacity && (
              <p>
                <span className="font-medium">Capacity:</span> {classItem.maxCapacity} students
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <span className="text-sm font-medium text-foreground">
            {classItem.published ? "Published" : "Draft"}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

