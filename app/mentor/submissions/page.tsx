"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMentor } from "@/lib/hooks/use-mentor";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  getAllClasses,
  getAssignmentSubmissions,
  updateSubmissionStatus,
  Class,
  AssignmentSubmission,
  SubmissionStatus,
} from "@/lib/classes";
import { getClassAssignments } from "@/lib/classroom";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  GitBranch,
  File,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface SubmissionWithDetails extends AssignmentSubmission {
  assignmentTitle: string;
  className: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
}

export default function MentorSubmissionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMentor, loading: mentorLoading } = useMentor();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"approved" | "changes_requested">("approved");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (!mentorLoading && !isMentor) {
      router.replace("/");
      return;
    }

    if (isMentor && user) {
      loadSubmissions();
    }
  }, [mentorLoading, isMentor, user, router]);

  const loadSubmissions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const learningSupabase = createLearningClient();
      if (!learningSupabase) {
        return;
      }

      // Get all classes created by mentor
      const mentorClasses = await getAllClasses({ createdBy: user.id }, learningSupabase);

      // Get all assignments for mentor's classes
      const allAssignments: Array<{ assignment: any; classId: string; className: string }> = [];
      for (const classItem of mentorClasses) {
        const assignments = await getClassAssignments(classItem.id, learningSupabase);
        assignments.forEach((assignment) => {
          allAssignments.push({
            assignment,
            classId: classItem.id,
            className: classItem.title,
          });
        });
      }

      // Get all submissions for these assignments
      const authSupabase = createClient();
      const submissionsWithDetails: SubmissionWithDetails[] = [];

      for (const { assignment, classId, className } of allAssignments) {
        const assignmentSubs = await getAssignmentSubmissions(assignment.id, learningSupabase);

        for (const submission of assignmentSubs) {
          // Get student profile
          try {
            const profile = await getUserProfile(submission.userId, undefined, authSupabase);
            submissionsWithDetails.push({
              ...submission,
              assignmentTitle: assignment.title,
              className,
              studentName:
                profile?.first_name ||
                profile?.username ||
                profile?.email?.split("@")[0] ||
                "Unknown User",
              studentEmail: profile?.email || "Unknown",
              studentAvatar: profile?.image_url || undefined,
            });
          } catch {
            submissionsWithDetails.push({
              ...submission,
              assignmentTitle: assignment.title,
              className,
              studentName: "Unknown User",
              studentEmail: "Unknown",
            });
          }
        }
      }

      // Sort by submitted date (newest first)
      submissionsWithDetails.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

      setSubmissions(submissionsWithDetails);
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedSubmission || !user) return;

    setReviewing(true);
    try {
      const supabase = createLearningClient();
      if (!supabase) {
        return;
      }

      const updated = await updateSubmissionStatus(
        selectedSubmission.id,
        reviewStatus,
        feedback || undefined,
        user.id,
        supabase
      );

      if (updated) {
        setReviewDialogOpen(false);
        setFeedback("");
        loadSubmissions();
      }
    } catch (error) {
      console.error("Error reviewing submission:", error);
    } finally {
      setReviewing(false);
    }
  };

  if (mentorLoading || loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-height-[300px]">
          <p className="text-base text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isMentor) {
    return null;
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = submissions.filter((s) => s.status === "submitted" || s.status === "late").length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const totalCount = submissions.length;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mentor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mentor Panel
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Submissions</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Review and grade assignment submissions from your students.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student, assignment, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | "all")}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="late">Late</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No submissions found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "No submissions have been made yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Student Avatar */}
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {submission.studentAvatar ? (
                      <Image
                        src={submission.studentAvatar}
                        alt={submission.studentName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-medium">
                        {submission.studentName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Submission Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{submission.assignmentTitle}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {submission.studentName} • {submission.className}
                        </p>

                        {/* Submission Content */}
                        <div className="space-y-2 mb-3">
                          {submission.submissionContent && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">{submission.submissionContent}</p>
                            </div>
                          )}

                          {submission.submissionUrl && (
                            <a
                              href={submission.submissionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Submission URL
                            </a>
                          )}

                          {submission.gitUrl && (
                            <a
                              href={submission.gitUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <GitBranch className="h-4 w-4" />
                              {submission.repoDirectory
                                ? `${submission.gitUrl} (${submission.repoDirectory})`
                                : submission.gitUrl}
                            </a>
                          )}

                          {submission.submissionFileUrl && (
                            <a
                              href={submission.submissionFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <File className="h-4 w-4" />
                              Download Submission File
                            </a>
                          )}
                        </div>

                        {/* Status and Dates */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge
                            variant={
                              submission.status === "approved"
                                ? "default"
                                : submission.status === "changes_requested"
                                ? "destructive"
                                : submission.status === "late"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {submission.status === "submitted" && <Clock className="h-3 w-3 mr-1" />}
                            {submission.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {submission.status === "changes_requested" && (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {submission.status}
                          </Badge>
                          {submission.isLate && (
                            <Badge variant="destructive" className="text-xs">
                              Late
                            </Badge>
                          )}
                          <span className="text-muted-foreground">
                            Submitted: {format(submission.submittedAt, "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          {submission.reviewedAt && (
                            <span className="text-muted-foreground">
                              Reviewed: {format(submission.reviewedAt, "MMM d, yyyy")}
                            </span>
                          )}
                        </div>

                        {/* Feedback */}
                        {submission.feedback && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Feedback:</p>
                            <p className="text-sm whitespace-pre-wrap">{submission.feedback}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {(submission.status === "submitted" || submission.status === "late") && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setFeedback(submission.feedback || "");
                              setReviewStatus("approved");
                              setReviewDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        )}
                        {submission.status !== "submitted" && submission.status !== "late" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setFeedback(submission.feedback || "");
                              setReviewStatus(
                                submission.status === "approved" ? "approved" : "changes_requested"
                              );
                              setReviewDialogOpen(true);
                            }}
                          >
                            Update Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Provide feedback and approve or request changes for this submission.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Assignment:</p>
                <p className="text-sm text-muted-foreground">{selectedSubmission.assignmentTitle}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Student:</p>
                <p className="text-sm text-muted-foreground">{selectedSubmission.studentName}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="approved"
                      checked={reviewStatus === "approved"}
                      onChange={(e) => setReviewStatus(e.target.value as "approved")}
                    />
                    <span className="text-sm">Approved</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="changes_requested"
                      checked={reviewStatus === "changes_requested"}
                      onChange={(e) => setReviewStatus(e.target.value as "changes_requested")}
                    />
                    <span className="text-sm">Changes Requested</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Feedback:</label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback for the student..."
                  rows={6}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReview} disabled={reviewing}>
                  {reviewing ? "Saving..." : "Submit Review"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

