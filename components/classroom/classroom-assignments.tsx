"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Upload, CheckCircle2, Clock, FileText, ExternalLink, Download } from "lucide-react";
import { format } from "date-fns";
import type { ClassWithModules } from "@/lib/classes";
import {
  getClassAssignments,
  getUserSubmission,
  submitAssignment,
  gradeSubmission,
} from "@/lib/classroom";
import { getAssignmentSubmissions } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { notifyAssignmentGraded } from "@/lib/classroom-notifications";
import { uploadFile } from "@/lib/storage";

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
  const [allSubmissions, setAllSubmissions] = useState<Record<string, any[]>>({});
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const loadData = async () => {
      const supabase = createLearningClient();
      if (!supabase) return;

      try {
        const assignmentsList = await getClassAssignments(classId, supabase);
        setAssignments(assignmentsList);

        if (isInstructor) {
          // Load all submissions for each assignment
          const allSubs: Record<string, any[]> = {};
          for (const assignment of assignmentsList) {
            const subs = await getAssignmentSubmissions(assignment.id, supabase);
            allSubs[assignment.id] = subs;
          }
          setAllSubmissions(allSubs);
        } else {
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
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleFileUpload = async (assignment: any, file: File) => {
    setSubmitting(true);
    try {
      const supabase = createLearningClient();
      if (!supabase) return;

      // Upload file to Supabase storage
      const fileUrl = await uploadFile(
        `assignments/${assignment.id}/${userId}/${file.name}`,
        file,
        supabase
      );

      if (fileUrl) {
        const submission = await submitAssignment(
          assignment.id,
          userId,
          classId,
          { fileUrl },
          supabase
        );

        if (submission) {
          setSubmissions((prev) => ({
            ...prev,
            [assignment.id]: submission,
          }));
        }
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Error submitting assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No assignments available yet.</p>
          </CardContent>
        </Card>
      ) : (
        assignments.map((assignment) => {
          const submission = submissions[assignment.id];
          const assignmentSubmissions = allSubmissions[assignment.id] || [];
          const dueDateMs = new Date(assignment.dueDate).getTime();
          const remainingMs = dueDateMs - now;
          const isPastDue = remainingMs <= 0;
          const isSelected = selectedAssignment === assignment.id;

          return (
            <Card key={assignment.id} id={`assignment-${assignment.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{assignment.title}</CardTitle>
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mt-2">{assignment.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Due: {format(assignment.dueDate, "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      {!isPastDue && (
                        <div className="flex items-center gap-1 text-primary font-medium">
                          <Clock className="h-4 w-4" />
                          <span>Time remaining: {formatCountdown(remainingMs)}</span>
                        </div>
                      )}
                      {isPastDue && (
                        <span className="text-red-700 dark:text-red-600">Past Due</span>
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
                  <>
                    <div>
                      <h4 className="text-sm font-semibold mb-3">
                        Submissions ({assignmentSubmissions.length})
                      </h4>
                      {assignmentSubmissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No submissions yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {assignmentSubmissions.map((sub) => (
                            <SubmissionCard
                              key={sub.id}
                              submission={sub}
                              assignment={assignment}
                              onGrade={(grade, feedback, status) => {
                                handleGradeSubmission(sub.id, grade, feedback, status);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {submission ? (
                      <div className="space-y-3">
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">Your Submission</span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                submission.status === "approved"
                                  ? "bg-green-500/10 text-green-700 dark:text-green-600"
                                  : submission.status === "changes_requested"
                                  ? "bg-orange-500/10 text-orange-600"
                                  : "bg-blue-500/10 text-blue-600"
                              }`}
                            >
                              {submission.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Submitted: {format(submission.submittedAt, "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          {submission.submissionFileUrl && (
                            <a
                              href={submission.submissionFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              View Submission
                            </a>
                          )}
                          {submission.submissionUrl && (
                            <a
                              href={submission.submissionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {submission.submissionUrl}
                            </a>
                          )}
                          {submission.grade !== null && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold">Grade: {submission.grade}</p>
                            </div>
                          )}
                          {submission.feedback && (
                            <div className="mt-2 p-3 bg-background rounded border">
                              <p className="text-sm font-semibold mb-1">Feedback:</p>
                              <p className="text-sm whitespace-pre-wrap">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!isPastDue || !assignment.lockAfterDeadline ? (
                          <AssignmentSubmissionForm
                            assignment={assignment}
                            onSubmit={handleFileUpload}
                            submitting={submitting}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            This assignment is locked. The deadline has passed.
                          </p>
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

  async function handleGradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string,
    status: "approved" | "changes_requested"
  ) {
    try {
      const supabase = createLearningClient();
      if (!supabase) return;

      const updated = await gradeSubmission(
        submissionId,
        grade,
        feedback,
        status,
        userId,
        supabase
      );

      if (updated) {
        // Send notification to student
        const authSupabase = createClient();
        if (authSupabase) {
          // Get assignment title
          const assignment = assignments.find(a => a.id === updated.assignmentId);
          if (assignment) {
            await notifyAssignmentGraded(
              updated.userId,
              updated.classId,
              assignment.title,
              authSupabase,
              grade,
              status
            );
          }
        }
        
        setAllSubmissions((prev) => ({
          ...prev,
          [updated.assignmentId]: (prev[updated.assignmentId] || []).map((s) =>
            s.id === updated.id ? updated : s
          ),
        }));
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      alert("Error grading submission. Please try again.");
    }
  }
}

function AssignmentSubmissionForm({
  assignment,
  onSubmit,
  submitting,
}: {
  assignment: any;
  onSubmit: (assignment: any, file: File) => void;
  submitting: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [submissionType, setSubmissionType] = useState<"file" | "url">("file");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionType === "file" && file) {
      onSubmit(assignment, file);
    } else if (submissionType === "url" && url) {
      // Handle URL submission
      const supabase = createLearningClient();
      if (!supabase) return;
      submitAssignment(assignment.id, "", assignment.classId, { url }, supabase);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Submission Type</Label>
        <div className="flex gap-4 mt-2">
          <Button
            type="button"
            variant={submissionType === "file" ? "default" : "outline"}
            onClick={() => setSubmissionType("file")}
          >
            File Upload
          </Button>
          <Button
            type="button"
            variant={submissionType === "url" ? "default" : "outline"}
            onClick={() => setSubmissionType("url")}
          >
            URL
          </Button>
        </div>
      </div>

      {submissionType === "file" ? (
        <div>
          <Label htmlFor="file">Upload File</Label>
          <Input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="mt-2"
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="url">Submission URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
            className="mt-2"
          />
        </div>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Assignment"}
      </Button>
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

