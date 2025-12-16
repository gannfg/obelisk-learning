"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Calendar, ExternalLink, FileText, Video, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import type { ClassModule, AssignmentSubmission } from "@/types/classes";
import type { ClassWithModules } from "@/lib/classes";
import { getModuleAssignments, getClassModules } from "@/lib/classes";
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
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Record<string, AssignmentSubmission[]>>({});
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);

  useEffect(() => {
    // Always refresh modules from backend to avoid stale/empty data
    const loadModules = async () => {
      const supabase = createLearningClient();
      if (!supabase) return;
      try {
        const fresh = await getClassModules(classId, supabase);
        if (fresh && fresh.length > 0) {
          setModules(fresh);
        }
      } catch (error) {
        console.error("Error loading modules:", error);
      }
    };

    loadModules();
  }, [classId]);

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

  // Load current user's submissions for the assignments in these modules
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!userId) return;
      const supabase = createLearningClient();
      if (!supabase) return;

      const assignmentIds = Object.values(assignmentsByModule)
        .flat()
        .map((a) => a.id)
        .filter(Boolean);

      if (assignmentIds.length === 0) {
        setSubmissionsByAssignment({});
        return;
      }

      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*")
        .in("assignment_id", assignmentIds)
        .eq("user_id", userId);

      if (error) {
        console.error("Error loading assignment submissions:", error.message || error);
        return;
      }

      const map: Record<string, AssignmentSubmission[]> = {};
      (data || []).forEach((submission: any) => {
        const assignmentId = submission.assignment_id;
        if (!map[assignmentId]) map[assignmentId] = [];
        map[assignmentId].push({
          id: submission.id,
          assignmentId: submission.assignment_id,
          classId: submission.class_id,
          userId: submission.user_id,
          status: submission.status,
          isLate: Boolean(submission.is_late),
          submittedAt: submission.submitted_at
            ? new Date(submission.submitted_at)
            : new Date(),
          updatedAt: submission.updated_at ? new Date(submission.updated_at) : new Date(),
          feedback: submission.feedback ?? undefined,
          submissionContent: submission.content ?? undefined,
          submissionUrl: submission.submission_url ?? undefined,
          submissionFileUrl: submission.submission_file_url ?? undefined,
          gitUrl: submission.git_url ?? undefined,
          repoDirectory: submission.repo_directory ?? undefined,
          reviewedBy: submission.reviewed_by ?? undefined,
          reviewedAt: submission.reviewed_at ? new Date(submission.reviewed_at) : undefined,
        } as AssignmentSubmission);
      });

      setSubmissionsByAssignment(map);
    };

    loadSubmissions();
  }, [assignmentsByModule, userId]);

  const canAccessModule = (module: ClassModule) => {
    if (isInstructor) return true;
    if (!module.locked) return true;
    if (module.releaseDate && new Date(module.releaseDate) <= new Date()) return true;
    return false;
  };

  // Determine if a module is completed: all assignments approved/reviewed, or no assignments
  const isModuleCompleted = (moduleId: string) => {
    const assignments = assignmentsByModule[moduleId] || [];
    if (assignments.length === 0) return true;

    return assignments.every((assignment) => {
      const submissions = submissionsByAssignment[assignment.id] || [];
      return submissions.some(
        (sub) => sub.status === "approved" || sub.status === "reviewed"
      );
    });
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
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {modules.map((module, idx) => {
          // Sequential gating: only allow access if all prior modules are completed
          const previousModulesCompleted = modules
            .slice(0, idx)
            .every((m) => isModuleCompleted(m.id));
          const canAccess = canAccessModule(module) && previousModulesCompleted;
          const assignments = assignmentsByModule[module.id] || [];

          return (
            <div key={module.id} className={!canAccess ? "opacity-60" : ""}>
              <button
                type="button"
                className="w-full flex items-stretch text-left hover:bg-muted/60 transition-colors"
                onClick={() =>
                  setOpenModuleId((prev) => (prev === module.id ? null : module.id))
                }
              >
                <div className="w-28 flex items-center justify-center border-r px-4 py-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Week {module.weekNumber}
                  </span>
                </div>
                <div className="flex-1 px-4 py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm sm:text-base">
                        {module.title}
                      </span>
                      {!canAccess && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600">
                          Locked
                        </span>
                      )}
                    </div>
                    {module.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {module.description}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {module.startDate && (
                        <span>
                          Starts: {format(new Date(module.startDate), "MMM d")}
                        </span>
                      )}
                      {module.endDate && (
                        <span>
                          Ends: {format(new Date(module.endDate), "MMM d")}
                        </span>
                      )}
                      {assignments.length > 0 && (
                        <span>{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground">
                    {isModuleCompleted(module.id) ? "Completed" : "In progress"}
                  </div>
                </div>
              </button>

              {canAccess && openModuleId === module.id && (
                <div className="px-4 pb-5 bg-muted/40 space-y-4">
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
                </div>
              )}

              {!canAccess && (
                <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                  {previousModulesCompleted ? (
                    <p>
                      This module will be unlocked on{" "}
                      {module.releaseDate
                        ? format(new Date(module.releaseDate), "MMM d, yyyy")
                        : module.startDate
                        ? format(new Date(module.startDate), "MMM d, yyyy")
                        : "the scheduled date"}
                    </p>
                  ) : (
                    <p>
                      Complete the previous module to unlock this one.
                    </p>
                  )}
                </div>
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
            </div>
          );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

