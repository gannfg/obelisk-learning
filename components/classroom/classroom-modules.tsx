"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Calendar, ExternalLink, FileText, Video, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import type { ClassModule } from "@/types/classes";
import type { ClassWithModules } from "@/lib/classes";
import { getModuleAssignments } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { MarkdownContent } from "@/components/markdown-content";
import { ModuleEditor } from "./module-editor";

interface ClassroomModulesProps {
  classId: string;
  classItem: ClassWithModules;
  userId: string;
  isInstructor: boolean;
}

export function ClassroomModules({
  classId,
  classItem,
  userId,
  isInstructor,
}: ClassroomModulesProps) {
  const [modules, setModules] = useState<ClassModule[]>(classItem.modules || []);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [assignmentsByModule, setAssignmentsByModule] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const loadAssignments = async () => {
      const supabase = createLearningClient();
      if (!supabase) return;

      const assignmentsMap: Record<string, any[]> = {};
      for (const module of modules) {
        const assignments = await getModuleAssignments(module.id, supabase);
        assignmentsMap[module.id] = assignments;
      }
      setAssignmentsByModule(assignmentsMap);
    };

    loadAssignments();
  }, [modules]);

  const canAccessModule = (module: ClassModule) => {
    if (isInstructor) return true;
    if (!module.locked) return true;
    if (module.releaseDate && new Date(module.releaseDate) <= new Date()) return true;
    return false;
  };

  const handleModuleUpdate = (updatedModule: ClassModule) => {
    setModules((prev) =>
      prev.map((m) => (m.id === updatedModule.id ? updatedModule : m))
    );
    setEditingModule(null);
  };

  return (
    <div className="space-y-6">
      {isInstructor && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              // Create new module - would need a modal/form
              window.location.href = `/admin/classes/${classId}/modules/new`;
            }}
          >
            Add Module
          </Button>
        </div>
      )}

      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No modules available yet.</p>
          </CardContent>
        </Card>
      ) : (
        modules.map((module) => {
          const canAccess = canAccessModule(module);
          const assignments = assignmentsByModule[module.id] || [];

          return (
            <Card key={module.id} className={!canAccess ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {canAccess ? (
                        <Unlock className="h-4 w-4 text-green-600" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle>
                        Week {module.weekNumber}: {module.title}
                      </CardTitle>
                    </div>
                    {module.description && (
                      <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {module.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Starts: {format(new Date(module.startDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {module.endDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Ends: {format(new Date(module.endDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {!canAccess && (
                        <span className="text-orange-600">🔒 Locked</span>
                      )}
                    </div>
                  </div>
                  {isInstructor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingModule(editingModule === module.id ? null : module.id)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>

              {canAccess && (
                <CardContent className="space-y-4">
                  {/* Module Content */}
                  {module.content && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {typeof module.content === "string" ? (
                        <MarkdownContent content={module.content} />
                      ) : (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(module.content, null, 2)}</pre>
                      )}
                    </div>
                  )}

                  {/* Learning Materials */}
                  {module.learningMaterials && module.learningMaterials.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Learning Materials</h4>
                      <div className="space-y-2">
                        {module.learningMaterials.map((material, idx) => (
                          <a
                            key={idx}
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            {material.type === "document" && <FileText className="h-4 w-4" />}
                            {material.type === "video" && <Video className="h-4 w-4" />}
                            {material.type === "link" && <LinkIcon className="h-4 w-4" />}
                            {material.type === "file" && <FileText className="h-4 w-4" />}
                            <span>{material.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live Session Link */}
                  {module.liveSessionLink && (
                    <div>
                      <Button asChild variant="outline" className="w-full">
                        <a href={module.liveSessionLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Live Session
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Assignment Preview */}
                  {assignments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Assignments</h4>
                      <div className="space-y-2">
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              window.location.href = `/class/${classId}?tab=assignments#assignment-${assignment.id}`;
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{assignment.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Due: {format(assignment.dueDate, "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}

              {!canAccess && (
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-4">
                    This module will be unlocked on{" "}
                    {module.releaseDate
                      ? format(new Date(module.releaseDate), "MMM d, yyyy")
                      : module.startDate
                      ? format(new Date(module.startDate), "MMM d, yyyy")
                      : "the scheduled date"}
                  </p>
                </CardContent>
              )}

              {/* Module Editor (Instructor) */}
              {isInstructor && editingModule === module.id && (
                <CardContent className="border-t">
                  <ModuleEditor
                    module={module}
                    classId={classId}
                    onUpdate={handleModuleUpdate}
                    onCancel={() => setEditingModule(null)}
                  />
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

