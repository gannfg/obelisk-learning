"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Upload, CheckCircle2, Clock, FileText, ExternalLink, Trophy, Download } from "lucide-react";
import { format } from "date-fns";
import type { ClassWithModules } from "@/lib/classes";
import {
  getClassAssignments,
  getUserSubmission,
  submitAssignment,
} from "@/lib/classroom";
import { getModuleAssignments, getClassModules } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { uploadFile } from "@/lib/storage";
import { StatusBadge } from "./status-badge";
import { useToast } from "@/components/ui/toaster";
import Link from "next/link";

interface ClassroomAssignmentsProps {
  classId: string;
  classItem: ClassWithModules;
  userId: string;
  isInstructor: boolean;
}

export function ClassroomAssignments({
  classId,
  classItem,
  userId,
  isInstructor,
}: ClassroomAssignmentsProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(Date.now());
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "late">("all");
  const [modulesMap, setModulesMap] = useState<Record<string, { weekNumber: number; title: string }>>({});
  const toast = useToast();

  useEffect(() => {
    const loadData = async () => {
      const supabase = createLearningClient();
      if (!supabase) return;

      try {
        // Load modules to map assignment to week
        const modules = await getClassModules(classId, supabase);
        const modulesMapData: Record<string, { weekNumber: number; title: string }> = {};
        modules.forEach((mod: any) => {
          modulesMapData[mod.id] = { weekNumber: mod.week_number, title: mod.title };
        });
        setModulesMap(modulesMapData);

        const assignmentsList = await getClassAssignments(classId, supabase);
        setAssignments(assignmentsList);

        if (!isInstructor) {
          // Load user's submissions
          const userSubs: Record<string, any> = {};
          for (const assignment of assignmentsList) {
            const sub = await getUserSubmission(assignment.id, userId, supabase);
            if (sub) {
              userSubs[assignment.id] = sub;
            }
          }
          setSubmissions(userSubs);
        }
      } catch (error) {
        console.error("Error loading assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classId, userId, isInstructor]);

  // Ticking clock for countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "Expired";
    const totalSeconds = Math.floor(ms / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalSeconds / 3600);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    
    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
    } else if (hours > 0) {
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}, ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`;
    } else {
      const minutes = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      if (minutes > 0) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, ${secs} ${secs === 1 ? 'second' : 'seconds'} left`;
      } else {
        return `${secs} ${secs === 1 ? 'second' : 'seconds'} left`;
      }
    }
  };

  const handleSubmission = async (
    assignment: any,
    submissionData: {
      file?: File;
      url?: string;
      content?: string;
      gitUrl?: string;
      repoDirectory?: string;
    }
  ) => {
    setSubmitting(true);
    try {
      const supabase = createLearningClient();
      if (!supabase) {
        toast.error("Connection Error", "Unable to connect. Please refresh the page.");
        return;
      }

      let submissionPayload: {
        fileUrl?: string;
        url?: string;
        content?: string;
        gitUrl?: string;
        repoDirectory?: string;
      } = {};

      // Handle file upload
      if (submissionData.file) {
        const fileUrl = await uploadFile(
          `assignments/${assignment.id}/${userId}/${submissionData.file.name}`,
          submissionData.file,
          supabase
        );

        if (!fileUrl) {
          toast.error("Upload Failed", "Error uploading file. Please try again.");
          setSubmitting(false);
          return;
        }

        submissionPayload.fileUrl = fileUrl;
      } else if (submissionData.url) {
        submissionPayload.url = submissionData.url;
      } else if (submissionData.content) {
        submissionPayload.content = submissionData.content;
      } else if (submissionData.gitUrl) {
        submissionPayload.gitUrl = submissionData.gitUrl;
        if (submissionData.repoDirectory) {
          submissionPayload.repoDirectory = submissionData.repoDirectory;
        }
      }

      // Get authenticated user to ensure userId matches
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error("Authentication Required", "You must be logged in to submit assignments.");
        setSubmitting(false);
        return;
      }
      
      // Use authenticated user ID to ensure RLS policies work
      const effectiveUserId = authUser.id;
      
      // Submit assignment
      const submission = await submitAssignment(
        assignment.id,
        effectiveUserId,
        classId,
        submissionPayload,
        supabase
      );

      if (submission) {
        // Update submissions state with the new submission
        setSubmissions((prev) => ({
          ...prev,
          [assignment.id]: {
            id: submission.id,
            assignmentId: submission.assignmentId,
            userId: submission.userId,
            classId: submission.classId,
            status: submission.status,
            isLate: submission.isLate,
            submittedAt: submission.submittedAt,
            updatedAt: submission.updatedAt,
            feedback: submission.feedback,
            submissionContent: submission.submissionContent,
            submissionUrl: submission.submissionUrl,
            submissionFileUrl: submission.submissionFileUrl,
            gitUrl: submission.gitUrl,
            repoDirectory: submission.repoDirectory,
            reviewedBy: submission.reviewedBy,
            reviewedAt: submission.reviewedAt,
            grade: submission.grade,
          },
        }));

        // Reload assignments to refresh the list
        const assignmentsList = await getClassAssignments(classId, supabase);
        setAssignments(assignmentsList);
        
        // Reload user's submission to refresh the UI
        const updatedSubmission = await getUserSubmission(assignment.id, userId, supabase);
        if (updatedSubmission) {
          setSubmissions((prev) => ({
            ...prev,
            [assignment.id]: {
              id: updatedSubmission.id,
              assignmentId: updatedSubmission.assignmentId,
              userId: updatedSubmission.userId,
              classId: updatedSubmission.classId,
              status: updatedSubmission.status,
              isLate: updatedSubmission.isLate,
              submittedAt: updatedSubmission.submittedAt,
              updatedAt: updatedSubmission.updatedAt,
              feedback: updatedSubmission.feedback,
              submissionContent: updatedSubmission.submissionContent,
              submissionUrl: updatedSubmission.submissionUrl,
              submissionFileUrl: updatedSubmission.submissionFileUrl,
              gitUrl: updatedSubmission.gitUrl,
              repoDirectory: updatedSubmission.repoDirectory,
              reviewedBy: updatedSubmission.reviewedBy,
              reviewedAt: updatedSubmission.reviewedAt,
              grade: updatedSubmission.grade,
            },
          }));
        }
        
        // Show success message
        toast.success(
          "Assignment Submitted",
          submission.isLate 
            ? "Your assignment has been submitted (marked as late)."
            : "Your assignment has been submitted successfully!"
        );
      } else {
        toast.error("Submission Failed", "Error submitting assignment. Please try again.");
      }
    } catch (error: any) {
      console.error("Error submitting assignment:", error);
      const errorMessage = error?.message || "An unexpected error occurred. Please try again.";
      toast.error("Submission Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine assignment status
  const getAssignmentStatus = (assignment: any, submission: any, isPastDue: boolean): "completed" | "in-progress" | "pending" | "overdue" => {
    if (!submission) {
      return isPastDue ? "overdue" : "pending";
    }
    if (submission.status === "approved" || submission.status === "reviewed") {
      return "completed";
    }
    return "in-progress";
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "all") return true;
    const submission = submissions[assignment.id];
    const dueDateMs = new Date(assignment.dueDate).getTime();
    const isPastDue = dueDateMs - now <= 0;
    const status = getAssignmentStatus(assignment, submission, isPastDue);
    
    if (filter === "pending") return status === "pending";
    if (filter === "completed") return status === "completed";
    if (filter === "late") return status === "overdue";
    return true;
  });

  if (loading) {
    return <div className="text-center py-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      {!isInstructor && assignments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({assignments.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pending ({assignments.filter(a => !submissions[a.id] && new Date(a.dueDate).getTime() - now > 0).length})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed ({assignments.filter(a => {
              const sub = submissions[a.id];
              return sub && (sub.status === "approved" || sub.status === "reviewed");
            }).length})
          </Button>
          <Button
            variant={filter === "late" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("late")}
          >
            Late ({assignments.filter(a => !submissions[a.id] && new Date(a.dueDate).getTime() - now <= 0).length})
          </Button>
        </div>
      )}

      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No assignments found.</p>
          </CardContent>
        </Card>
      ) : (
        filteredAssignments.map((assignment) => {
          const submission = submissions[assignment.id];
          const dueDateMs = new Date(assignment.dueDate).getTime();
          const remainingMs = dueDateMs - now;
          const isPastDue = remainingMs <= 0;
          const isSelected = selectedAssignment === assignment.id;
          const status = getAssignmentStatus(assignment, submission, isPastDue);
          const moduleInfo = modulesMap[assignment.moduleId];

          return (
            <Card key={assignment.id} id={`assignment-${assignment.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{assignment.title}</CardTitle>
                      <StatusBadge status={status} size="sm" />
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mt-2">{assignment.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      {moduleInfo && (
                        <div className="flex items-center gap-1">
                          <span>Week {moduleInfo.weekNumber}</span>
                        </div>
                      )}
                      {assignment.xpReward > 0 && (
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                          <Trophy className="h-4 w-4" />
                          <span>{assignment.xpReward} XP</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Due: {format(assignment.dueDate, "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      {!isPastDue && !submission && (
                        <div className="flex items-center gap-1 text-primary font-medium">
                          <Clock className="h-4 w-4" />
                          <span>Time remaining: {formatCountdown(remainingMs)}</span>
                        </div>
                      )}
                      {isPastDue && !submission && (
                        <span className="text-red-700 dark:text-red-600 font-medium">Past Due</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignment.instructions && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Instructions</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{assignment.instructions}</p>
                    </div>
                  </div>
                )}

                {isInstructor ? (
                  <div className="p-4 border rounded-lg bg-muted/40">
                    <h4 className="text-sm font-semibold mb-2">Instructor grading</h4>
                    <p className="text-sm text-muted-foreground">
                      Assignment grading for this class is managed from the{" "}
                      <span className="font-medium">Admin &amp; Mentor Classes</span> panel.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Open the admin panel, select this class, then use the{" "}
                      <span className="font-medium">Submissions</span> tab to review and grade.
                    </p>
                    <Button asChild size="sm" className="mt-3">
                      <Link href="/admin/classes">Open grading panel</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {submission ? (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">Your Submission</span>
                            <StatusBadge
                              status={
                                submission.status === "approved" || submission.status === "reviewed"
                                  ? "completed"
                                  : submission.status === "changes_requested"
                                  ? "in-progress"
                                  : "in-progress"
                              }
                              size="sm"
                              label={submission.status.replace("_", " ")}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Submitted: {format(submission.submittedAt, "MMM d, yyyy 'at' h:mm a")}
                            {submission.isLate && (
                              <span className="ml-2 text-red-600 dark:text-red-500">(Late)</span>
                            )}
                          </p>
                          
                          {/* Submission Content */}
                          {submission.submissionFileUrl && (
                            <div className="mb-2">
                              <a
                                href={submission.submissionFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <FileText className="h-4 w-4" />
                                View Submission File
                              </a>
                            </div>
                          )}
                          {submission.submissionUrl && (
                            <div className="mb-2">
                              <a
                                href={submission.submissionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                              >
                                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{submission.submissionUrl}</span>
                              </a>
                            </div>
                          )}
                          {submission.gitUrl && (
                            <div className="mb-2">
                              <a
                                href={submission.gitUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                              >
                                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{submission.gitUrl}</span>
                                {submission.repoDirectory && (
                                  <span className="text-muted-foreground"> ({submission.repoDirectory})</span>
                                )}
                              </a>
                            </div>
                          )}
                          {submission.submissionContent && (
                            <div className="mt-2 p-3 bg-background rounded border">
                              <p className="text-sm font-semibold mb-1">Submission:</p>
                              <p className="text-sm whitespace-pre-wrap">{submission.submissionContent}</p>
                            </div>
                          )}
                          
                          {/* Grade */}
                          {submission.grade !== null && submission.grade !== undefined && (
                            <div className="mt-3 p-3 bg-background rounded border">
                              <p className="text-sm font-semibold mb-1">Grade:</p>
                              <p className="text-2xl font-bold">{submission.grade} / 100</p>
                            </div>
                          )}
                          
                          {/* Feedback */}
                          {submission.feedback && (
                            <div className="mt-2 p-3 bg-background rounded border">
                              <p className="text-sm font-semibold mb-1">Instructor Feedback:</p>
                              <p className="text-sm whitespace-pre-wrap">{submission.feedback}</p>
                            </div>
                          )}
                        </div>

                        {/* Resubmit Option - Show if changes requested or if assignment allows resubmission */}
                        {(submission.status === "changes_requested" || submission.status === "submitted" || submission.status === "late") && (!isPastDue || !assignment.lockAfterDeadline) && (
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold">
                                {submission.status === "changes_requested" ? "Resubmit Assignment" : "Update Submission"}
                              </p>
                              {submission.status !== "changes_requested" && (
                                <p className="text-xs text-muted-foreground">
                                  You can update your submission before the deadline
                                </p>
                              )}
                            </div>
                            <AssignmentSubmissionForm
                              assignment={assignment}
                              onSubmit={handleSubmission}
                              submitting={submitting}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!isPastDue || !assignment.lockAfterDeadline ? (
                          <>
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Submit Your Work</h4>
                              <AssignmentSubmissionForm
                                assignment={assignment}
                                onSubmit={handleSubmission}
                                submitting={submitting}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">
                              This assignment is locked. The deadline has passed.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

}

function AssignmentSubmissionForm({
  assignment,
  onSubmit,
  submitting,
}: {
  assignment: any;
  onSubmit: (assignment: any, submissionData: { file?: File; url?: string; content?: string; gitUrl?: string; repoDirectory?: string }) => Promise<void>;
  submitting: boolean;
}) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [gitUrl, setGitUrl] = useState("");
  const [repoDirectory, setRepoDirectory] = useState("");
  
  // Determine submission type based on assignment's submissionType
  const assignmentSubmissionType = assignment.submissionType || "file";
  const [submissionType, setSubmissionType] = useState<"file" | "url" | "text" | "git">(
    assignmentSubmissionType === "text" ? "text" :
    assignmentSubmissionType === "git" ? "git" :
    assignmentSubmissionType === "url" ? "url" : "file"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (submissionType === "file" && file) {
        // Double-check file size and type before submission
        if (assignment.maxFileSize && file.size > assignment.maxFileSize) {
          toast.error(
            "File Too Large",
            `File size exceeds the maximum allowed size of ${(assignment.maxFileSize / 1024 / 1024).toFixed(1)} MB`
          );
          return;
        }
        
        if (assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0) {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          const isAllowed = assignment.allowedFileTypes.some((type: string) => {
            const typeLower = type.toLowerCase();
            return typeLower === fileExtension || 
                   (typeLower.startsWith('.') && typeLower.substring(1) === fileExtension) ||
                   file.type.includes(typeLower);
          });
          
          if (!isAllowed) {
            toast.error(
              "Invalid File Type",
              `File type not allowed. Allowed types: ${assignment.allowedFileTypes.join(", ")}`
            );
            return;
          }
        }
        
        await onSubmit(assignment, { file });
        // Reset form after successful submission
        setFile(null);
      } else if (submissionType === "url" && url.trim()) {
        // Validate URL format
        try {
          new URL(url.trim());
          await onSubmit(assignment, { url: url.trim() });
          // Reset form after successful submission
          setUrl("");
        } catch {
          toast.error("Invalid URL", "Please enter a valid URL (e.g., https://example.com)");
        }
      } else if (submissionType === "text" && content.trim()) {
        await onSubmit(assignment, { content: content.trim() });
        // Reset form after successful submission
        setContent("");
      } else if (submissionType === "git" && gitUrl.trim()) {
        // Validate Git URL format
        try {
          new URL(gitUrl.trim());
          await onSubmit(assignment, { 
            gitUrl: gitUrl.trim(), 
            repoDirectory: repoDirectory.trim() || undefined 
          });
          // Reset form after successful submission
          setGitUrl("");
          setRepoDirectory("");
        } catch {
          toast.error("Invalid Git URL", "Please enter a valid Git repository URL (e.g., https://github.com/username/repo)");
        }
      } else {
        toast.warning("Missing Submission", "Please provide a valid submission.");
      }
    } catch (error) {
      // Error is already handled in the parent handler
      console.error("Submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Submission Type Selector - only show if assignment allows multiple types */}
      {(assignment.submissionType === "file" || assignment.submissionType === "url" || !assignment.submissionType) && (
        <div>
          <Label>Submission Type</Label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {assignment.submissionType !== "text" && assignment.submissionType !== "git" && (
              <>
                <Button
                  type="button"
                  variant={submissionType === "file" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSubmissionType("file")}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  File Upload
                </Button>
                <Button
                  type="button"
                  variant={submissionType === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSubmissionType("url")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  URL
                </Button>
              </>
            )}
            {assignment.submissionType === "text" && (
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled
              >
                <FileText className="h-4 w-4 mr-2" />
                Text Submission
              </Button>
            )}
            {assignment.submissionType === "git" && (
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Git Repository
              </Button>
            )}
          </div>
        </div>
      )}

      {/* File Upload */}
      {submissionType === "file" && (
        <div>
          <Label htmlFor="file">Upload File</Label>
          <Input
            id="file"
            type="file"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                // Validate file size
                if (assignment.maxFileSize && selectedFile.size > assignment.maxFileSize) {
                  toast.error(
                    "File Too Large",
                    `File size exceeds the maximum allowed size of ${(assignment.maxFileSize / 1024 / 1024).toFixed(1)} MB`
                  );
                  e.target.value = "";
                  setFile(null);
                  return;
                }
                
                // Validate file type if specified
                if (assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0) {
                  const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
                  const isAllowed = assignment.allowedFileTypes.some((type: string) => {
                    const typeLower = type.toLowerCase();
                    return typeLower === fileExtension || 
                           (typeLower.startsWith('.') && typeLower.substring(1) === fileExtension) ||
                           selectedFile.type.includes(typeLower);
                  });
                  
                  if (!isAllowed) {
                    toast.error(
                      "Invalid File Type",
                      `File type not allowed. Allowed types: ${assignment.allowedFileTypes.join(", ")}`
                    );
                    e.target.value = "";
                    setFile(null);
                    return;
                  }
                }
                
                setFile(selectedFile);
              } else {
                setFile(null);
              }
            }}
            required
            className="mt-2"
            accept={assignment.allowedFileTypes?.map((t: string) => t.startsWith('.') ? t : `.${t}`).join(",")}
          />
          {assignment.maxFileSize && (
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: {(assignment.maxFileSize / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
          {assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Allowed types: {assignment.allowedFileTypes.join(", ")}
            </p>
          )}
          {file && (
            <div className="mt-2 p-2 bg-muted rounded border">
              <p className="text-xs font-medium">
                Selected: {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Size: {(file.size / 1024).toFixed(1)} KB
                {assignment.maxFileSize && (
                  <span className={`ml-2 ${file.size > assignment.maxFileSize ? "text-red-600" : ""}`}>
                    ({((file.size / assignment.maxFileSize) * 100).toFixed(1)}% of max)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* URL Submission */}
      {submissionType === "url" && (
        <div>
          <Label htmlFor="url">Submission URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-project.com or https://codepen.io/..."
            required
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter the URL of your submitted work (e.g., deployed website, Codepen, etc.)
          </p>
        </div>
      )}

      {/* Text Submission */}
      {submissionType === "text" && (
        <div>
          <Label htmlFor="content">Your Submission</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your submission text here..."
            required
            rows={8}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Write your submission in the text area above.
          </p>
        </div>
      )}

      {/* Git Repository Submission */}
      {submissionType === "git" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="gitUrl">Git Repository URL</Label>
            <Input
              id="gitUrl"
              type="url"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              placeholder="https://github.com/username/repo or https://gitlab.com/username/repo"
              required
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the URL of your Git repository (GitHub, GitLab, etc.)
            </p>
          </div>
          <div>
            <Label htmlFor="repoDirectory">Repository Directory (Optional)</Label>
            <Input
              id="repoDirectory"
              type="text"
              value={repoDirectory}
              onChange={(e) => setRepoDirectory(e.target.value)}
              placeholder="e.g., /src, /project, /assignment-1"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              If your assignment is in a specific directory, specify the path
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting || (submissionType === "file" && !file) || (submissionType === "url" && !url.trim()) || (submissionType === "text" && !content.trim()) || (submissionType === "git" && !gitUrl.trim())}>
          {submitting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Submit Assignment
            </>
          )}
        </Button>
        {submissionType === "file" && file && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFile(null)}
            disabled={submitting}
          >
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}

function SubmissionCard({
  submission,
  assignment,
  onGrade,
}: {
  submission: any;
  assignment: any;
  onGrade: (grade: number, feedback: string, status: "approved" | "changes_requested") => void;
}) {
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState(submission.grade?.toString() || "");
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [showGradeForm, setShowGradeForm] = useState(!submission.grade);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrading(true);
    try {
      const status = parseFloat(grade) >= 70 ? "approved" : "changes_requested";
      onGrade(parseFloat(grade), feedback, status);
      setShowGradeForm(false);
    } catch (error) {
      console.error("Error grading:", error);
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-sm">User {submission.userId.substring(0, 8)}...</p>
          <p className="text-xs text-muted-foreground">
            Submitted: {format(submission.submittedAt, "MMM d, yyyy 'at' h:mm a")}
          </p>
          {submission.isLate && (
            <span className="text-xs text-red-700 dark:text-red-600">Late Submission</span>
          )}
        </div>
        {submission.grade !== null && (
          <span className="text-sm font-semibold">Grade: {submission.grade}</span>
        )}
      </div>

      {submission.submissionFileUrl && (
        <a
          href={submission.submissionFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline mb-2"
        >
          <Download className="h-4 w-4" />
          Download Submission
        </a>
      )}

      {submission.submissionUrl && (
        <a
          href={submission.submissionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline mb-2"
        >
          <ExternalLink className="h-4 w-4" />
          {submission.submissionUrl}
        </a>
      )}

      {showGradeForm ? (
        <form onSubmit={handleGrade} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="grade">Grade (0-100)</Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max="100"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={grading}>
              {grading ? "Grading..." : "Submit Grade"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGradeForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          {submission.feedback && (
            <div className="mt-2 p-2 bg-muted rounded">
              <p className="text-sm whitespace-pre-wrap">{submission.feedback}</p>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => setShowGradeForm(true)}
          >
            {submission.grade ? "Update Grade" : "Add Grade"}
          </Button>
        </>
      )}
    </div>
  );
}

