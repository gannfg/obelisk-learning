import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectWithMembers } from "@/lib/projects";
import { FolderKanban } from "lucide-react";

interface HorizontalProjectCardProps {
  project: ProjectWithMembers;
}

export function HorizontalProjectCard({ project }: HorizontalProjectCardProps) {
  return (
    <Link 
      href={`/academy/projects/${project.id}`}
      className="block w-full group"
    >
      <Card className="overflow-hidden w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Small Image/Icon on Left */}
            <div className="flex-shrink-0">
              {project.thumbnail ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <FolderKanban className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <h3 className="text-base font-semibold truncate mb-1">
                  {project.title}
                </h3>
                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {project.description}
                  </p>
                )}
              </div>
              
              {/* Tags/Metadata */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                {project.difficulty && (
                  <>
                    <span className="capitalize">{project.difficulty}</span>
                    <span>•</span>
                  </>
                )}
                {project.memberCount !== undefined && project.memberCount > 0 && (
                  <>
                    <span>{project.memberCount} members</span>
                    {project.tags && project.tags.length > 0 && <span>•</span>}
                  </>
                )}
                {project.tags && project.tags.length > 0 && (
                  <span>{project.tags.slice(0, 2).join(", ")}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

