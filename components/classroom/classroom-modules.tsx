"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Video, Link as LinkIcon, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { ClassModule, AssignmentSubmission } from "@/types/classes";
import type { ClassWithModules } from "@/lib/classes";
import { getModuleAssignments, getClassModules } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { markWeekAttendance } from "@/lib/classroom";

interface ClassroomModulesProps {
  classId: string;
  classItem: ClassWithModules;
  userId: string;
  isInstructor: boolean;
}

type ModuleSection = {
  description?: string;
  youtubeUrl?: string;
};

function getEmbedUrl(raw?: string): string | null {
  if (!raw) return null;
  const url = raw.trim();

  // Convert common YouTube URLs to embed format
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const videoId = u.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    if (u.hostname === "youtu.be") {
      const videoId = u.pathname.replace("/", "");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    // If URL parsing fails, fall back to raw value
  }

  return url;
}

function getModuleSections(module: ClassModule): ModuleSection[] {
  const content = module.content as any;
  if (content && typeof content === "object" && Array.isArray(content.sections)) {
    return content.sections.map((section: any) => ({
      description: section.description || "",
      youtubeUrl: section.youtubeUrl || section.youtube_url || "",
    }));
  }

  // Fallback to single description + YouTube URL from legacy fields
  return [
    {
      description: module.description,
      youtubeUrl: module.embedVideoUrl,
    },
  ];
}

export function ClassroomModules({
  classId,
  classItem,
  userId,
  isInstructor,
}: ClassroomModulesProps) {
  const [modules, setModules] = useState<ClassModule[]>(classItem.modules || []);
  const [assignmentsByModule, setAssignmentsByModule] = useState<Record<string, any[]>>({});
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Record<string, AssignmentSubmission[]>>({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

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

  // Automatically mark attendance when a module is completed
  useEffect(() => {
    if (isInstructor) return; // Only for students

    const markAttendanceForCompletedModules = async () => {
      const supabase = createLearningClient();
      if (!supabase) return;

      for (const module of modules) {
        if (isModuleCompleted(module.id)) {
          try {
            // Check if attendance already marked for this week
            const { data: existingAttendance } = await supabase
              .from("class_attendance")
              .select("id")
              .eq("class_id", classId)
              .eq("user_id", userId)
              .eq("week_number", module.weekNumber)
              .single();

            // Only mark if not already marked
            if (!existingAttendance) {
              const result = await markWeekAttendance(
                classId,
                userId,
                module.weekNumber,
                "auto",
                userId,
                supabase
              );
              if (!result) {
                // If auto method fails (maybe constraint not updated), try with manual
                await markWeekAttendance(
                  classId,
                  userId,
                  module.weekNumber,
                  "manual",
                  userId,
                  supabase
                );
              }
            }
          } catch (error) {
            // Silently fail if attendance already exists or other error
            // Try with manual method as fallback
            try {
              const { data: existing } = await supabase
                .from("class_attendance")
                .select("id")
                .eq("class_id", classId)
                .eq("user_id", userId)
                .eq("week_number", module.weekNumber)
                .single();
              
              if (!existing) {
                await markWeekAttendance(
                  classId,
                  userId,
                  module.weekNumber,
                  "manual",
                  userId,
                  supabase
                );
              }
            } catch (fallbackError) {
              // Silently ignore if still fails
            }
          }
        }
      }
    };

    // Only run if we have modules and assignments loaded
    if (modules.length > 0 && Object.keys(assignmentsByModule).length > 0) {
      markAttendanceForCompletedModules();
    }
  }, [modules, assignmentsByModule, submissionsByAssignment, classId, userId, isInstructor]);

  return (
    <div className="space-y-6">
      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No modules available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => {
            const assignments = assignmentsByModule[module.id] || [];

            const isExpanded = expandedModules.has(module.id);
            const toggleExpand = () => {
              setExpandedModules((prev) => {
                const next = new Set(prev);
                if (next.has(module.id)) {
                  next.delete(module.id);
                } else {
                  next.add(module.id);
                }
                return next;
              });
            };

            return (
              <Card key={module.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={toggleExpand}
                  className="w-full text-left"
                >
                  <CardContent className="p-4">
                    {/* Module Header - Always Visible */}
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-base sm:text-lg flex-1">
                        Week {module.weekNumber}: {module.title}
                      </h3>
                      <div className="text-xs text-muted-foreground">
                        {isModuleCompleted(module.id) ? "Completed" : "In progress"}
                      </div>
                    </div>
                  </CardContent>
                </button>

                {/* Module Content - Only visible when expanded */}
                {isExpanded && (
                  <CardContent className="pt-0 px-4 pb-4">
                    <div className="space-y-4 pl-6">
                      {/* Structured sections: description + YouTube URL pairs */}
                      {getModuleSections(module).map((section, idx) => {
                        const embed = getEmbedUrl(section.youtubeUrl);
                        return (
                          <div key={idx} className="space-y-2">
                            {section.description && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
                                {section.description}
                              </p>
                            )}
                            {embed && (
                              <div className="mt-1 aspect-video w-full overflow-hidden rounded-lg bg-black">
                                <iframe
                                  src={embed}
                                  title={module.title}
                                  className="h-full w-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Date Range */}
                      {module.startDate && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(module.startDate), "MMM d")} -{" "}
                          {module.endDate ? format(new Date(module.endDate), "MMM d") : "TBD"}
                        </p>
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
                      {module.liveSessionLink && module.liveSessionLink.trim().length > 0 && (
                        <div>
                          <Button asChild variant="outline" className="w-full">
                            <a href={module.liveSessionLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Join Live Session
                            </a>
                          </Button>
                        </div>
                      )}

                      {/* Assignments Section - Inside expanded content */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">
                            Assignments ({assignments.length})
                          </p>
                        </div>
                        {assignments.length > 0 ? (
                          <div className="space-y-2">
                            {assignments.map((assignment) => {
                              const submission = submissionsByAssignment[assignment.id]?.[0];
                              return (
                                <div
                                  key={assignment.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/class/${classId}?tab=assignments#assignment-${assignment.id}`;
                                  }}
                                >
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{assignment.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Due: {format(assignment.dueDate, "MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                    {submission && (
                                      <p className={`text-xs mt-1 ${
                                        submission.status === "approved" || submission.status === "reviewed"
                                          ? "text-green-600 dark:text-green-400"
                                          : submission.status === "changes_requested"
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-blue-600 dark:text-blue-400"
                                      }`}>
                                        Status: {submission.status.replace("_", " ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No assignments yet for this module.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}

              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

